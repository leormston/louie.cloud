# Portfolio Backend

Express.js backend API for portfolio application with AWS Cognito authentication and DynamoDB integration.

## Features

- Express.js REST API
- AWS Cognito authentication
- DynamoDB integration for blog posts and testimonials
- CORS enabled
- Error handling and logging

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
```

## Installation

```bash
npm install --production
```

## Development

```bash
npm install
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/blog` - Get all blog posts
- `POST /api/blog` - Create blog post (authenticated)
- `GET /api/testimonials` - Get all testimonials
- `POST /api/testimonials` - Create testimonial (authenticated)

## Deployment

See the main README.md for deployment instructions.
