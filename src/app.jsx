import React, { useState, useEffect } from "react";
import artwork from "./assets/artwork.jpg";

export default function App() {
  const [tab, setTab] = useState("home");
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [shareOpen, setShareOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedTheme);
  }, []);

  // Fetch ALL episodes from RSS (no 20-item limit)
  useEffect(() => {
    fetch("https://api.allorigins.win/raw?url=https://anchor.fm/s/106116398/podcast/rss")
      .then((res) => res.text())
      .then((str) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, "text/xml");
        const items = xml.querySelectorAll("item");

        const episodes = Array.from(items).map((item) => ({
          title: item.querySelector("title")?.textContent || "Untitled Episode",
          pubDate: item.querySelector("pubDate")?.textContent,
          description: item.querySelector("description")?.textContent || "",
          link: item.querySelector("link")?.textContent || "",
          enclosure: { link: item.querySelector("enclosure")?.getAttribute("url") || "" },
        }));

        setEpisodes(episodes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Apply theme
  useEffect(() => {
    if (darkMode) {
      document.body.className = "bg-gray-900 text-white";
    } else {
      document.body.className = "bg-gray-50 text-black";
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShareOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) return <p className="text-center mt-10">Loading episodes...</p>;

  const featuredEpisode = episodes[0];
  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enable clickable links in descriptions
  const formatDescription = (desc) => {
    return desc.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noreferrer" class="text-indigo-400 underline hover:text-indigo-600">$1</a>'
    );
  };

  const shareMenu = (title, link, id) => (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShareOpen(shareOpen === id ? null : id)}
        className={`px-3 py-1 rounded flex items-center gap-1 ${
          darkMode
            ? "bg-black text-white hover:bg-gray-700"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
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
        <div
          className={`absolute mt-2 w-44 shadow-lg rounded z-50 animate-slideDown ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
        >
          {["Twitter", "WhatsApp", "Messages", "Snapchat", "TikTok"].map((platform) => {
            const urls = {
              Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title
              )}&url=${encodeURIComponent(link)}`,
              WhatsApp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
                title + " " + link
              )}`,
              Messages: `sms:?body=${encodeURIComponent(title + " " + link)}`,
              Snapchat: `https://www.snapchat.com/submit?url=${encodeURIComponent(link)}`,
              TikTok: `https://www.tiktok.com/share/video?url=${encodeURIComponent(link)}`,
            };
            return (
              <a
                key={platform}
                href={urls[platform]}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShareOpen(null)}
                className={`block px-4 py-2 hover:transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                {platform}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`min-h-screen p-8 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* Header */}
      <header
        className={`mb-6 text-center sticky top-0 z-20 p-4 shadow ${
          darkMode ? "bg-black text-white" : "bg-gray-50 text-black"
        }`}
      >
        <img
          src={artwork}
          alt="Voices of Innovation Podcast"
          className="mx-auto w-32 h-32 rounded-full shadow-lg mb-4"
        />
        <h1
          className={`text-4xl font-bold ${
            darkMode ? "text-indigo-400" : "text-indigo-600"
          }`}
        >
          Voices of Innovation
        </h1>
        <nav className="mt-4 flex justify-center gap-4 flex-wrap">
          {["home", "episodes", "about"].map((section) => (
            <button
              key={section}
              className={`px-4 py-2 rounded transition-colors ${
                tab === section
                  ? darkMode
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-600 text-white"
                  : darkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-black"
              }`}
              onClick={() => setTab(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded transition ${
              darkMode ? "bg-gray-200 text-black" : "bg-gray-300 text-black"
            }`}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </nav>
      </header>

      {/* Featured Episode */}
      {tab === "home" && featuredEpisode && (
        <div
          className={`max-w-3xl mx-auto p-6 rounded-2xl shadow mb-6 transition-colors ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <img
              src={artwork}
              alt="Voices of Innovation Podcast"
              className="w-24 h-24 rounded-lg shadow-md"
            />
            <div>
              <h3 className="text-xl font-semibold">{featuredEpisode.title}</h3>
              <p className="text-sm text-gray-400">{featuredEpisode.pubDate}</p>
            </div>
          </div>
          <div
            className={`prose prose-indigo rounded-lg p-3 mb-4 transition-colors duration-300 ${
              darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
            }`}
            dangerouslySetInnerHTML={{
              __html: formatDescription(featuredEpisode.description),
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
              href="https://open.spotify.com/show/6hhUYtqrHxeRyiilyGXheN?si=132e0d0863c64eeb"
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1 rounded ${
                darkMode ? "bg-green-400 text-black" : "bg-green-500 text-white"
              }`}
            >
              Spotify
            </a>
            <a
              href="https://podcasts.apple.com/us/podcast/voices-of-innovation/id1825443856"
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1 rounded ${
                darkMode ? "bg-gray-300 text-black" : "bg-gray-900 text-white"
              }`}
            >
              Apple Podcasts
            </a>
            <a
              href="https://anchor.fm/s/106116398/podcast/rss"
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1 rounded ${
                darkMode ? "bg-indigo-400 text-black" : "bg-indigo-600 text-white"
              }`}
            >
              Anchor
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
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`border rounded px-3 py-2 w-full transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
          />
        </div>
      )}

      {/* Episodes Grid */}
      {tab === "episodes" && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEpisodes.map((ep, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl shadow hover:shadow-xl transition transform hover:scale-105 ${
                darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
              }`}
            >
              <img
                src={artwork}
                alt="Voices of Innovation Podcast"
                className="w-24 h-24 rounded-lg shadow-md mb-2"
              />
              <h2 className="text-xl font-bold">{ep.title}</h2>
              <p className="text-sm text-gray-400">{ep.pubDate}</p>
              <div
                className={`mt-3 text-sm prose prose-indigo rounded-lg p-3 transition-colors duration-300 ${
                  darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
                }`}
                dangerouslySetInnerHTML={{
                  __html:
                    expanded === i
                      ? formatDescription(ep.description)
                      : formatDescription(ep.description.slice(0, 200)) + "...",
                }}
              ></div>
              {ep.description && ep.description.length > 200 && (
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="ml-2 text-indigo-400 underline"
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
        <div
          className={`max-w-2xl mx-auto mt-6 p-6 rounded-2xl shadow transition-colors duration-300 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">About Voices of Innovation</h2>
          <p className="mb-4">
            Voices of Innovation is a youth-led media platform that amplifies
            young, bold, African-led solutions from changemakers and innovators
            focusing on the world’s most pressing issues—from climate change,
            social inequality to education and grassroots innovation.
          </p>
          <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
          <p className="mb-4">
            Our aim is to build a community of listeners, thinkers, and doers
            who believe that innovation isn’t just about technology—it’s also
            about courage, culture, creativity, and passion to make an impact.
          </p>
          <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
          <p className="mb-4">
            By focusing on solutions aligned with the Sustainable Development
            Goals—SDG 13 (Climate Action), SDG 9 (Innovation), SDG 4 (Education),
            and SDG 10 (Reduced Inequalities)—Voices of Innovation bridges youth-led
            action and global policy conversations.
          </p>
          <h3 className="text-xl font-semibold mb-2">Global Impact</h3>
          <p className="mb-6">
            We’re not just telling stories—we’re shifting narratives, building
            networks, and making room for African youth to be seen, heard, and
            supported.
          </p>

          {/* Contact Section */}
          <h3 className="text-xl font-semibold mb-2">Contact</h3>
          <p className="mb-2">
            Connect with us on{" "}
            <a
              href="https://www.linkedin.com/company/voices-of-innovation/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 underline hover:text-indigo-600"
            >
              LinkedIn
            </a>.
          </p>
          <p>
            Or send us an email at{" "}
            <a
              href="mailto:voicesofinnovationpodcast@gmail.com"
              className="text-indigo-400 underline hover:text-indigo-600"
            >
              voicesofinnovationpodcast@gmail.com
            </a>
          </p>
        </div>
      )}

      {/* Sticky Audio Player */}
      {currentAudio && (
        <div
          className={`fixed bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2 ${
            darkMode ? "bg-indigo-300 text-black" : "bg-indigo-600 text-white"
          }`}
        >
          <span>🎧 Now Playing: {currentAudio}</span>
          <button
            onClick={() => setCurrentAudio(null)}
            className={`text-sm px-3 py-1 rounded ${
              darkMode ? "bg-black text-white" : "bg-white text-indigo-600"
            }`}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}