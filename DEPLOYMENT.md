# Deployment Guide for Netlify

This guide will help you deploy your Expo application to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://www.netlify.com)
2. Node.js 18+ installed locally
3. Git repository set up

## Step-by-Step Deployment

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Build the project locally first to test:**
   ```bash
   npm install
   npm run build:web
   ```
   This will create a `dist` directory with the static files.

2. **Push your code to GitHub/GitLab/Bitbucket:**
   ```bash
   git add .
   git commit -m "Add web compatibility and Netlify configuration"
   git push origin main
   ```

3. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select your repository

4. **Configure build settings:**
   - Build command: `npm run build:web`
   - Publish directory: `dist`
   - Node version: `18` (or latest LTS)
   
   Note: If your build outputs to a different directory (check after running `npm run build:web`), update the publish directory accordingly.

5. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Build the project:**
   ```bash
   npm install
   npm run build:web
   ```

4. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

If your app uses environment variables (like API keys), add them in Netlify:

1. Go to Site settings → Environment variables
2. Add your variables (e.g., `EXPO_PUBLIC_API_URL`)

## Web Compatibility Features

The following features have been made web-compatible:

1. **Camera**: Uses HTML5 MediaDevices API on web, Expo Camera on native
2. **Location**: Uses browser Geolocation API on web, Expo Location on native
3. **Haptics**: Gracefully handles web (no-op)
4. **Keyboard**: Properly handles web keyboard behavior

## Testing Locally

Before deploying, test the web build locally:

```bash
# Build for web
npm run build:web

# Serve the build (requires a simple HTTP server)
npx serve dist
```

Or use Expo's web server:
```bash
npm run web
```

## Troubleshooting

### Build fails
- Ensure Node.js version is 18+
- Check that all dependencies are installed: `npm install`
- Review build logs in Netlify dashboard

### Camera not working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions for camera access
- Test in Chrome/Firefox (Safari may have limitations)

### Location not working
- Ensure HTTPS is enabled (required for geolocation)
- Check browser permissions for location access

## Custom Domain

To add a custom domain:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

Netlify automatically deploys when you push to your connected branch. To change this:
1. Go to Site settings → Build & deploy
2. Configure your build settings and branch preferences

