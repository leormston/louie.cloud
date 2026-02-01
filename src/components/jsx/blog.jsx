import { Link } from 'react-router-dom'

function Blog() {
  return (
    <section id="blog" className="blog">
      <h2>Blog</h2>
      <p>Check out my latest thoughts on development, DevOps, and cloud engineering.</p>
      <Link to="/blog" className="view-all-button">
        View All Blog Posts →
      </Link>
    </section>
  )
}

export default Blog
