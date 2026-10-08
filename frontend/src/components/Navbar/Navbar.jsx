import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const navLinks = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "News", href: "#news", id: "news" },
  { label: "Teams", href: "#teams", id: "teams" },
  { label: "Events", href: "#events", id: "events" },
  { label: "Alumni", href: "#alumni", id: "alumni" },
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

function Navbar({ onEasterEgg }) {
  const { isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("home");

  /* ---------- Easter egg ---------- */

  const easterEggClicks = useRef(0);
  const easterEggTimer = useRef(null);

  const handleEasterEggClick = () => {
    easterEggClicks.current += 1;

    if (easterEggClicks.current === 1) {
      easterEggTimer.current = setTimeout(() => {
        easterEggClicks.current = 0;
        easterEggTimer.current = null;
      }, 3500);
    }

    if (easterEggClicks.current >= 7) {
      clearTimeout(easterEggTimer.current);

      easterEggClicks.current = 0;
      easterEggTimer.current = null;

      onEasterEgg();
    }
  };

  useEffect(() => {
    return () => {
      if (easterEggTimer.current) {
        clearTimeout(easterEggTimer.current);
      }
    };
  }, []);

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

    function updateActiveSection() {
      const navbarHeight = 80;
      const triggerPoint = navbarHeight + 100;

      let activeId = sections[0].id;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        /*
         * The active section is the section that contains
         * the point just below the navbar.
         */
        if (
          rect.top <= triggerPoint &&
          rect.bottom > triggerPoint
        ) {
          activeId = section.id;
          break;
        }
      }

      setActiveSection(activeId);
    }

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
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

  console.log("ACTIVE SECTION:", activeSection);
  return (
    <>
      <nav
          className={`navbar ${
            scrolled ? "scrolled" : ""
          } ${menuOpen ? "menu-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="nav-inner">
          {/* Brand */}
          <a
            href="#home"
            className="brand"
            onClick={() => {
              closeMenu();
              handleEasterEggClick();
            }}
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
              {isAdmin && (
                <a
                  href="/admin"
                  className={
                    window.location.pathname === "/admin"
                      ? "active"
                      : ""
                  }
                >
                  Admin
                </a>
              )}

              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={
                    activeSection === link.id ? "active" : ""
                  }
                  onClick={() => setActiveSection(link.id)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              className={`theme-toggle ${menuOpen ? "menu-open" : ""}`}
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
            >
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}

              <span>
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className={`nav-toggle ${menuOpen ? "open" : ""}`}
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
        {isAdmin && (
          <a
            href="/admin"
            className={
              window.location.pathname === "/admin"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            Admin
          </a>
        )}

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
