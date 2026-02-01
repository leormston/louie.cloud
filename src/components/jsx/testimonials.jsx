import { Link } from 'react-router-dom'

function Testimonials() {
  return (
    <section id="testimonials" className="testimonials">
      <h2>Testimonials</h2>
      <p>See what people say about working with me.</p>
      <Link to="/testimonials" className="view-all-button">
        View All Testimonials →
      </Link>
    </section>
  )
}

export default Testimonials
