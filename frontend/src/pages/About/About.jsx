import "./About.css";

function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="about-layout">
          {/* Left side */}
          <div className="about-left">
            <div className="about-eyebrow">
              <div className="eyebrow">Who We Are</div>
            </div>

            <div className="about-main">
              <h2 className="section-title">About Us</h2>

              <p className="section-sub">
                The Training &amp; Placement Club connects students with opportunities,
                industry and the GPREC community.
              </p>

              <div className="about-copy">
                <p>
                  From coordinating placement drives and communicating with recruiters
                  and HR professionals to keeping students informed and facilitating
                  industry interactions, we play an active role in the recruitment journey.
                </p>

                <p>
                  Beyond placements, we are a community that brings students
                  and alumni together through student led events, activities, interactions
                  and reunions while creating lasting connections across GPREC.
                </p>

                <p>
                  Through these efforts, we help students understand industry expectations,
                  engage with professionals and build the skills, confidence and perspective
                  they need for the future.
                </p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="about-card">
            <div className="about-card-glow" />

            <div className="about-card-content">
              <span className="about-card-label">OUR COMMUNITY</span>

              <h3>
                Connecting students with the opportunities beyond the
                classroom.
              </h3>

              <p>
                A space where students, recruiters and alumni come together
                through placements, events and meaningful interactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
