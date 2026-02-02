# Quick Fix for Mobile/Production Issues

## Problem
Your frontend is deployed on Vercel but the backend is not deployed, so API calls fail.

## Solution: Deploy Backend to Render (Free)

### Step 1: Deploy Backend to Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: streamverse-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   PORT=8000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://Abhi:qwerty12345@cluster0.4xfoywe.mongodb.net/StreamVerse?retryWrites=true&w=majority
   SUPABASE_URL=https://mowxeggnshcoeheunikk.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd3hlZ2duc2hjb2VoZXVuaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzk0MDQsImV4cCI6MjA4MzYxNTQwNH0.LCHDTJxDoxVEtd24BDHKusY1RGZgVYgOYiwIPBL4rZI
   CLOUDINARY_CLOUD_NAME=dbvsnot5n10d
   CLOUDINARY_API_KEY=267714936497825
   CLOUDINARY_API_SECRET=E4KdoJd5gmTlGCz1pcsolZRAx-E
   FRONTEND_URL=https://streamverse-yt.vercel.app
   CORS_ORIGIN=*
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://streamverse-backend.onrender.com`)

### Step 2: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your StreamVerse project
3. Go to Settings → Environment Variables
4. Add these variables (replace with your actual backend URL):
   ```
   VITE_API_URL=https://streamverse-backend.onrender.com/api/v1
   VITE_SOCKET_URL=https://streamverse-backend.onrender.com
   VITE_SUPABASE_URL=https://mowxeggnshcoeheunikk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd3hlZ2duc2hjb2VoZXVuaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzk0MDQsImV4cCI6MjA4MzYxNTQwNH0.LCHDTJxDoxVEtd24BDHKusY1RGZgVYgOYiwIPBL4rZI
   ```

5. Go to Deployments tab
6. Click "..." on the latest deployment → "Redeploy"

### Step 3: Test

1. Wait for Vercel to redeploy (2-3 minutes)
2. Visit https://streamverse-yt.vercel.app
3. Try signing in and using the app

## For Local Mobile Testing (Alternative)

If you just want to test on your mobile phone while developing:

1. Find your laptop's IP address:
   - Windows: Open CMD and run `ipconfig`, look for IPv4 Address
   - Mac: Open Terminal and run `ifconfig | grep "inet "`, look for 192.168.x.x

2. Update `StreamVerse frontend/.env`:
   ```
   VITE_API_URL=http://YOUR_LAPTOP_IP:8000/api/v1
   VITE_SOCKET_URL=http://YOUR_LAPTOP_IP:8000
   ```
   Example: `VITE_API_URL=http://192.168.1.100:8000/api/v1`

3. Make sure:
   - Your mobile and laptop are on the same WiFi
   - Backend is running on your laptop
   - Restart the frontend dev server

4. Access from mobile: `http://YOUR_LAPTOP_IP:5173`

## Notes

- Render free tier may sleep after 15 minutes of inactivity (first request takes ~30 seconds to wake up)
- For production, consider upgrading to a paid plan
- Railway is another good alternative to Render
