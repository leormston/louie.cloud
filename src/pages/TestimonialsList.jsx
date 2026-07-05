import { Link } from 'react-router-dom'
import testimonials from '../data/testimonials'
import './TestimonialsList.css'

function TestimonialsList() {
  return (
    <div className="testimonials-list-page">
      <div className="testimonials-list-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Testimonials</h1>
        <p className="testimonials-list-subtitle">What people say about working with me</p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-card">
            <p className="testimonial-content">"{testimonial.content}"</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="testimonial-info">
                <h3 className="testimonial-name">{testimonial.name}</h3>
                <p className="testimonial-role">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && (
        <p className="testimonials-empty">No testimonials yet. Check back soon!</p>
      )}
    </div>
  )
}

export default TestimonialsList
