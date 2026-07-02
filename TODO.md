# TODO

## High Priority

- [ ] Connect Blog page to backend API (replace hardcoded placeholder data with fetch to `/api/blog`)
- [ ] Connect Testimonials page to backend API (replace hardcoded placeholder data with fetch to `/api/testimonials`)
- [ ] Build or remove Portfolio section (currently an empty shell)

## Medium Priority

- [ ] Build admin panel UI (login page + CRUD forms for blog posts and testimonial approval)
- [ ] Add individual blog post page (`/blog/:id` route + component)
- [ ] Implement dark mode CSS (Footer toggle exists but no styles respond to `data-theme`)
- [ ] Fix Navbar Blog link (`#blog` → `/#blog` for consistency with other nav links)
- [ ] Add loading and error states to Blog/Testimonials list pages

## Lower Priority

- [ ] Add SEO meta tags (description, Open Graph, dynamic page titles)
- [ ] Extract shared experience data from `experience.jsx` and `ExperienceList.jsx` into one file
- [ ] Add tests (backend unit tests + frontend component tests)
- [ ] Verify responsive/mobile experience across all pages
