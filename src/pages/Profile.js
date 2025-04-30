import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css'; 

const Profile = ({ username, profilePhoto }) => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    joinDate: '',
    avatar: ''
  });
  const [friends, setFriends] = useState([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [tempAvatar, setTempAvatar] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedEmail = localStorage.getItem(`${username}_email`);
    
    if (storedUser) {
      setUserData({
        username: storedUser.username || username,
        email: storedEmail || '',
        joinDate: new Date().toLocaleDateString(),
        avatar: storedUser.profilePhoto || `https://i.pravatar.cc/150?u=${username}`
      });
    }

    const savedFriends = localStorage.getItem(`${username}_friends`);
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    }
  }, [username, profilePhoto]); // Added profilePhoto to dependencies

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAvatar = () => {
    if (tempAvatar) {
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...storedUser, profilePhoto: tempAvatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUserData(prev => ({ ...prev, avatar: tempAvatar }));
      setTempAvatar('');
      setIsEditingAvatar(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <div className="cover-photo"></div>
        <div className="profile-picture-container">
          {isEditingAvatar ? (
            <div className="avatar-edit-container">
              {tempAvatar ? (
                <img src={tempAvatar} alt="Preview" className="avatar-preview" />
              ) : (
                <div className="avatar-upload-prompt">
                  <i className="fas fa-camera"></i>
                  <span>Upload Photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-upload-input"
              />
              <div className="avatar-edit-actions">
                <button onClick={saveAvatar} disabled={!tempAvatar}>Save</button>
                <button onClick={() => setIsEditingAvatar(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={userData.avatar} 
                alt="Profile" 
                className="profile-picture"
              />
              <button 
                className="edit-avatar-btn"
                onClick={() => setIsEditingAvatar(true)}
              >
                <i className="fas fa-camera"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-info-section">
        <h1>{userData.username}</h1>
        <p className="user-email">{userData.email}</p>
        <p className="join-date">Joined {userData.joinDate}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-card" onClick={() => setShowFriendsModal(true)}>
          <span className="stat-number">{friends.length}</span>
          <span className="stat-label">Friends</span>
        </div>
        
      </div>

      <div className="friends-preview-section">
        <div className="section-header">
          <h2>Friends</h2>
          <button 
            className="view-all-btn"
            onClick={() => setShowFriendsModal(true)}
          >
            View All
          </button>
        </div>

        {friends.length > 0 ? (
          <div className="friends-grid">
            {friends.slice(0, 6).map((friend, index) => (
              <div key={index} className="friend-preview">
                <img 
                  src={`https://i.pravatar.cc/80?u=${friend}`} 
                  alt={friend} 
                />
                <p>{friend}</p>
              </div>
            ))}
            {friends.length > 6 && (
              <div className="friend-preview more-friends">
                <span>+{friends.length - 6}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="no-friends-message">No friends yet</p>
        )}
      </div>

      {showFriendsModal && (
        <div className="profile-modal-overlay" onClick={() => setShowFriendsModal(false)}>
          <div className="friends-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Friends</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowFriendsModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="friends-list">
              {friends.length > 0 ? (
                friends.map((friend, index) => (
                  <div key={index} className="friend-item">
                    <div className="friend-info">
                      <img 
                        src={`https://i.pravatar.cc/50?u=${friend}`} 
                        alt={friend} 
                      />
                      <span>{friend}</span>
                    </div>
                    <button className="message-btn">
                      Message
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-friends">
                  <p>You haven't added any friends yet</p>
                  <button 
                    className="find-friends-btn"
                    onClick={() => {
                      setShowFriendsModal(false);
                      navigate('/friends');
                    }}
                  >
                    Find Friends
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;