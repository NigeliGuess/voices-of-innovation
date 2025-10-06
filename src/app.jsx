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

  // ✅ Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedTheme);
  }, []);

  // ✅ Fetch function (so we can reuse it for auto-refresh)
  const fetchEpisodes = () => {
    fetch(
      "https://podcast-api.netlify.app/api?url=https://anchor.fm/s/106116398/podcast/rss"
    )
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.items.sort(
          (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
        );
        setEpisodes(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching episodes:", err);
        setLoading(false);
      });
  };

  // ✅ Fetch once on mount + auto-refresh every 3 hours
  useEffect(() => {
    fetchEpisodes();
    const interval = setInterval(fetchEpisodes, 3 * 60 * 60 * 1000); // 3 hours
    return () => clearInterval(interval);
  }, []);

  // ✅ Dark mode persistence
  useEffect(() => {
    document.body.className = darkMode
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-black";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ✅ Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShareOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) return <p className="text-center mt-10">Loading episodes...</p>;

  // ✅ Filter episodes by title OR description
  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Make links in episode descriptions clickable
  const makeLinksClickable = (html) =>
    html.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" class="text-indigo-500 underline">$1</a>'
    );

  // ✅ Share dropdown menu
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
          {[
            {
              name: "Twitter",
              url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title
              )}&url=${encodeURIComponent(link)}`,
            },
            {
              name: "WhatsApp",
              url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
                title + " " + link
              )}`,
            },
            {
              name: "Messages",
              url: `sms:?body=${encodeURIComponent(title + " " + link)}`,
            },
            {
              name: "Snapchat",
              url: `https://www.snapchat.com/submit?url=${encodeURIComponent(
                link
              )}`,
            },
            {
              name: "TikTok",
              url: `https://www.tiktok.com/share/video?url=${encodeURIComponent(
                link
              )}`,
            },
          ].map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => setShareOpen(null)}
              className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const featuredEpisode = episodes[0];

  return (
    <div
      className={`min-h-screen p-8 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* Header */}
      <header className="mb-6 text-center sticky top-0 bg-gray-50 dark:bg-gray-900 z-20 p-4">
        <img
          src={artwork}
          alt="Voices of Innovation Podcast"
          className="mx-auto w-32 h-32 rounded-full shadow-lg mb-4"
        />
        <h1 className="text-4xl font-bold text-indigo-600">
          Voices of Innovation
        </h1>
        <nav className="mt-4 flex justify-center gap-4 flex-wrap">
          {["home", "episodes", "about"].map((t) => (
            <button
              key={t}
              className={`px-4 py-2 rounded ${
                tab === t
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </nav>
      </header>

      {/* Home / Featured Episode */}
      {tab === "home" && featuredEpisode && (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow dark:bg-gray-800 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={artwork}
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
              __html: makeLinksClickable(featuredEpisode.description),
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
            className="border rounded px-3 py-2 w-full dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {/* Episodes */}
      {tab === "episodes" && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEpisodes.map((ep, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl shadow hover:shadow-xl transition transform hover:scale-105 dark:bg-gray-800"
            >
              <img
                src={artwork}
                alt="Voices of Innovation Podcast"
                className="w-24 h-24 rounded-lg shadow-md mb-2"
              />
              <h2 className="text-xl font-bold">{ep.title}</h2>
              <p className="text-sm text-gray-500">{ep.pubDate}</p>
              <div
                className="mt-3 text-gray-700 dark:text-gray-200 text-sm prose prose-indigo dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: makeLinksClickable(
                    expanded === i
                      ? ep.description
                      : (ep.description || "").slice(0, 200) + "..."
                  ),
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

      {/* About */}
      {tab === "about" && (
        <div className="max-w-2xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4">About Voices of Innovation</h2>
          <p className="text-gray-700 dark:text-gray-200 mb-4">
            Voices of Innovation amplifies African-led solutions from young
            changemakers tackling the world’s most pressing issues — from
            climate change and education to social innovation.
          </p>
        </div>
      )}

      {/* Audio Player */}
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