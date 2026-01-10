import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Watch from './pages/Watch/Watch';
import Upload from './pages/Upload/Upload';
import Edit from './pages/Edit/Edit';
import EditChannel from './pages/EditChannel/EditChannel';
import Channel from './pages/Channel/Channel';
import Search from './pages/Search/Search';
import History from './pages/History/History';
import LikedVideos from './pages/LikedVideos/LikedVideos';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Playlists from './pages/Playlists/Playlists';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="watch/:videoId" element={<Watch />} />
            <Route path="channel/:username" element={<Channel />} />
            <Route path="search" element={<Search />} />
            <Route path="trending" element={<Home />} />
            
            {/* Protected Routes */}
            <Route path="upload" element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } />
            <Route path="edit/:videoId" element={
              <ProtectedRoute>
                <Edit />
              </ProtectedRoute>
            } />
            <Route path="edit-channel" element={
              <ProtectedRoute>
                <EditChannel />
              </ProtectedRoute>
            } />
            <Route path="history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="liked" element={
              <ProtectedRoute>
                <LikedVideos />
              </ProtectedRoute>
            } />
            <Route path="subscriptions" element={
              <ProtectedRoute>
                <Subscriptions />
              </ProtectedRoute>
            } />
            <Route path="playlists" element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
