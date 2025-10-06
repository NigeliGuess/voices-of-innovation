import React, { useState, useEffect } from "react";
import artwork from "./assets/artwork.jpg"; // ✅ Import the artwork image

export default function App() {
  const [tab, setTab] = useState("home");
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [shareOpen, setShareOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedTheme);
  }, []);

  useEffect(() => {
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://anchor.fm/s/106116398/podcast/rss"
    )
      .then((res) => res.json())
      .then((data) => {
        setEpisodes(data.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.body.className = darkMode
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-black";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = () => setShareOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) return <p className="text-center mt-10">Loading episodes...</p>;

  const featuredEpisode = episodes[0];
  const filteredEpisodes = episodes
    .slice(1)
    .filter((ep) => ep.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const shareMenu = (title, link, id) => (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShareOpen(shareOpen === id ? null : id)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
      >
        Share
        <span
          className={`transition-transform duration-200 ${
            shareOpen === id ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {shareOpen === id && (
        <div className="absolute mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded z-50 animate-slideDown">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              title
            )}&url=${encodeURIComponent(link)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareOpen(null)}
            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Twitter
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              title + " " + link
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareOpen(null)}
            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(title + " " + link)}`}
            onClick={() => setShareOpen(null)}
            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Messages
          </a>
          <a
            href={`https://www.snapchat.com/submit?url=${encodeURIComponent(
              link
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareOpen(null)}
            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Snapchat
          </a>
          <a
            href={`https://www.tiktok.com/share/video?url=${encodeURIComponent(
              link
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setShareOpen(null)}
            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            TikTok
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen p-8 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* Sticky Header */}
      <header className="mb-6 text-center sticky top-0 bg-gray-50 dark:bg-gray-900 z-20 p-4">
        <img
          src={artwork} // ✅ Uses imported image
          alt="Voices of Innovation Podcast"
          className="mx-auto w-32 h-32 rounded-full shadow-lg mb-4"
        />
        <h1 className="text-4xl font-bold text-indigo-600">
          Voices of Innovation
        </h1>
        <nav className="mt-4 flex justify-center gap-4 flex-wrap">
          <button
            className={`px-4 py-2 rounded ${
              tab === "home"
                ? "bg-indigo-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setTab("home")}
          >
            Home
          </button>
          <button
            className={`px-4 py-2 rounded ${
              tab === "episodes"
                ? "bg-indigo-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setTab("episodes")}
          >
            Episodes
          </button>
          <button
            className={`px-4 py-2 rounded ${
              tab === "about"
                ? "bg-indigo-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onClick={() => setTab("about")}
          >
            About
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </nav>
      </header>

      {/* Featured Episode */}
      {tab === "home" && featuredEpisode && (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow dark:bg-gray-800 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={artwork} // ✅ Uses imported image
              alt="Voices of Innovation Podcast"
              className="w-24 h-24 rounded-lg shadow-md"
            />
            <div>
              <h3 className="text-xl font-semibold">{featuredEpisode.title}</h3>
              <p className="text-sm text-gray-500">{featuredEpisode.pubDate}</p>
            </div>
          </div>
          <div
            className="prose prose-indigo dark:prose-invert text-gray-700 dark:text-gray-200 mb-4"
            dangerouslySetInnerHTML={{
              __html: featuredEpisode.description,
            }}
          ></div>
          {featuredEpisode.enclosure?.link && (
            <audio
              controls
              className="w-full mb-4"
              onPlay={() => setCurrentAudio(featuredEpisode.title)}
            >
              <source src={featuredEpisode.enclosure.link} type="audio/mpeg" />
            </audio>
          )}
          <div className="flex gap-2 flex-wrap">
            <a
              href={featuredEpisode.link}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Anchor
            </a>
            <a
              href="https://open.spotify.com/show/6hhUYtqrHxeRyiilyGXheN?si=132e0d0863c64eeb"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Spotify
            </a>
            <a
              href="https://podcasts.apple.com/us/podcast/voices-of-innovation/id1825443856"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Apple Podcasts
            </a>
            {shareMenu(featuredEpisode.title, featuredEpisode.link, 0)}
          </div>
        </div>
      )}

      {/* Search bar */}
      {tab === "episodes" && (
        <div className="max-w-3xl mx-auto mb-4">
          <input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2 w-full dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {/* Episodes Grid */}
      {tab === "episodes" && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEpisodes.map((ep, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-xl transition transform hover:scale-105 dark:bg-gray-800"
            >
              <img
                src={artwork} // ✅ Uses imported image
                alt="Voices of Innovation Podcast"
                className="w-24 h-24 rounded-lg shadow-md mb-2"
              />
              <h2 className="text-xl font-bold">{ep.title}</h2>
              <p className="text-sm text-gray-500">{ep.pubDate}</p>
              <div
                className="mt-3 text-gray-700 dark:text-gray-200 text-sm prose prose-indigo dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html:
                    expanded === i
                      ? ep.description
                      : (ep.description || "").slice(0, 200) + "...",
                }}
              ></div>
              {ep.description && ep.description.length > 200 && (
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="ml-2 text-indigo-500 underline"
                >
                  {expanded === i ? "Show Less" : "Read More"}
                </button>
              )}
              {ep.enclosure?.link && (
                <audio
                  controls
                  className="mt-4 w-full"
                  onPlay={() => setCurrentAudio(ep.title)}
                >
                  <source src={ep.enclosure.link} type="audio/mpeg" />
                </audio>
              )}
              <div className="mt-2 flex gap-2 flex-wrap">
                {shareMenu(ep.title, ep.link, i + 1)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* About Tab */}
      {tab === "about" && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4">About Voices of Innovation</h2>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            Voices of Innovation is a youth-led media platform that amplifies
            young, bold, African-led solutions from changemakers and innovators
            focusing on the world’s most pressing issues—from climate change,
            social inequality to education and grassroots innovation.
          </p>
          <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            Our aim is to build a community of listeners, thinkers, and doers
            who believe that innovation isn’t just about technology—it’s also
            about courage, culture, creativity, and passion to make an impact.
          </p>
          <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            By focusing on solutions aligned with the Sustainable Development
            Goals—SDG 13 (Climate Action), SDG 9 (Innovation), SDG 4 (Education),
            and SDG 10 (Reduced Inequalities)—Voices of Innovation bridges youth-led
            action and global policy conversations.
          </p>
          <h3 className="text-xl font-semibold mb-2">Global Impact</h3>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            We’re not just telling stories—we’re shifting narratives, building
            networks, and making room for African youth to be seen, heard, and
            supported.
          </p>
          <div className="flex gap-2 mt-4">
            <a
              href="https://open.spotify.com/show/6hhUYtqrHxeRyiilyGXheN?si=132e0d0863c64eeb"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Spotify
            </a>
            <a
              href="https://podcasts.apple.com/us/podcast/voices-of-innovation/id1825443856"
              className="px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              Apple Podcasts
            </a>
            <a
              href="https://anchor.fm/s/106116398/podcast/rss"
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Anchor
            </a>
          </div>
        </div>
      )}

      {/* Sticky Audio Player */}
      {currentAudio && (
        <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white flex justify-between items-center px-4 py-2">
          <span>🎧 Now Playing: {currentAudio}</span>
          <button
            onClick={() => setCurrentAudio(null)}
            className="text-sm bg-white text-indigo-600 px-3 py-1 rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}