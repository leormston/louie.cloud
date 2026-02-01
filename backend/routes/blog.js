import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import * as blogPostModel from '../models/blogPost.js';

const router = express.Router();

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const posts = await blogPostModel.getBlogPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const post = await blogPostModel.getBlogPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Create blog post (authenticated)
router.post('/', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const post = await blogPostModel.createBlogPost({
      id: uuidv4(),
      title,
      content,
      author: author || req.user.Username
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Update blog post (authenticated)
router.put('/:id', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const updated = await blogPostModel.updateBlogPost(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post (authenticated)
router.delete('/:id', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    await blogPostModel.deleteBlogPost(req.params.id);
    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

export default router;
