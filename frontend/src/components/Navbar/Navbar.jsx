import { useEffect, useState } from "react";
import "./Navbar.css";

const navLinks = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "News", href: "#news", id: "news" },
  { label: "Teams", href: "#teams", id: "teams" },
  { label: "Events", href: "#events", id: "events" },
  { label: "Contact Us", href: "#contact", id: "contact" },
];

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("home");

  /* ---------- Load saved theme ---------- */

  useEffect(() => {
    const savedTheme = localStorage.getItem("tp_theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.setAttribute(
        "data-theme",
        savedTheme
      );
    } else {
      document.documentElement.setAttribute(
        "data-theme",
        "dark"
      );
    }
  }, []);

  /* ---------- Navbar scroll state ---------- */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ---------- Active navigation section ---------- */

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ---------- Theme ---------- */

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    document.documentElement.setAttribute(
      "data-theme",
      nextTheme
    );

    localStorage.setItem("tp_theme", nextTheme);
  };

  /* ---------- Mobile menu ---------- */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`navbar ${scrolled ? "scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="nav-inner">
          {/* Brand */}
          <a
            href="#home"
            className="brand"
            onClick={closeMenu}
          >
            <div className="brand-mark">T&amp;P</div>

            <div className="brand-text">
              <div className="brand-title">
                Training &amp; Placement Club
              </div>

              <div className="brand-subtitle">
                GPREC · KURNOOL
              </div>
            </div>
          </a>

          <div className="nav-actions">
            {/* Desktop links */}
            <div className="nav-links">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={activeSection === link.id ? "active" : ""}
                  onClick={() => setActiveSection(link.id)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Current theme: ${
                theme === "dark" ? "Dark" : "Light"
              }`}
              title={`Current theme: ${
                theme === "dark" ? "Dark" : "Light"
              }`}
            >
              {theme === "dark" ? (
                <MoonIcon />
              ) : (
                <SunIcon />
              )}

              <span>
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            {/* Mobile toggle */}
            <button
              type="button"
              className={`nav-toggle ${
                menuOpen ? "open" : ""
              }`}
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`mobile-menu ${
          menuOpen ? "open" : ""
        }`}
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={activeSection === link.id ? "active" : ""}
            onClick={() => {
              setActiveSection(link.id);
              closeMenu();
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}

export default Navbar;
