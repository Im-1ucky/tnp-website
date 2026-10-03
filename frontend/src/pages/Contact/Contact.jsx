import "./Contact.css";

function Contact() {
  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const purpose = form.purpose.value;
    const message = form.message.value.trim();

    const subject = `${purpose} - Inquiry from ${name}`;

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Purpose: ${purpose}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const mailto = `mailto:Mail-tpo@gprec.ac.in?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">

        <div className="section-head contact-head">
          <div className="contact-eyebrow">
            <div className="eyebrow">
              Get In Touch
            </div>
          </div>

          <h2 className="section-title">
            Connect With Us
          </h2>

          <p className="section-sub">
            Have a question, recruitment opportunity, collaboration idea,
            or something you'd like to discuss with the Training &amp;
            Placement Club?
          </p>
        </div>

        <div className="contact-form">
          <div className="contact-form-head">
            <h3>Send an Inquiry</h3>

            <p>
              Fill in the details below and we'll get your message
              to the Training &amp; Placement Office.
            </p>
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
              <label htmlFor="contact-email">
                Email Address <span>*</span>
              </label>

              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="contact-form-group">
              <label htmlFor="contact-purpose">
                Purpose <span>*</span>
              </label>

              <select
                id="contact-purpose"
                name="purpose"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select purpose
                </option>

                <option value="Campus Recruitment / Drive Schedule">
                  Campus Recruitment / Drive Schedule
                </option>

                <option value="Workshop / Guest Session">
                  Workshop / Guest Session
                </option>

                <option value="Industry Collaboration">
                  Industry Collaboration
                </option>

                <option value="Alumni Engagement">
                  Alumni Engagement
                </option>

                <option value="Student Enquiry">
                  Student Enquiry
                </option>

                <option value="General Enquiry">
                  General Enquiry
                </option>
              </select>
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

            <div className="contact-form-group">
              <label htmlFor="contact-recipient">
                Send To
              </label>

              <div
                id="contact-recipient"
                className="contact-recipient"
              >
                <span>Training &amp; Placement Office</span>
                <span>Mail-tpo@gprec.ac.in</span>
              </div>
            </div>

            <button
              type="submit"
              className="contact-submit"
            >
              Send Inquiry
            </button>

          </form>
        </div>

      </div>
    </section>
  );
}

export default Contact;
