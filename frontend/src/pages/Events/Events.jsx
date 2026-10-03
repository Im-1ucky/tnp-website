import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { events } from "../../data/events";
import "./Events.css";

function EventGallery({ event, onImageClick }) {
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

  return (
    <section className="event">
      <h3 className="event-title">{event.title}</h3>

      {event.images.length > 0 ? (
        <div className="event-carousel" ref={emblaRef}>
          <div className="event-carousel-container">
            {event.images.map((image, index) => (
              <div
                className="event-slide"
                key={image}
                onClick={() => onImageClick(event.images, index)}
              >
                <img
                  src={image}
                  alt={`${event.title} ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="event-empty">
          Images coming soon.
        </div>
      )}
    </section>
  );
}

function ImageLightbox({ images, startIndex, onClose }) {

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: "center",
      containScroll: "trimSnaps",
      dragFree: false,
    },
    [
      WheelGesturesPlugin({
        forceWheelAxis: "x",
      }),
    ]
  );

  /*
   * Start at the image that was clicked.
   */
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.scrollTo(startIndex, true);
  }, [emblaApi, startIndex]);

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (!emblaApi) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi.scrollPrev();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [emblaApi, onClose]);

  if (!images.length) return null;

  return (
    <div
      className="event-lightbox"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        className="event-lightbox-close"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close image viewer"
      >
        <X size={20} strokeWidth={1.8} />
      </button>

      <div className="event-lightbox-content">

        {/* Image carousel */}
        <div
          className="event-lightbox-viewport"
          ref={emblaRef}
        >
          <div className="event-lightbox-container">
            {images.map((image, index) => (
              <div
                className="event-lightbox-slide"
                key={image}
              >
                <img
                  src={image}
                  alt={`Event image ${index + 1}`}
                  draggable="false"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Events() {
  const [lightbox, setLightbox] = useState(null);

  function openLightbox(images, index) {
    setLightbox({
      images,
      startIndex: index,
    });

    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    setLightbox(null);
    document.body.style.overflow = "";
  }

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <section className="section events" id="events">
      <div className="container">

        <div className="section-head events-head">
          <div className="events-eyebrow">
            <div className="eyebrow">
              Events
            </div>
          </div>

          <h2 className="section-title">
            Moments That Bring Us Together
          </h2>

          <p className="section-sub">
            A glimpse into the events, activities and experiences that
            shape the Training &amp; Placement Club community.
          </p>
        </div>

        <div className="instagram-bar">
          <div className="instagram-profile">
            <div className="instagram-avatar">
              T&P
            </div>

            <div className="instagram-info">
              <div className="instagram-name">
                <span>Training &amp; Placement Club</span>

                <span className="instagram-verified">
                  ✓
                </span>
              </div>

              <div className="instagram-handle">
                @tnpclub_gprec
              </div>

              <div className="instagram-stats">
                <span>114K+ Views</span>
                <span>16K+ Likes</span>
              </div>
            </div>
          </div>

          <a
            className="instagram-follow"
            href="https://www.instagram.com/tnpclub_gprec/"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              className="instagram-follow-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="17.5"
                cy="6.5"
                r="1"
                fill="currentColor"
              />
            </svg>

            <span>Follow @tnpclub_gprec</span>
          </a>
        </div>

        <div className="events-list">
          {events.map((event) => (
            <EventGallery
              key={event.id}
              event={event}
              onImageClick={openLightbox}
            />
          ))}
        </div>

      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}

export default Events;
