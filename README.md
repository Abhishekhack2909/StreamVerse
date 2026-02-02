# 🎬 StreamVerse

<div align="center">

![StreamVerse Banner](https://img.shields.io/badge/StreamVerse-Video%20Streaming%20Platform-blueviolet?style=for-the-badge)

**A modern, full-featured video streaming platform with live streaming and video conferencing capabilities**

[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=vercel)](https://streamverse-yt.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-API-blue?style=for-the-badge&logo=render)](https://streamverse-dc50.onrender.com)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🎥 Video Streaming
- **Upload & Share** - Upload videos with thumbnails and descriptions
- **Smart Feed** - Personalized video recommendations
- **Categories** - Browse by Gaming, Music, News, Sports, and more
- **Search** - Find videos instantly with powerful search
- **Watch History** - Track your viewing history

### 📺 Live Streaming
- **Go Live** - Stream to your audience in real-time
- **Live Chat** - Interact with viewers during streams
- **Stream Management** - Start, pause, and end streams easily
- **Viewer Count** - See how many people are watching

### 🎤 StreamMeet (Video Conferencing)
- **Video Calls** - High-quality peer-to-peer video calls
- **Screen Sharing** - Share your screen with participants
- **Chat** - In-meeting text chat
- **Participant Management** - See who's in the meeting
- **Meeting Links** - Share meeting links easily

### 👤 User Features
- **Authentication** - Secure login with Supabase Auth
- **Channels** - Create and customize your channel
- **Subscriptions** - Subscribe to your favorite creators
- **Likes & Comments** - Engage with content
- **Profile Management** - Edit profile, avatar, and cover image

### 🎨 Design
- **Modern UI** - Clean, minimalist black/white/grey theme
- **Responsive** - Works perfectly on desktop, tablet, and mobile
- **Dark Mode** - Easy on the eyes
- **Smooth Animations** - Polished user experience

---

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Icons** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Socket.io** - WebSocket server
- **Supabase** - Authentication & storage
- **Cloudinary** - Media storage & CDN

### Real-Time Features
- **WebRTC** - Peer-to-peer video/audio
- **Socket.io** - Real-time messaging
- **STUN/TURN** - NAT traversal for video calls

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting
- **Cloudinary** - Media CDN

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Supabase account
- Cloudinary account

### 1. Clone the Repository
```bash
git clone https://github.com/Abhishekhack2909/StreamVerse.git
cd StreamVerse
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CORS_ORIGIN=*
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd "StreamVerse frontend"
npm install
```

Create `StreamVerse frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start frontend:
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## 📦 Deployment

### Deploy Backend to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add environment variables from `backend/.env`
5. Deploy!

### Deploy Frontend to Vercel

1. Import project on [Vercel](https://vercel.com)
2. Set root directory to `StreamVerse frontend`
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   VITE_SOCKET_URL=https://your-backend.onrender.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Deploy!

📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🏗 Project Structure

```
StreamVerse/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Custom middleware
│   │   ├── db/              # Database connection
│   │   ├── socket.js        # Socket.io setup
│   │   ├── app.js           # Express app
│   │   └── index.js         # Entry point
│   └── package.json
│
└── StreamVerse frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   ├── context/         # React context
    │   ├── api/             # API client
    │   ├── lib/             # Utilities
    │   └── App.jsx          # Root component
    └── package.json
```

---

## 🔑 Key Features Explained

### Video Upload Flow
1. User selects video file and thumbnail
2. Files uploaded to Cloudinary
3. Video metadata saved to MongoDB
4. Video appears in feed

### Live Streaming Flow
1. User clicks "Go Live"
2. WebRTC connection established
3. Stream broadcasted via Socket.io
4. Viewers join and see live stream

### StreamMeet Flow
1. Host creates meeting room
2. Generates shareable link
3. Participants join via link
4. WebRTC peer connections established
5. Video/audio/screen sharing enabled

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Abhishek Tripathi**

- GitHub: [@Abhishekhack2909](https://github.com/Abhishekhack2909)
- LinkedIn: [Connect with me](https://linkedin.com/in/abhishek-tripathi)

---

## 🙏 Acknowledgments

- [React](https://react.dev) - UI library
- [Express](https://expressjs.com) - Backend framework
- [MongoDB](https://mongodb.com) - Database
- [Supabase](https://supabase.com) - Authentication
- [Cloudinary](https://cloudinary.com) - Media storage
- [Socket.io](https://socket.io) - Real-time communication
- [WebRTC](https://webrtc.org) - Video/audio streaming

---

## 📞 Support

If you have any questions or need help, please:
- Open an [issue](https://github.com/Abhishekhack2909/StreamVerse/issues)
- Email: your.email@example.com

---

## ⚠️ Important Notes

### Supabase Free Tier
- Projects pause after 7 days of inactivity
- Visit dashboard weekly to keep active
- Or upgrade to Pro plan

### Render Free Tier
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading for production use

---

<div align="center">

**Made with ❤️ by Abhishek Tripathi**

⭐ Star this repo if you found it helpful!

</div>
