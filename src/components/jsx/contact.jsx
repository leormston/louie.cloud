import { useState } from 'react'
import '../css/contact.css'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '' // Anti-spam honeypot field
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you for your message! I\'ll get back to you soon.'
        })
        setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' })
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Something went wrong. Please try again.'
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2>Get In Touch</h2>
        <p className="contact-intro">
          Email me directly at <a href="mailto:louie@louie.cloud" className="email-link">louie@louie.cloud</a> or use the contact form below
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Honeypot field - hidden from users, catches bots */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleChange}
              style={{ display: 'none' }}
              tabIndex="-1"
              autoComplete="off"
            />

            {status.message && (
              <div className={`form-status ${status.type}`}>
                {status.message}
              </div>
            )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>

          <p className="response-time">
            I typically respond within 24-48 hours
          </p>
        </form>
      </div>
    </section>
  )
}

export default Contact
