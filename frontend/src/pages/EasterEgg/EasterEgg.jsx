import { useState } from "react";
import "./EasterEgg.css";

import { maintainerBatches } from "../../data/members/easteregg";
import { TeamMemberCard } from "../Team/Team";
import TeamCard from "../Team/TeamCard/TeamCard";

function EasterEgg({ onBack }) {
  const [selectedMember, setSelectedMember] = useState(null);

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
              {/* Team member card */}
              <div className="timeline-card">
                <TeamMemberCard
                  member={member}
                  onClick={() => setSelectedMember(member)}
                />
              </div>

              {/* Timeline */}
              <div className="timeline-center">
                <span className="timeline-node" />
              </div>

              {/* Batch */}
              <div className="timeline-year">
                Batch&nbsp;{member.batchYear}
              </div>
            </article>
          );
        })}
      </section>

      {/* Existing Team profile popup */}
      {selectedMember && (
        <TeamCard
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </main>
  );
}

export default EasterEgg;
