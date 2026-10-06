import { useEffect, useState } from "react";
import { alumni } from "../../data/members/alumni";
import "./Alumni.css";

const SHOW_ALUMNI = true;

function AlumniCard({ member, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="alumni-card-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alumni-card-name"
    >
      <div
        className={`alumni-card alumni-card-expanded ${
          member.image ? "has-image" : "no-image"
        }`}
      >

        {/* STORY */}
        <div className="alumni-story">
          <p>{member.story}</p>
        </div>

        {/* DETAILS */}
        <div className="alumni-details">
          {member.image && (
            <div className="alumni-photo">
              <img
                src={member.image}
                alt={member.name}
              />
            </div>
          )}

          <div className="alumni-info">
            <h3 id="alumni-card-name">
              {member.name}
            </h3>

            <p className="alumni-department">
              {member.department}
            </p>

            <p className="alumni-year">
              Batch {member.yearOfPassing}
            </p>

            {(member.company || member.role) && (
              <div className="alumni-career">
                {member.role && (
                  <span>{member.role}</span>
                )}

                {member.company && (
                  <span>{member.company}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CLOSE */}
        <button
          type="button"
          className="alumni-card-close"
          onClick={onClose}
          aria-label="Close alumni profile"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>

      </div>
    </div>
  );
}

function Alumni() {
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  if (!SHOW_ALUMNI || alumni.length === 0) {
    return null;
  }

  return (
    <section className="alumni" id="alumni">
      <div className="alumni-container">

        <div className="alumni-head">
          <div className="alumni-eyebrow">
            <p className="eyebrow">ALUMNI</p>
          </div>

          <div className="alumni-main">
            <h2 className="section-title">
              Beyond the Campus
            </h2>

            <p className="section-sub">
              Their journey began with T&amp;P, and the path
              that led them to where they stand today.
            </p>
          </div>
        </div>

        <div className="alumni-gallery">
          {alumni.map((member) => (
            <article
              className="alumni-card"
              key={member.id}
              onClick={() => setSelectedAlumni(member)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  setSelectedAlumni(member);
                }
              }}
            >
              <div className="alumni-story">
                <p>{member.story}</p>
              </div>

              <div
                className={`alumni-details ${
                  member.image
                    ? "has-image"
                    : "no-image"
                }`}
              >
                {member.image && (
                  <div className="alumni-photo">
                    <img
                      src={member.image}
                      alt={member.name}
                    />
                  </div>
                )}

                <div className="alumni-info">
                  <h3>{member.name}</h3>

                  <p className="alumni-department">
                    {member.department}
                  </p>

                  <p className="alumni-year">
                    Batch {member.yearOfPassing}
                  </p>

                  {(member.company || member.role) && (
                    <div className="alumni-career">
                      {member.role && (
                        <span>{member.role}</span>
                      )}

                      {member.company && (
                        <span>{member.company}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedAlumni && (
        <AlumniCard
          member={selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
        />
      )}
    </section>
  );
}

export default Alumni;
