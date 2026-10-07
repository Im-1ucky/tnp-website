import { useEffect, useState } from "react";

import "./NewsForm.css";

function NewsForm({ news, onClose, onSaved }) {
  const isEditing = Boolean(news);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (news) {
      setTitle(news.title || "");
      setContent(news.content || "");
      setImage(news.image || "");
    } else {
      setTitle("");
      setContent("");
      setImage("");
    }

    setError("");
  }, [news]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanImage = image.trim();

    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }

    if (!cleanContent && !cleanImage) {
      setError("Please provide a description or an image.");
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/news/${news.id}`
        : "/api/news";

      const method = isEditing
        ? "PATCH"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: cleanTitle,
          content: cleanContent,
          image: cleanImage || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save news."
        );
      }

      onSaved(data.news);
    } catch (error) {
      console.error("News save error:", error);

      setError(
        error.message || "Unable to save news."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !saving) {
      onClose();
    }
  }

  return (
    <div
      className="news-form-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="news-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-form-title"
      >
        <button
          type="button"
          className="news-form-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
        >
          ×
        </button>

        <div className="news-form-header">
          <p className="news-form-eyebrow">
            {isEditing ? "Manage News" : "New Update"}
          </p>

          <h2 id="news-form-title">
            {isEditing ? "Edit News" : "Add News"}
          </h2>
        </div>

        <form
          className="news-form"
          onSubmit={handleSubmit}
        >
          <div className="news-form-field">
            <label htmlFor="news-title">
              Title
              <span>*</span>
            </label>

            <input
              id="news-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter news title"
              disabled={saving}
              maxLength={200}
            />
          </div>

          <div className="news-form-field">
            <label htmlFor="news-content">
              Description
            </label>

            <textarea
              id="news-content"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="Enter the news description..."
              disabled={saving}
              rows={6}
            />
          </div>

          <div className="news-form-field">
            <label htmlFor="news-image">
              Image
            </label>

            <input
              id="news-image"
              type="text"
              value={image}
              onChange={(event) =>
                setImage(event.target.value)
              }
              placeholder="Enter image URL"
              disabled={saving}
            />
          </div>

          <p className="news-form-hint">
            Provide at least a description or an image.
            You can include any relevant link inside the
            description.
          </p>

          {error && (
            <p
              className="news-form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="news-form-actions">
            <button
              type="button"
              className="news-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="news-form-submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add News"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewsForm;
