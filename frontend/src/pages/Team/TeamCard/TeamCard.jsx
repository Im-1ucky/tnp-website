import { useEffect, useState } from "react";
import "./TeamCard.css";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function TeamCard({ member, onClose, type = "student" }) {
  const [extension, setExtension] = useState("jpg");
  const [failed, setFailed] = useState(false);

  const isFaculty = type === "faculty";

  /* ==============================
     MODAL BEHAVIOUR
  ================================ */

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

  /* ==============================
     PHOTO
  ================================ */

  function handlePhotoError() {
    if (extension === "jpg") {
      setExtension("png");
    } else {
      setFailed(true);
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const photoPath = isFaculty
    ? `/assets/Faculty/${member.name.replace(/\s+/g, "")}.${extension}`
    : `/assets/Batches/${member.graduationYear}/${member.rollNo}.${extension}`;

  return (
    <div
      className="team-card-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-card-name"
    >
      <div className="team-card-modal">

        {/* PHOTO */}
        <div className="team-card-photo">
          {!failed ? (
            <img
              src={photoPath}
              alt={member.name}
              onError={handlePhotoError}
            />
          ) : (
            <div className="team-card-photo-fallback">
              {getInitials(member.name)}
            </div>
          )}

          <button
            type="button"
            className="team-card-close"
            onClick={onClose}
            aria-label="Close member profile"
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

        {/* BODY */}
        <div className="team-card-body">

          {/* NAME + TYPE/BATCH */}
          <div className="team-card-heading">
            <div>
              <h2 id="team-card-name">
                {member.name}
              </h2>

              <p className="team-card-role">
                {member.role || member.team}
              </p>
            </div>

            <span className="team-card-batch">
              {isFaculty
                ? "Faculty"
                : `Batch ${member.graduationYear}`}
            </span>
          </div>

          {/* DETAILS */}
          <div className="team-card-grid">

            {isFaculty ? (
              <div className="team-card-field">
                <span className="team-card-label">
                  Department
                </span>

                <strong>
                  {member.department}
                </strong>
              </div>
            ) : (
              <>
                <div className="team-card-field">
                  <span className="team-card-label">
                    Roll Number
                  </span>

                  <strong className="team-card-roll">
                    {member.rollNo}
                  </strong>
                </div>

                <div className="team-card-field">
                  <span className="team-card-label">
                    Department
                  </span>

                  <strong>
                    {member.department}
                  </strong>
                </div>

                <div className="team-card-field">
                  <span className="team-card-label">
                    Official Team
                  </span>

                  <strong>
                    {member.team}
                  </strong>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamCard;
