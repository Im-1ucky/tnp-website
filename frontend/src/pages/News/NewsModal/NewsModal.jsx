import { X } from "lucide-react";
import "./NewsModal.css";
import { useAuth } from "../../../context/AuthContext";

function NewsModal({
  news,
  onClose,
  onEdit,
  onUpdated,
}) {

  const { isStaff } = useAuth();

  if (!news) {
    return null;
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${news.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/news/${news.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete news");
      }

      onClose();
      await onUpdated();
    } catch (error) {
      console.error("Delete news error:", error);
      window.alert(error.message);
    }
  }

  async function handleTogglePin() {
    try {
      const response = await fetch(`/api/news/${news.id}/pin`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update pin status");
      }

      onClose();
      await onUpdated();
    } catch (error) {
      console.error("Toggle pin error:", error);
      window.alert(error.message);
    }
  }

  return (
    <div
      className="news-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="news-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-modal-title"
      >
        <button
          type="button"
          className="news-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {news.image && (
          <div className="news-modal-image-wrapper">
            <img
              src={news.image}
              alt=""
              className="news-modal-image"
            />
          </div>
        )}

        <div className="news-modal-body">
          <div className="news-modal-meta">
            {Boolean(news.pinned) && (
              <span
                className="news-modal-pin"
                title="Pinned"
              >
                📌
              </span>
            )}

            <time>
              {formatNewsDate(news.created_at)}
            </time>
          </div>

          <h2
            id="news-modal-title"
            className="news-modal-title"
          >
            {news.title}
          </h2>

          {news.content && (
            <p className="news-modal-description">
              {news.content}
            </p>
          )}

          {isStaff && (
            <div className="news-modal-actions">
              <button
                type="button"
                onClick={() => onEdit(news)}
              >
                Edit
              </button>

              <button
                type="button"
                className="news-modal-danger"
                onClick={handleDelete}
              >
                Delete
              </button>

              <button
                type="button"
                onClick={handleTogglePin}
              >
                {news.pinned ? "Unpin" : "Pin"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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

export default NewsModal;
