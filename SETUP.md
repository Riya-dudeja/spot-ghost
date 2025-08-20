# SpotGhost Setup Guide

## Environment Configuration

The application requires the following environment variables in `.env.local`:

### Required Variables:
- `MONGODB_URI`: MongoDB connection string (e.g., `mongodb://localhost:27017/spot-ghost`)
- `JWT_SECRET`: Secret key for JWT token generation (change this in production!)

### Optional Variables:
- `API_KEY`: Gemini AI API key for advanced job analysis features
- `NODE_ENV`: Environment (development/production)

## Database Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env.local` with your connection string

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
```

## Issues Fixed

- ✅ Missing environment variables
- ✅ Tailwind CSS v4 configuration issues (downgraded to v3)
- ✅ PostCSS configuration
- ✅ Build errors resolved
- ✅ Development server starts successfully

## Features

- Job fraud detection and analysis
- User authentication system
- Dashboard with job analysis tools
- Browser extension integration
- AI-powered analysis (with Gemini API)