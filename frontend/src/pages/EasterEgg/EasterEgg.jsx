import "./EasterEgg.css";
import { maintainerBatches } from "../../data/members/easteregg";

function EasterEgg({ onBack }) {
  const maintainers = maintainerBatches.flatMap((batch) =>
    batch.members.map((member) => ({
      ...member,
      batchYear: batch.year,
    }))
  );

  return (
    <main className="easter-egg">
      <header className="easter-egg-header">
        <button
          type="button"
          className="easter-egg-back"
          onClick={onBack}
        >
          ← Back to T&P
        </button>

        <h1>Hall of Maintainers</h1>

        <p>
          The people who built, maintained, and carried T&amp;P website forward.
        </p>
      </header>

      <section className="maintainers-timeline">
        {maintainers.map((member, index) => {
          const isLeft = index % 2 === 0;

          return (
            <article
              className={`timeline-entry ${
                isLeft ? "timeline-left" : "timeline-right"
              }`}
              key={member.id}
            >
              <div className="timeline-card">
                <div className="maintainer-card">
                  <div className="maintainer-image">
                    <img
                      src={`/assets/Batches/${member.batchYear}/${member.rollNo}.png`}
                      alt={member.name}
                    />
                  </div>

                  <div className="maintainer-info">
                    <h2>{member.name}</h2>
                    <p>{member.team}</p>
                    <p>{member.department}</p>
                  </div>
                </div>
              </div>

              <div className="timeline-center">
                <span className="timeline-node" />
              </div>

              <div className="timeline-year">
                {member.batchYear}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default EasterEgg;
