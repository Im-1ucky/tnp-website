import {
  Mail,
  Send,
} from "lucide-react";
import "./Contact.css";

function Contact() {
  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const name = form.name.value.trim();
    const message = form.message.value.trim();

    const subject = `Inquiry from ${name}`;

    const body = message;

    //Change the mail here in case the accont is different
    const mailto = `mailto:tpac@gprec.ac.in?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.open(mailto, "_blank");
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">

        <div className="contact-layout">

          {/* =========================
              EDITORIAL / VISUAL SIDE
              ========================= */}

          <div className="contact-visual">

            <div className="contact-visual-content">

              <div className="contact-eyebrow">
                <div className="eyebrow">
                  Get In Touch
                </div>
              </div>

              <h2 className="section-title">
                Connect With Us
              </h2>

              <p className="section-sub">
                Have a query, collaboration idea, recruitment
                opportunity, or something you'd like to discuss?
                We'd be happy to hear from you.
              </p>

              <div className="contact-illustration">
                <img
                  src="/assets/Contact/contactus.png"
                  alt="Connect with the Training & Placement Club"
                />
              </div>

            </div>

          </div>


          {/* =========================
              FUNCTIONAL SIDE
              ========================= */}

          <div className="contact-form">

            <div className="contact-form-head">

              <span className="contact-form-label">
                Send a message
              </span>

              <h3>
                What's on your mind.
              </h3>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="contact-form-group">

                <label htmlFor="contact-name">
                  Full Name <span>*</span>
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  required
                />

              </div>


              <div className="contact-form-group">

                <label htmlFor="contact-message">
                  Message <span>*</span>
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Write your message here..."
                  required
                />

              </div>


              <button
                type="submit"
                className="contact-submit"
              >
                <span>Send Inquiry</span>

                <Send
                  size={16}
                  strokeWidth={1.9}
                />
              </button>

            </form>

          </div>

        </div>

      </div>


      {/* =========================
          CONTACT FOOTER
          ========================= */}

      <div className="contact-footer">
        <div className="contact-footer-inner">

          <div className="contact-footer-brand">
            <strong>Training &amp; Placement Club</strong>
            <span>GPREC · KURNOOL</span>
          </div>

          <div className="contact-footer-links">
            <a
              href="https://www.instagram.com/tnpclub_gprec/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              {/* your existing Instagram SVG */}
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </a>

            <a
              href="mailto:tpac@gprec.ac.in"
              target="_blank"
              rel="noreferrer"
              aria-label="Email"
            >
              <Mail size={18} strokeWidth={1.8} />
            </a>
          </div>

          <div className="contact-footer-bottom">
            © 2026 Training &amp; Placement Club · GPREC
          </div>

        </div>
      </div>

    </section>
  );
}

export default Contact;
