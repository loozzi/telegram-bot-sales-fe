# Vercel Deployment

This project is configured for deployment on Vercel.

## Environment Variables

Before deploying, make sure to set the following environment variable in your Vercel project settings:

- `VITE_API_BASE_URL` - Your backend API URL (e.g., `https://api.example.com`)

## Deployment Steps

1. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

## Configuration

The `vercel.json` file includes:
- SPA routing support (all routes redirect to index.html)
- Asset caching for optimal performance
- Environment variable configuration

## Auto-deployment

Connect your GitHub repository to Vercel for automatic deployments on every push to main branch.
