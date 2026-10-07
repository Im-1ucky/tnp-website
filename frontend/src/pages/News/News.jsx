import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
import { useAuth } from "../../context/AuthContext";
import { Plus } from "lucide-react";

import NewsCard from "./NewsCard/NewsCard";
import NewsModal from "./NewsModal/NewsModal";
import NewsForm from "./NewsForm/NewsForm";

import "./News.css";

function News() {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isStaff } = useAuth();

  const [emblaRef] = useEmblaCarousel(
    {
      loop: false,
      align: "start",
      containScroll: "trimSnaps",
      dragFree: true,
    },
    [
      WheelGesturesPlugin({
        forceWheelAxis: "x",
      }),
    ]
  );

  async function fetchNews() {
    try {
      setLoading(true);

      const response = await fetch("/api/news");

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data = await response.json();

      setNews(data.news || []);
    } catch (error) {
      console.error("News fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  function handleNewsClick(article) {
    setSelectedNews(article);
  }

  function handleAddNews() {
    setEditingNews(null);
    setShowForm(true);
  }

  function handleEditNews(article) {
    setSelectedNews(null);
    setEditingNews(article);
    setShowForm(true);
  }

  function handleNewsUpdated() {
    setShowForm(false);
    setEditingNews(null);
    fetchNews();
  }

  return (
    <section className="news-section" id="news">
      <div className="news-container">

        {/* ============================= HEADER ============================= */}

        <div className="news-header">
          <div className="news-heading">

            <div className="news-eyebrow">
              <p className="eyebrow">Club Updates</p>
            </div>

            <div className="news-main">
              <h2 className="section-title">
                What's happening at T&P
              </h2>

              <p className="section-sub">
                Stay up to date with the latest announcements, opportunities,
                events and activities from the Training & Placement Club.
              </p>
            </div>

          </div>

          {isStaff && (
            <button
              type="button"
              className="news-add-button"
              onClick={handleAddNews}
              aria-label="Add news"
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ============================= NEWS ============================= */}

        {loading ? (
          <div className="news-loading">
            Loading news...
          </div>
        ) : news.length === 0 ? (
          <div className="news-empty">
            No news available.
          </div>
        ) : (
          <div className="news-carousel" ref={emblaRef}>
            <div className="news-carousel-container">
              {news.map((article) => (
                <NewsCard
                  key={article.id}
                  news={article}
                  onClick={() => handleNewsClick(article)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {selectedNews && (
        <NewsModal
          news={selectedNews}
          onClose={() => setSelectedNews(null)}
          onEdit={handleEditNews}
          onUpdated={fetchNews}
        />
      )}

      {showForm && (
        <NewsForm
          news={editingNews}
          onClose={() => {
            setShowForm(false);
            setEditingNews(null);
          }}
          onSaved={handleNewsUpdated}
        />
      )}
    </section>
  );
}

export default News;
