import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import artwork from "./assets/artwork.jpg";

export default function App() {
  const [tab, setTab] = useState("home");
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(new Audio());
  const lastScrollY = useRef(0);

  const [iframeSubmitted, setIframeSubmitted] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(1000);
  const [fadeOut, setFadeOut] = useState(false);

  // Dark mode persistence
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
  }, []);
  useEffect(() => {
    document.body.className = darkMode
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-black";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Header scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setShowHeader(!(currentScroll > lastScrollY.current && currentScroll > 80));
      lastScrollY.current = currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch RSS feed and extract <itunes:duration> (with namespace handling)
  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const rssUrl = "https://anchor.fm/s/106116398/podcast/rss";
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
      );
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "application/xml");

      // Helper: Format seconds to H:MM:SS or MM:SS
      const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return "Unknown";
        seconds = Math.round(seconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
          return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m}:${s.toString().padStart(2, "0")}`;
      };

      // Helper: Parse duration string (e.g., "123", "1:23", "1:02:03")
      const parseDurationString = (str) => {
        if (!str) return null;
        if (/^\d+$/.test(str)) return parseInt(str, 10); // seconds
        const parts = str.split(":").map(Number);
        if (parts.some(isNaN)) return null;
        if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
        }
        if (parts.length === 1) {
          return parts[0];
        }
        return null;
      };

      // Helper: Get <itunes:duration> value with namespace handling
      const getItunesDuration = (item) => {
        // Try getElementsByTagNameNS
        let dur = null;
        // Try all known namespace URIs
        const nsURIs = [
          "http://www.itunes.com/dtds/podcast-1.0.dtd",
          "http://www.itunes.com/dtds/podcast-1.0.dtd/",
          "http://www.itunes.com/DTDs/PodCast-1.0.dtd",
          "http://www.itunes.com/DTDs/Podcast-1.0.dtd",
          "http://www.itunes.com/DTDs/Podcast-1.0.dtd/",
          "http://www.itunes.com/DTDs/itunes-1.0.dtd",
          "http://www.itunes.com/DTDs/itunes-1.0.dtd/",
          "http://www.itunes.com/DTDs/itunes-1.0.dtd",
          "http://www.itunes.com/DTDs/itunes-1.0.dtd/",
          "", // fallback for no namespace
        ];
        for (const ns of nsURIs) {
          const el = item.getElementsByTagNameNS(ns, "duration");
          if (el && el.length && el[0].textContent) {
            dur = el[0].textContent;
            break;
          }
        }
        // Fallback: try querySelector with possible CSS escapes
        if (!dur) {
          const el = item.querySelector("itunes\\:duration, duration");
          if (el && el.textContent) dur = el.textContent;
        }
        return dur;
      };

      // Helper: Get duration from audio file (returns Promise)
      const getAudioDuration = (url) => {
        return new Promise((resolve) => {
          if (!url) return resolve(null);
          try {
            const audio = document.createElement("audio");
            audio.preload = "metadata";
            audio.src = url;
            // Some browsers require load() to fire metadata
            const cleanup = () => {
              audio.remove();
            };
            audio.addEventListener("loadedmetadata", function handler() {
              cleanup();
              resolve(audio.duration);
            });
            audio.addEventListener("error", function () {
              cleanup();
              resolve(null);
            });
            // If not loaded within 5s, fallback
            setTimeout(() => {
              cleanup();
              resolve(null);
            }, 5000);
            // Start loading
            audio.load();
          } catch {
            resolve(null);
          }
        });
      };

      // Get all item elements
      const items = Array.from(doc.querySelectorAll("item"));
      // For each item, extract info; if duration missing, collect for audio fetch
      const episodePromises = items.map(async (item) => {
        const title = item.querySelector("title")?.textContent || "Untitled";
        const description = item.querySelector("description")?.textContent || "";
        const pubDate = new Date(item.querySelector("pubDate")?.textContent || "").toDateString();
        const enclosure = { link: item.querySelector("enclosure")?.getAttribute("url") || "" };
        const guid = item.querySelector("guid")?.textContent || "";
        let durationStr = getItunesDuration(item);
        let durationVal = parseDurationString(durationStr);
        if (!durationVal && enclosure.link) {
          // Try to get duration from audio metadata
          durationVal = await getAudioDuration(enclosure.link);
        }
        const duration = durationVal ? formatDuration(durationVal) : "Unknown";
        return {
          title,
          description,
          pubDate,
          enclosure,
          duration,
          guid,
        };
      });
      // Wait for all duration fetches
      const episodes = await Promise.all(episodePromises);
      setEpisodes(episodes);
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
    const interval = setInterval(fetchEpisodes, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Make URLs clickable
  const makeLinksClickable = (html = "") =>
    html.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-500 hover:underline">$1</a>'
    );

  // Audio player logic
  const playTrack = (ep) => {
    if (!ep?.enclosure?.link) return;
    const audio = audioRef.current;
    if (currentTrack && currentTrack.src === ep.enclosure.link) {
      if (isPlaying) audio.pause();
      else audio.play();
      setIsPlaying(!isPlaying);
      return;
    }

    audio.src = ep.enclosure.link;
    audio.play();
    setCurrentTrack({ title: ep.title, src: ep.enclosure.link });
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const update = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress(audio.currentTime / (audio.duration || 1));
    };
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTrack(null);
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const seek = (e) => {
    const audio = audioRef.current;
    const rect = e.target.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  };

  const formatTime = (t) => {
    if (!t) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Responsive Google Form height
  useEffect(() => {
    const updateHeight = () => {
      const screenHeight = window.innerHeight;
      if (window.innerWidth < 768) setIframeHeight(screenHeight * 0.9);
      else setIframeHeight(1000);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Detect form submission
  useEffect(() => {
    const iframe = document.getElementById("guestForm");
    if (!iframe) return;
    const interval = setInterval(() => {
      try {
        const url = iframe.contentWindow.location.href;
        if (url.includes("formResponse") && !iframeSubmitted) {
          setFadeOut(true);
          setTimeout(() => setIframeSubmitted(true), 500);
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [iframeSubmitted]);

  const featured = episodes[0];
  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabVariants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div
      className={`min-h-screen animate-gradient-flow transition-all duration-700 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800 text-white"
          : "bg-gradient-to-br from-indigo-100 via-white to-indigo-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: showHeader ? 0 : -100, opacity: showHeader ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 p-4 backdrop-blur-md bg-white/30 dark:bg-gray-900/40 shadow-sm`}
      >
        <div className="text-center">
          <img
            src={artwork}
            alt="Voices of Innovation"
            className="w-16 h-16 rounded-full mx-auto shadow-md"
          />
          <h1 className="text-xl font-bold text-indigo-600 mt-2">
            Voices of Innovation
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Africa’s boldest voices on innovation, climate and the future
          </p>
          <div className="mt-3 flex justify-center gap-3 text-sm">
            <a
              href="https://open.spotify.com/show/6hhUYtqrHxeRyiilyGXheN?si=cfbc75ebc1a443ab"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
            >
              Listen on Spotify
            </a>
            <a
              href="https://podcasts.apple.com/us/podcast/voices-of-innovation/id1825443856"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md bg-gray-800 text-white hover:bg-gray-900 transition"
            >
              Listen on Apple Podcasts
            </a>
          </div>
          <nav className="mt-3 flex justify-center gap-2 flex-wrap text-sm">
            {["home", "episodes", "about", "guest"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md transition ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                {t === "guest"
                  ? "Guest Sign-Up"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setDarkMode((s) => !s)}
              className="px-3 py-1 rounded-md bg-gray-300 dark:bg-gray-800 text-sm"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="px-6 max-w-6xl mx-auto pt-8 pb-24">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="text-center mt-10 animate-pulse">Loading...</div>
          ) : tab === "home" ? (
            <motion.section key="home" variants={tabVariants} initial="enter" animate="center" exit="exit">
              {featured && (
                <div className={`max-w-3xl mx-auto p-6 rounded-2xl shadow-md ${darkMode ? "bg-white/10" : "bg-white/90"}`}>
                  <div className="flex gap-4 items-start">
                    <img src={artwork} alt="featured" className="w-24 h-24 rounded-lg shadow" />
                    <div>
                      <h2 className="text-lg font-semibold">{featured.title}</h2>
                      <p className="text-xs text-gray-400">{featured.pubDate} • ⏱ {featured.duration}</p>
                      <div
                        className="text-sm overflow-hidden"
                        style={{ maxHeight: expanded === "featured" ? 600 : 100, transition: "max-height 0.4s ease" }}
                        dangerouslySetInnerHTML={{ __html: makeLinksClickable(featured.description) }}
                      />
                      {(featured.description || "").length > 200 && (
                        <button
                          onClick={() => setExpanded(expanded === "featured" ? null : "featured")}
                          className="text-indigo-400 underline mt-3 block"
                        >
                          {expanded === "featured" ? "Show less" : "Read more"}
                        </button>
                      )}
                      <button
                        onClick={() => playTrack(featured)}
                        className="mt-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                      >
                        {currentTrack?.src === featured.enclosure?.link && isPlaying ? "⏸ Pause" : "▶ Play"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          ) : tab === "episodes" ? (
            <motion.section key="episodes" variants={tabVariants} initial="enter" animate="center" exit="exit">
              <div className="max-w-4xl mx-auto mb-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search episodes..."
                  className={`w-full p-3 rounded-md border ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredEpisodes.map((ep, i) => (
                  <motion.article
                    key={ep.guid || i}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-2xl shadow-md ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-white hover:bg-gray-50"}`}
                  >
                    <h3 className="font-semibold">{ep.title}</h3>
                    <p className="text-xs text-gray-400 mb-1">
                      {ep.pubDate} • ⏱ {ep.duration}
                    </p>
                    <div
                      className="text-sm overflow-hidden"
                      style={{
                        maxHeight: expanded === i ? 600 : 80,
                        transition: "max-height 0.4s ease",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: makeLinksClickable(ep.description),
                      }}
                    />
                    {(ep.description || "").length > 180 && (
                      <button
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="text-indigo-400 underline mt-1 text-xs"
                      >
                        {expanded === i ? "Show less" : "Read more"}
                      </button>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() => playTrack(ep)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs"
                      >
                        ▶ Play
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          ) : tab === "about" ? (
            <motion.section
              key="about"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-3xl mx-auto"
            >
              <div
                className={`p-6 rounded-2xl shadow-md ${
                  darkMode ? "bg-white/10" : "bg-white/90"
                }`}
              >
                <h2 className="text-xl font-bold mb-2">About Voices of Innovation</h2>
                <p className="mb-4 text-sm">
                  Voices of Innovation is a youth-led media platform amplifying
                  young, bold, African-led solutions from changemakers and
                  innovators addressing the world’s most pressing issues.
                </p>
                <h3 className="font-semibold mb-1">Contact</h3>
                <p className="text-sm">
                  Email:{" "}
                  <a
                    href="mailto:voicesofinnovationpodcast@gmail.com"
                    className="text-indigo-400 underline"
                  >
                    voicesofinnovationpodcast@gmail.com
                  </a>
                  <br />
                  LinkedIn:{" "}
                  <a
                    href="https://www.linkedin.com/company/voices-of-innovation/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline"
                  >
                    Voices of Innovation
                  </a>
                </p>
              </div>
            </motion.section>
          ) : (
            // Guest Sign-Up Google Form Integration
            <motion.section
              key="guest"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-4xl mx-auto"
            >
              <div className="min-h-screen flex flex-col items-center py-12 px-4">
                <h1 className="text-3xl font-bold text-indigo-600 mb-4 text-center">
                  Become a Guest on Voices of Innovation
                </h1>
                <p className="text-md text-gray-700 dark:text-gray-300 mb-8 text-center max-w-xl">
                  Share your story, your ideas, or your innovations with our audience. Fill out the form below and we’ll get back to you.
                </p>
                {!iframeSubmitted ? (
                  <iframe
                    id="guestForm"
                    src="https://docs.google.com/forms/d/e/1FAIpQLSdkS90KyONmPyrcIORCEhrgbjGBzEHjtg5FspR5bWMYpcAUkg/viewform?embedded=true"
                    width="100%"
                    height={iframeHeight}
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    className={`rounded-2xl shadow-xl transition-opacity duration-500 ${
                      fadeOut ? "opacity-0" : "opacity-100"
                    }`}
                    title="Voices of Innovation Guest Sign-Up"
                  >
                    Loading…
                  </iframe>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fadeIn">
                    <h2 className="text-2xl font-bold text-indigo-600 mb-4">
                      Thank you for signing up!
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Your submission has been received. We’ll review it and get back to you soon.
                    </p>
                    <p className="text-gray-500 text-sm">
                      You can close this page or navigate back to the main site.
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Player */}
      {currentTrack && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 group">
          <div
            className={`rounded-full shadow-lg px-4 py-2 flex items-center gap-3 transition-all duration-500 hover:scale-110 hover:shadow-indigo-400/50 ${
              darkMode
                ? "bg-gray-800/70 text-white"
                : "bg-white/80 text-gray-900"
            } ${isPlaying ? "animate-pulse-glow" : ""}`}
          >
            <button
              onClick={() => {
                const a = audioRef.current;
                if (a.paused) a.play();
                else a.pause();
                setIsPlaying(!isPlaying);
              }}
              className="text-xl"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <div className="hidden group-hover:flex flex-col items-start text-xs">
              <div className="font-medium truncate max-w-[200px]">{currentTrack.title}</div>
              <div
                className="relative w-40 h-1 bg-gray-300 dark:bg-gray-600 rounded cursor-pointer"
                onClick={seek}
              >
                <div
                  className="absolute top-0 left-0 h-1 bg-indigo-500 rounded"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between w-40 text-[10px]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}