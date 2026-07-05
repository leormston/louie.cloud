import { Link } from 'react-router-dom'
import testimonials from '../../data/testimonials'
import '../css/testimonials.css'

function Testimonials() {
  const previewTestimonials = testimonials.slice(0, 2)

  return (
    <section id="testimonials" className="testimonials">
      <h2>Testimonials</h2>
      <p>What people say about working with me.</p>

      {previewTestimonials.length > 0 && (
        <div className="testimonials-preview">
          {previewTestimonials.map((t) => (
            <div key={t.id} className="testimonial-preview-card">
              <p className="testimonial-preview-content">"{t.content}"</p>
              <div className="testimonial-preview-author">
                <span className="testimonial-preview-name">{t.name}</span>
                <span className="testimonial-preview-role">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/testimonials" className="view-all-button">
        View All Testimonials →
      </Link>
    </section>
  )
}

export default Testimonials
