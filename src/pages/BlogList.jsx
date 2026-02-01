import { Link } from 'react-router-dom'
import './BlogList.css'

function BlogList() {
  // Placeholder blog data - you can replace this with real data later
  const blogs = [
    {
      id: 1,
      title: 'Getting Started with React',
      date: '2026-01-15',
      excerpt: 'Learn the fundamentals of React and build your first component.',
      category: 'Tutorial'
    },
    {
      id: 2,
      title: 'Understanding TypeScript',
      date: '2026-01-10',
      excerpt: 'A deep dive into TypeScript and why you should use it.',
      category: 'Development'
    },
    {
      id: 3,
      title: 'DevOps Best Practices',
      date: '2026-01-05',
      excerpt: 'Essential DevOps practices for modern development teams.',
      category: 'DevOps'
    }
  ]

  return (
    <div className="blog-list-page">
      <div className="blog-list-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>All Blog Posts</h1>
        <p className="blog-list-subtitle">Thoughts on development, DevOps, and cloud engineering</p>
      </div>

      <div className="blog-grid">
        {blogs.map((blog) => (
          <article key={blog.id} className="blog-card">
            <div className="blog-card-category">{blog.category}</div>
            <h2 className="blog-card-title">{blog.title}</h2>
            <p className="blog-card-date">{new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="blog-card-excerpt">{blog.excerpt}</p>
            <a href="#" className="blog-card-link">Read More →</a>
          </article>
        ))}
      </div>
    </div>
  )
}

export default BlogList
