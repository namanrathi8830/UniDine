# UniDine Backend

Backend service for UniDine, an Instagram automation tool for food, hospitality, and lifestyle businesses.

## Features

- Instagram Graph API integration
- AI-powered automated responses
- Webhook support for real-time Instagram events
- User authentication and role management
- API endpoints for managing Instagram accounts and interactions

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- OpenAI API for AI-powered responses
- Instagram Graph API for social media automation

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Instagram Business Account
- Meta Developer Account with Instagram Graph API access
- OpenAI API key

## Setup

1. Clone the repository
2. Install dependencies:
```
cd backend
npm install
```

3. Copy the environment variables file and update it with your values:
```
cp .env.example .env
```

4. Set up MongoDB (either locally or using MongoDB Atlas)

5. Set up your Meta Developer Account:
   - Create an app in the Meta Developer Portal
   - Set up Instagram Graph API permissions
   - Configure basic settings and app review
   - Set up your webhook endpoints

6. Start the development server:
```
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get current user profile

### Instagram
- `GET /api/instagram/auth/start` - Start Instagram account connection
- `GET /api/instagram/auth/callback` - Handle OAuth callback
- `GET /api/instagram/accounts` - Get user's Instagram accounts
- `GET /api/instagram/accounts/:accountId/media` - Get media for an account
- `GET /api/instagram/accounts/:accountId/media/:mediaId/comments` - Get comments for a media
- `POST /api/instagram/accounts/:accountId/comments/:commentId/reply` - Reply to a comment

### Webhooks
- `GET /api/webhooks/instagram` - Verify webhook subscription
- `POST /api/webhooks/instagram` - Handle webhook events

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration
│   └── index.js         # App entry point
├── .env.example         # Environment variables example
├── package.json         # Project metadata
└── README.md            # Project documentation
```

## License

[MIT](LICENSE) 