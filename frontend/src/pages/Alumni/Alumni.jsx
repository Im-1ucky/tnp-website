import { alumni } from "../../data/members/alumni";
import "./Alumni.css";

const SHOW_ALUMNI = true;   //Changing this to false will remove the alumni section altogether

function Alumni() {
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
            <h2 className="section-title">Beyond the Campus</h2>

            <p className="section-sub">
              Their journey began with T&P, and the path they took led them to where they stand today.
            </p>
          </div>
        </div>

        <div className="alumni-gallery">
          {alumni.map((member) => (
            <article className="alumni-card" key={member.id}>
              <div className="alumni-story">
                <p>{member.story}</p>
              </div>

              <div
                className={`alumni-details ${
                  member.image ? "has-image" : "no-image"
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
                      {member.role && <span>{member.role}</span>}

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
    </section>
  );
}

export default Alumni;
