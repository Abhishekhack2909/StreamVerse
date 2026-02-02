# Add Environment Variables to Vercel

## Your backend is deployed at: `https://streamverse-dc50.onrender.com`

## Steps to Fix Your Vercel Deployment:

### 1. Go to Vercel Dashboard
- Open: https://vercel.com/dashboard
- Click on your **StreamVerse** project

### 2. Go to Settings
- Click **Settings** tab at the top
- Click **Environment Variables** in the left sidebar

### 3. Add These 4 Environment Variables

Click "Add New" for each variable:

#### Variable 1:
- **Key**: `VITE_API_URL`
- **Value**: `https://streamverse-dc50.onrender.com/api/v1`
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

#### Variable 2:
- **Key**: `VITE_SOCKET_URL`
- **Value**: `https://streamverse-dc50.onrender.com`
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

#### Variable 3:
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://mowxeggnshcoeheunikk.supabase.co`
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

#### Variable 4:
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd3hlZ2duc2hjb2VoZXVuaWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzk0MDQsImV4cCI6MjA4MzYxNTQwNH0.LCHDTJxDoxVEtd24BDHKusY1RGZgVYgOYiwIPBL4rZI`
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

### 4. Redeploy Your Site
- Go to **Deployments** tab
- Find the latest deployment
- Click the **three dots (...)** on the right
- Click **Redeploy**
- Wait 2-3 minutes for the build to complete

### 5. Test Your Site
- Visit: https://streamverse-yt.vercel.app
- Try signing in
- Check if videos load
- Test on mobile

## Important Notes:

1. **Render Free Tier**: Your backend may sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up.

2. **CORS**: Make sure your backend's `FRONTEND_URL` environment variable in Render is set to:
   ```
   FRONTEND_URL=https://streamverse-yt.vercel.app
   ```

3. **Local Development**: If you want to test locally, uncomment the localhost URLs in your `.env` file and restart the dev server.

## Troubleshooting:

### Still not working after redeploy?
1. Check browser console (F12) for errors
2. Look for CORS errors or network errors
3. Verify all 4 environment variables are saved in Vercel
4. Make sure backend is awake (visit https://streamverse-dc50.onrender.com/api/v1/healthcheck)

### Backend sleeping?
- First request after sleep takes 30 seconds
- Consider upgrading to paid plan or using Railway instead

### Mobile still not working?
- Clear browser cache on mobile
- Try incognito/private mode
- Make sure you're using HTTPS (not HTTP)
