import AboutCardStack from "../../components/AboutCardStack/AboutCardStack";
import "./About.css";

const communityCards = [
  {
    image: "/assets/AboutStack/community.jpg",
    title: "Our Community",
  },
  {
    image: "/assets/AboutStack/alumni.jpg",
    title: "Connections That Last",
  },
  {
    image: "/assets/AboutStack/placement.jpg",
    title: "Professional Interactions",
  },
  {
    image: "/assets/AboutStack/event.jpg",
    title: "Beyond the Classroom",
  },
];

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

          <div className="about-card-wrapper">
            <AboutCardStack cards={communityCards} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
