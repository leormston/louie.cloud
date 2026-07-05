import { Link } from 'react-router-dom'
import blogIndex from '../../content/blog/index.json'
import './BlogList.css'

function BlogList() {
  return (
    <div className="blog-list-page">
      <div className="blog-list-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>All Blog Posts</h1>
        <p className="blog-list-subtitle">Thoughts on development, DevOps, and cloud engineering</p>
      </div>

      <div className="blog-grid">
        {blogIndex.map((post) => (
          <article key={post.slug} className="blog-card">
            <div className="blog-card-category">{post.category}</div>
            <h2 className="blog-card-title">{post.title}</h2>
            <p className="blog-card-date">
              {new Date(post.date).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="blog-card-excerpt">{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`} className="blog-card-link">
              Read More →
            </Link>
          </article>
        ))}
      </div>

      {blogIndex.length === 0 && (
        <p className="blog-empty">No blog posts yet. Check back soon!</p>
      )}
    </div>
  )
}

export default BlogList
