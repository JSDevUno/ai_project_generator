# Vercel Deployment Guide

## Quick Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your `ai_project_generator` repository

2. **Configuration:**
   - Vercel will automatically detect the configuration from `vercel.json`
   - No additional setup required - the build commands are already configured

3. **Environment Variables (if needed):**
   - Add any required environment variables in the Vercel dashboard
   - The project includes `.env.example` files for reference

4. **Deploy:**
   - Click "Deploy" and Vercel will build and deploy your application
   - The frontend will be served as static files
   - The backend API will run as serverless functions

## Project Structure for Vercel

- **Frontend**: React + Vite app that builds to `frontend/dist/`
- **Backend**: Express.js API that runs as serverless functions
- **API Routes**: All backend routes are accessible under `/api/*`

## Build Process

The `vercel.json` configuration handles:
- Building the frontend with `npm run build`
- Serving static files from `frontend/dist/`
- Running backend as serverless functions
- Routing API calls to `/api/*` endpoints

## Live URL

Once deployed, your app will be available at:
`https://your-project-name.vercel.app`

## Automatic Deployments

Every push to the `main` branch will trigger an automatic deployment on Vercel.