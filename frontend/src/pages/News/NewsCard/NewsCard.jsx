import "./NewsCard.css";

function NewsCard({ news, onClick }) {
  return (
    <article
      className={`news-card ${news.pinned ? "news-card-pinned" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onClick();
        }
      }}
    >
      {news.image && (
        <div className="news-card-image-wrapper">
          <img
            src={news.image}
            alt=""
            className="news-card-image"
          />
        </div>
      )}

      <div className="news-card-content">
        <div className="news-card-top">
          {Boolean(news.pinned) && (
            <span
              className="news-card-pin"
              aria-label="Pinned news"
              title="Pinned"
            >
              📌
            </span>
          )}

          <time className="news-card-date">
            {formatNewsDate(news.created_at)}
          </time>
        </div>

        <h3 className="news-card-title">
          {news.title}
        </h3>

        {news.content && (
          <p className="news-card-description">
            {news.content}
          </p>
        )}
      </div>
    </article>
  );
}

function formatNewsDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default NewsCard;
