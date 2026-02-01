import { Link } from 'react-router-dom'
import './TestimonialsList.css'

function TestimonialsList() {
  // Placeholder testimonial data - you can replace this with real data later
  const testimonials = [
    {
      id: 1,
      name: 'John Smith',
      role: 'CTO at TechCorp',
      content: 'Louie is an exceptional engineer with deep knowledge of cloud infrastructure. His work on our platform was outstanding.',
      rating: 5,
      image: 'https://via.placeholder.com/80'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Engineering Manager at StartupXYZ',
      content: 'Working with Louie was a great experience. His DevOps expertise helped us streamline our deployment process.',
      rating: 5,
      image: 'https://via.placeholder.com/80'
    },
    {
      id: 3,
      name: 'Michael Chen',
      role: 'Lead Developer at CloudSolutions',
      content: 'Highly skilled professional with excellent problem-solving abilities. Would definitely work with again.',
      rating: 5,
      image: 'https://via.placeholder.com/80'
    }
  ]

  return (
    <div className="testimonials-list-page">
      <div className="testimonials-list-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>All Testimonials</h1>
        <p className="testimonials-list-subtitle">What people say about working with me</p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-card">
            <div className="testimonial-rating">
              {'★'.repeat(testimonial.rating)}
            </div>
            <p className="testimonial-content">"{testimonial.content}"</p>
            <div className="testimonial-author">
              <img src={testimonial.image} alt={testimonial.name} className="testimonial-image" />
              <div className="testimonial-info">
                <h3 className="testimonial-name">{testimonial.name}</h3>
                <p className="testimonial-role">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsList
