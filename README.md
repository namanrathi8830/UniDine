# UniDine

UniDine is a comprehensive Instagram automation tool built using Meta's Instagram Graph API. It is designed to empower businesses—especially in the food, hospitality, and lifestyle sectors—with a powerful, scalable way to manage Instagram interactions, automate workflows, and enhance engagement with their audience.

## Project Overview

UniDine serves as a smart food-tech platform aimed at streamlining digital marketing and customer interactions via Instagram. It connects restaurants with customers through AI-powered automation while allowing businesses to maintain authentic relationships with their audience.

## Key Features

### Instagram Graph API Integration
- Fetching profile info, followers, and media data
- Comment moderation and auto-response capabilities
- Direct message interaction (with Webhook support)
- Post insights and engagement tracking

### AI-Powered Interaction
- Automated DM replies based on keywords or intents
- Smart comment responses (e.g., thank-you messages, coupon replies)
- Custom triggers for likes, replies, or media posts

### Webhook Support
- Real-time event handling when users interact with content
- Instant responses to user activity
- Seamless data collection and analytics

### Secure Access and Role Management
- Admin roles for managing settings and analytics
- Tester roles for simulating interactions

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- ShadCN UI component library
- React Router for navigation

### Backend
- Node.js and Express.js
- MongoDB for database
- JWT for authentication
- OpenAI API for AI-powered responses

### APIs and Integrations
- Instagram Graph API
- OpenAI API
- (Future) Google Maps, Dineout, EazyDiner APIs

## Project Structure

```
unidine/
├── frontend/         # React frontend (current directory)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── backend/          # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Instagram Business Account
- Meta Developer Account with Instagram Graph API access
- OpenAI API key

### Installation

1. Clone the repository:
```
git clone https://github.com/your-username/unidine.git
cd unidine
```

2. Set up the frontend:
```
npm install
npm run dev
```

3. Set up the backend:
```
cd backend
npm install
cp .env.example .env
# Update .env with your API keys and configuration
npm run dev
```

## Current Status

This project is under active development. The following components are in progress:
- Instagram bot integration
- Real-time restaurant saving and recommendations
- Frontend + Backend logic
- APIs integration (Google Maps, Dineout, EazyDiner)
- Future AI bot calling support

## License

[MIT](LICENSE)

# UniDine Instagram Webhook

This is a webhook server for Instagram API integration for UniDine. It handles Instagram webhook events and provides API endpoints for fetching Instagram data.

## Prerequisites

1. A Meta Developer account
2. Instagram Business Account set up for your app
3. An Instagram app created in the Meta Developer dashboard with basic settings configured

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file with your configuration:
```
VERIFY_TOKEN=your_own_custom_token
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_APP_ID=your_app_id_from_meta
INSTAGRAM_APP_SECRET=your_app_secret_from_meta
```

3. Set up Instagram API access by running:
```
npm run setup-instagram
```
   - Visit the URL displayed (http://localhost:3001/auth)
   - Follow the authorization flow to grant your app access to your Instagram account
   - Copy the long-lived token displayed and add it to your .env file

4. Run the server:
```
npm start
```

5. For local development, expose your local server:
```
npm run expose
```
   This will give you a public URL that you can use to set up the webhook.

## Instagram Webhook Setup

1. Use the callback URL (from localtunnel) in the Instagram app dashboard
   - Go to App Dashboard → Instagram API Setup → Step 2: Configure Webhooks
   - Set the Callback URL to your tunnel URL + "/webhook" (e.g., https://yourapp.loca.lt/webhook)
   - Set Verify Token to the same value in your .env file
   - Select fields to subscribe to (e.g., mentions, comments)

2. After verification, subscribe to the webhooks you need by clicking "Add subscriptions"

3. Set up the Instagram business login (Step 3 in dashboard)
   - This gives your app permissions to access Instagram data

4. Complete the app review process to go live with your app

## API Endpoints

- `GET /profile` - Get basic profile information for the connected Instagram account
- `GET /media` - Get recent media posts from the connected Instagram account
- `GET /webhook` - Webhook verification endpoint (used by Instagram)
- `POST /webhook` - Webhook event receiver

## Webhook Event Handling

The webhook events are received at the `/webhook` POST endpoint. You can modify the handler in `index.js` to process different types of events according to your needs.

# UniDine Bot

A bot that collects and manages restaurant recommendations from Instagram messages.

## Features

- Processes Instagram direct messages, comments, and mentions
- Extracts restaurant information from user messages
- Stores restaurant data in MongoDB
- Sends confirmation messages to users

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB
- Instagram Developer Account
- Facebook Developer Account (for Instagram API access)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/unidine.git
   cd unidine
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials.

### Instagram API Setup

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com/)
2. Add Instagram Basic Display and Instagram Graph API products
3. Configure the webhook settings:
   - Callback URL: `https://your-domain.com/webhook`
   - Verify Token: Same as `VERIFY_TOKEN` in your `.env` file
   - Subscribe to: `messages`, `mentions`, `comments`

### Running the Application

#### Development Mode
```
npm run dev
```

#### Production Mode
```
npm run build
npm start
```

## Testing the Webhook

You can use tools like Ngrok to expose your local server to the internet for testing:

```
ngrok http 3000
```

Then use the generated URL (e.g., `https://abc123.ngrok.io`) as your webhook URL in the Facebook Developer settings.

## Project Structure

- `index.js` - Main application entry point and webhook handler
- `src/models/` - MongoDB schemas
- `src/controllers/` - Business logic
- `src/routes/` - API routes
- `src/utils/` - Helper functions

## How It Works

1. Users send messages to the Instagram account with restaurant recommendations
2. The webhook receives these messages
3. The application processes the messages, extracting restaurant information
4. The data is stored in MongoDB
5. The bot sends a confirmation message back to the user

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# UniDine Instagram Bot

A web application that processes Instagram messages and comments to extract and save restaurant recommendations.

## Deployment on Vercel

### Prerequisites
- A Vercel account
- MongoDB database (can use MongoDB Atlas free tier)
- Instagram app set up in Meta for Developers portal

### How to Deploy

1. **Push your code to GitHub**
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign in and create a new project
   - Import your GitHub repository
   - Configure the following environment variables in Vercel:
     - `VERIFY_TOKEN`
     - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
     - `INSTAGRAM_ACCESS_TOKEN`
     - `INSTAGRAM_APP_ID`
     - `INSTAGRAM_APP_SECRET`
     - `INSTAGRAM_REDIRECT_URI` (use this URL: `https://unidine.vercel.app/auth/callback`)
     - `MONGODB_URI`

3. **Update Instagram App Configuration**
   - Go to [Meta for Developers](https://developers.facebook.com/apps/)
   - Select your app
   - Go to "Instagram Basic Display" settings
   - Update the Valid OAuth Redirect URIs with your Vercel domain
   - Save changes

4. **Test the Deployment**
   - Visit your Vercel URL to access the application
   - Try the Instagram login flow
   - Set up the webhook in your Instagram app to point to your Vercel domain

## Local Development

1. **Install dependencies**
   ```
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your credentials

3. **Run development server**
   ```
   npm run dev
   ```

4. **Expose local server for testing (optional)**
   ```
   npm run expose
   ```
