import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseFrontmatter } from '../utils/parseFrontmatter'
import blogIndex from '../../content/blog/index.json'
import './BlogPost.css'

// Import all markdown files from content/blog as raw text
const markdownFiles = import.meta.glob('../../content/blog/*.md', {
  query: '?raw',
  import: 'default'
})

function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      setError(null)

      // Check if slug exists in the index
      const meta = blogIndex.find(p => p.slug === slug)
      if (!meta) {
        setError('Post not found')
        setLoading(false)
        return
      }

      // Find and load the matching markdown file
      const filePath = `../../content/blog/${slug}.md`
      const loader = markdownFiles[filePath]

      if (!loader) {
        setError('Post content not found')
        setLoading(false)
        return
      }

      try {
        const rawMarkdown = await loader()
        const { data, content } = parseFrontmatter(rawMarkdown)
        setPost({ ...meta, ...data, content })
      } catch (err) {
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-error">
          <h1>{error}</h1>
          <Link to="/blog" className="back-link">← Back to Blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-post-page">
      <div className="blog-post-header">
        <Link to="/blog" className="back-link">← Back to Blog</Link>
        <div className="blog-post-meta">
          <span className="blog-post-category">{post.category}</span>
          <span className="blog-post-date">
            {new Date(post.date).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <h1 className="blog-post-title">{post.title}</h1>
        <p className="blog-post-author">By {post.author}</p>
      </div>

      <article className="blog-post-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </article>
    </div>
  )
}

export default BlogPost
