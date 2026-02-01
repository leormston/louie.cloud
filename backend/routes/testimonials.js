import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import * as testimonialModel from '../models/testimonial.js';

const router = express.Router();

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await testimonialModel.getTestimonials();
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get single testimonial
router.get('/:id', async (req, res) => {
  try {
    const testimonial = await testimonialModel.getTestimonialById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonial' });
  }
});

// Create testimonial (public or authenticated)
router.post('/', async (req, res) => {
  try {
    const { author, content, title } = req.body;
    
    if (!author || !content) {
      return res.status(400).json({ error: 'Author and content are required' });
    }

    const testimonial = await testimonialModel.createTestimonial({
      id: uuidv4(),
      author,
      content,
      title: title || ''
    });

    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// Update testimonial (admin only)
router.put('/:id', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const updated = await testimonialModel.updateTestimonial(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// Delete testimonial (admin only)
router.delete('/:id', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    await testimonialModel.deleteTestimonial(req.params.id);
    res.json({ message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;
