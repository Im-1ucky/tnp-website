import Navbar from "../../components/Navbar/Navbar";
import "./Home.css";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero" id="home">
          {/* Background video */}
          <video
            className="hero-bg-video"
            autoPlay
            muted
            loop
            playsInline
            poster="/assets/tp-infrastructure.jpg"
            aria-hidden="true"
          >
            <source
              src="/assets/tp-block-video.mp4"
              type="video/mp4"
            />

            <source
              src="/data/T&P%20Block.mp4"
              type="video/mp4"
            />
          </video>

          <div className="hero-overlay" />

          {/* Hero content */}
          <div className="container hero-content">
            <h1 className="hero-anim-1">
              Training &amp; Placement Club
            </h1>

            <div className="college-sub hero-anim-2">
              G. Pulla Reddy Engineering College (Autonomous)
            </div>

            <div className="inst-sub hero-anim-3">
              Autonomous Institution · Kurnool, Andhra Pradesh
            </div>

            <p className="tagline hero-anim-4">
              Building connections, creating opportunities, shaping futures.
            </p>

            <div className="hero-ctas hero-anim-5">
              <a href="#about" className="btn btn-primary">
                Explore Our Club
                <ArrowIcon />
              </a>

              <a href="#teams" className="btn btn-ghost">
                Meet Our Team
                <ArrowIcon />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
