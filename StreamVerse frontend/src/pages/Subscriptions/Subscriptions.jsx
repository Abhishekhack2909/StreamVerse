import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import './Subscriptions.css';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await API.get('/subscriptions/u/subscribed');
      setSubscriptions(data.data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="subscriptions-page loading">Loading...</div>;
  }

  return (
    <div className="subscriptions-page">
      <h1>Subscriptions</h1>
      
      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <p>No subscriptions yet</p>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {subscriptions.map((sub) => (
            <Link
              key={sub._id}
              to={`/channel/${sub.channel?.username}`}
              className="subscription-card"
            >
              <img src={sub.channel?.avatar} alt={sub.channel?.username} />
              <span>{sub.channel?.username}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
