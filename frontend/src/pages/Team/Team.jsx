import { useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { members } from "../../data/members";
import TeamCard from "./TeamCard/TeamCard";
import { teams } from "../../data/teams";
import "./Team.css";

import {
  Pen,
  FileText,
  Table2,
  CircleCheck,
  Handshake,
} from "lucide-react";

const teamIcons = {
  Pen,
  FileText,
  Table2,
  CircleCheck,
  Handshake,
};


function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MemberPhoto({ member }) {
  const [extension, setExtension] = useState("jpg");
  const [failed, setFailed] = useState(false);

  const photoPath = `/assets/Batches/${member.graduationYear}/${member.rollNo}.${extension}`;

  function handleError() {
    if (extension === "jpg") {
      setExtension("png");
    } else {
      setFailed(true);
    }
  }

  if (failed) {
    return (
      <div className="team-member-photo team-member-photo-fallback">
        <span>{getInitials(member.name)}</span>
      </div>
    );
  }

  return (
    <div className="team-member-photo">
      <img
        src={photoPath}
        alt={member.name}
        onError={handleError}
      />
    </div>
  );
}

function TeamMemberCard({ member, onClick }) {
  return (
    <article
      className="team-member-card"
      onClick={onClick}

    >
      <MemberPhoto member={member} />

      <div className="team-member-content">
        <h3>{member.name}</h3>

        <p className="team-member-roll">
          {member.rollNo}
        </p>

        {member.role && (
          <p className="team-member-role">
            {member.role}
          </p>
        )}

        <div className="team-member-meta">
          <span>{member.department}</span>
          <span>{member.graduationYear}</span>
        </div>

        <div className="team-member-team">
          {member.team}
        </div>
      </div>
    </article>
  );
}

function Team() {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedTeam, setSelectedTeam] = useState("All");
  const [selectedMember, setSelectedMember] = useState(null);

  // Embla handles the infinite loop.
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: false,
      dragFree: true,
    },
    [
      WheelGesturesPlugin({
        forceWheelAxis: "x",
      }),
    ]
  );

  // Only the two most recent batches are displayed.
  const availableBatches = useMemo(() => {
    return [...new Set(members.map((member) => member.graduationYear))]
      .sort((a, b) => b - a)
      .slice(0, 2);
  }, []);

  // Select the newest batch by default.
  const activeBatch = selectedBatch ?? availableBatches[0];

  const batchMembers = useMemo(() => {
    return members.filter(
      (member) => member.graduationYear === activeBatch
    );
  }, [activeBatch]);

  // Filters are generated from the selected batch's data.
  const departments = useMemo(() => {
    return [...new Set(batchMembers.map((member) => member.department))]
      .sort();
  }, [batchMembers]);

  const availableTeams = useMemo(() => {
    const batchTeamNames = new Set(
      batchMembers.map((member) => member.team)
    );

    return teams.filter((team) => batchTeamNames.has(team.name));
  }, [batchMembers]);

  const selectedTeamInfo = useMemo(() => {
    if (selectedTeam === "All") return null;

    return teams.find((team) => team.name === selectedTeam) ?? null;
  }, [selectedTeam]);

  const Icon = selectedTeamInfo
    ? teamIcons[selectedTeamInfo.icon]
    : null;

  const filteredMembers = useMemo(() => {
    return batchMembers.filter((member) => {
      const matchesDepartment =
        selectedDepartment === "All" ||
        member.department === selectedDepartment;

      const matchesTeam =
        selectedTeam === "All" ||
        member.team === selectedTeam;

      return matchesDepartment && matchesTeam;
    });
  }, [
    batchMembers,
    selectedDepartment,
    selectedTeam,
  ]);

  function handleBatchChange(batch) {
    setSelectedBatch(batch);
    setSelectedDepartment("All");
    setSelectedTeam("All");
  }

  return (
    <section className="section team" id="teams">
      <div className="container">

        {/* Section heading */}
        <div className="section-head team-head">
          <div className="team-eyebrow">
            <div className="eyebrow">Our Team</div>
          </div>

          <h2 className="section-title">
            Meet the people behind the club
          </h2>

          <p className="section-sub">
            Students working together across design, coordination,
            outreach and operations to keep the Training &amp; Placement
            Club moving forward.
          </p>
        </div>

        {/* Batch selector */}
        <div className="team-batches">
          <div className="team-filter-label">
            Batch
          </div>

          <div className="team-batch-buttons">
            {availableBatches.map((batch) => (
              <button
                key={batch}
                type="button"
                className={
                  activeBatch === batch
                    ? "team-batch-btn active"
                    : "team-batch-btn"
                }
                onClick={() => handleBatchChange(batch)}
              >
                {batch}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="team-filters">

          {/* Department */}
          <div className="team-filter-group">
            <label htmlFor="team-department">
              Department
            </label>

            <select
              id="team-department"
              value={selectedDepartment}
              onChange={(event) =>
                setSelectedDepartment(event.target.value)
              }
            >
              <option value="All">
                All Departments
              </option>

              {departments.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              ))}
            </select>
          </div>


          {/* Team */}
          <div className="team-filter-group">
            <label htmlFor="team-name">
              Team
            </label>

            <select
              id="team-name"
              value={selectedTeam}
              onChange={(event) =>
                setSelectedTeam(event.target.value)
              }
            >
              <option value="All">
                All Teams
              </option>

              {availableTeams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Selected team information */}
        {selectedTeamInfo && (
          <div className="team-description">
            <div className="team-description-content">
              <div className="team-description-heading">
                <div className="team-description-icon">
                  {Icon && <Icon size={19} strokeWidth={1.8} />}
                </div>

                <h3>{selectedTeamInfo.name}</h3>
              </div>

              <p>{selectedTeamInfo.description}</p>
            </div>
          </div>
        )}

        {/* Result count */}
        <div className="team-results">
          <span>
            {filteredMembers.length}{" "}
            {filteredMembers.length === 1
              ? "member"
              : "members"}
          </span>

          <span className="team-results-line" />

          <span>{activeBatch} Batch</span>
        </div>

        {/* Infinite member carousel */}
        <div className="team-carousel" ref={emblaRef}>
          <div className="team-carousel-container">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onClick={() => setSelectedMember(member)}
              />
            ))}
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <div className="team-empty">
            No members found for the selected filters.
          </div>
        )}

        {selectedMember && (
          <TeamCard
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}

      </div>
    </section>
  );
}

export default Team;
