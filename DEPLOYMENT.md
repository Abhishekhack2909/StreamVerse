# StreamVerse Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- MongoDB Atlas database
- Cloudinary account
- Supabase project

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project
1. Go to https://railway.app and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose the `backend` folder as the root directory

### 1.2 Set Environment Variables
In Railway dashboard, go to your service → Variables, and add:

```
PORT=8000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streamverse
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-app.vercel.app
```

### 1.3 Deploy
Railway will automatically deploy. Note your backend URL (e.g., `https://streamverse-backend.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project
1. Go to https://vercel.com and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set the root directory to `StreamVerse frontend`
5. Framework Preset: Vite

### 2.2 Set Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2.3 Deploy
Click "Deploy" and wait for the build to complete.

---

## Step 3: Update Backend CORS

After getting your Vercel URL, update the `FRONTEND_URL` in Railway:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Try to register/login
3. Upload a video
4. Test StreamMeet

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check that both HTTP and HTTPS are handled

### Socket Connection Issues
- Ensure `VITE_SOCKET_URL` doesn't have `/api/v1` at the end
- Railway supports WebSockets by default

### Video Upload Fails
- Check Cloudinary credentials
- Verify file size limits (currently 50MB)

### Auth Issues
- Verify Supabase URL and keys are correct
- Check that the service key (backend) and anon key (frontend) are different

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description |
|----------|-------------|
| PORT | Server port (8000) |
| NODE_ENV | production |
| MONGODB_URI | MongoDB connection string |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_KEY | Supabase service role key |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| FRONTEND_URL | Your Vercel frontend URL |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL with /api/v1 |
| VITE_SOCKET_URL | Backend URL without /api/v1 |
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon/public key |
