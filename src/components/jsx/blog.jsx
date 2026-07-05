import { Link } from 'react-router-dom'
import blogIndex from '../../../content/blog/index.json'
import '../css/blog.css'

function Blog() {
  // Show latest 3 posts
  const latestPosts = blogIndex.slice(0, 3)

  return (
    <section id="blog" className="blog">
      <h2>Blog</h2>
      <p>Check out my latest thoughts on Development, DevOps, and Cloud Engineering.</p>

      {latestPosts.length > 0 && (
        <div className="blog-preview-list">
          {latestPosts.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-preview-item">
              <span className="blog-preview-category">{post.category}</span>
              <h3 className="blog-preview-title">{post.title}</h3>
              <p className="blog-preview-date">
                {new Date(post.date).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </Link>
          ))}
        </div>
      )}

      <Link to="/blog" className="view-all-button">
        View All Blog Posts →
      </Link>
    </section>
  )
}

export default Blog
