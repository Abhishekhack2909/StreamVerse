import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiUpload, FiUser, FiLogOut, FiMenu } from 'react-icons/fi';
import { useState } from 'react';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <FiMenu />
        </button>
        <Link to="/" className="logo">
          StreamVerse
        </Link>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">
          <FiSearch />
        </button>
      </form>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/upload" className="upload-btn">
              <FiUpload />
            </Link>
            <div className="user-menu">
              <button 
                className="avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img src={user.avatar} alt={user.username} />
              </button>
              {showDropdown && (
                <div className="dropdown">
                  <Link to={`/channel/${user.username}`} onClick={() => setShowDropdown(false)}>
                    <FiUser /> Your Channel
                  </Link>
                  <button onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
