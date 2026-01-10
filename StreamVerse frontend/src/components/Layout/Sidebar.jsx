import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiClock, FiThumbsUp, FiList, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-item">
          <FiHome />
          <span>Home</span>
        </NavLink>
        <NavLink to="/trending" className="nav-item">
          <FiTrendingUp />
          <span>Trending</span>
        </NavLink>
        
        {user && (
          <>
            <div className="nav-divider" />
            <NavLink to="/subscriptions" className="nav-item">
              <FiUsers />
              <span>Subscriptions</span>
            </NavLink>
            <NavLink to="/history" className="nav-item">
              <FiClock />
              <span>History</span>
            </NavLink>
            <NavLink to="/liked" className="nav-item">
              <FiThumbsUp />
              <span>Liked Videos</span>
            </NavLink>
            <NavLink to="/playlists" className="nav-item">
              <FiList />
              <span>Playlists</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
