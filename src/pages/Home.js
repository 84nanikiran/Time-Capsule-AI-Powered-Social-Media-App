import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate, useLocation } from "react-router-dom";
import Profile from "./Profile";
import Friends from "./Friends";
import AvatarGeneration from "./AvatarGeneration";
import MoodAi from "./MoodAi"; 
import FutureSelfPredictions from "./FutureSelfPredictions";
import AiMemoryVault from "./AiMemoryVault";
import AiStorytellingMode from "./AIStorytellingMode";

const Home = () => {
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyImage, setStoryImage] = useState(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [avatars, setAvatars] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isFriendsPage = location.pathname.includes('/friends');

  // Initialize data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.username) {
      setUsername(userData.username);
      setProfilePhoto(userData.profilePhoto || "");
      
      // Load and normalize posts
      let userPosts = JSON.parse(localStorage.getItem(`posts_${userData.username}`)) || [];
      userPosts = userPosts.map(post => ({
        ...post,
        likes: post.likes || [],
        comments: post.comments || []
      }));
      
      // Load and filter stories
      const userStories = JSON.parse(localStorage.getItem(`stories_${userData.username}`)) || [];
      const now = new Date();
      const validStories = userStories.filter(story => {
        const storyDate = new Date(story.timestamp);
        return (now - storyDate) < 24 * 60 * 60 * 1000;
      });

      // Load avatars
      const userAvatars = JSON.parse(localStorage.getItem(`avatars_${userData.username}`)) || [];
      setAvatars(userAvatars);

      // Initialize comment texts
      const initialCommentTexts = {};
      userPosts.forEach(post => {
        initialCommentTexts[post.id] = "";
      });

      setPosts(userPosts);
      setStories(validStories);
      setCommentTexts(initialCommentTexts);
      localStorage.setItem(`stories_${userData.username}`, JSON.stringify(validStories));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle story expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const validStories = stories.filter(story => {
        const storyDate = new Date(story.timestamp);
        return (now - storyDate) < 24 * 60 * 60 * 1000;
      });
      
      if (validStories.length !== stories.length) {
        setStories(validStories);
        localStorage.setItem(`stories_${username}`, JSON.stringify(validStories));
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [stories, username]);

  // Handle profile photo upload
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoDataUrl = reader.result;
        setProfilePhoto(photoDataUrl);
        
        // Save to localStorage
        const userData = JSON.parse(localStorage.getItem("user"));
        const updatedUser = { ...userData, profilePhoto: photoDataUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    }
  };

  // Post handling
  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (postText.trim() === "") return;

    const newPost = {
      id: Date.now(),
      username,
      text: postText,
      timestamp: new Date().toLocaleString(),
      likes: [],
      comments: []
    };

    const updatedPosts = [newPost, ...posts];
    updatePosts(updatedPosts);
    setPostText("");
    setCommentTexts(prev => ({ ...prev, [newPost.id]: "" }));
  };

  const handleLikePost = (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const isLiked = post.likes.includes(username);
        return {
          ...post,
          likes: isLiked
            ? post.likes.filter(user => user !== username)
            : [...post.likes, username]
        };
      }
      return post;
    });
    updatePosts(updatedPosts);
  };

  const handleDeletePost = (postId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this post?");
    if (shouldDelete) {
      const updatedPosts = posts.filter(post => post.id !== postId);
      updatePosts(updatedPosts);
    }
  };

  // Comment handling
  const handleCommentChange = (postId, text) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }));
  };

  const handleAddComment = (postId) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: Date.now(),
          username,
          text: commentText,
          timestamp: new Date().toLocaleString()
        };
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    
    updatePosts(updatedPosts);
    setCommentTexts(prev => ({ ...prev, [postId]: "" }));
  };

  const handleDeleteComment = (postId, commentId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(comment => comment.id !== commentId)
        };
      }
      return post;
    });
    updatePosts(updatedPosts);
  };

  // Story handling
  const handleStorySubmit = () => {
    if (!storyImage && storyCaption.trim() === "") return;

    const newStory = {
      id: Date.now(),
      username,
      image: storyImage,
      caption: storyCaption,
      timestamp: new Date().toISOString(),
    };

    const updatedStories = [newStory, ...stories];
    updateStories(updatedStories);
    setStoryImage(null);
    setStoryCaption("");
    setIsStoryModalOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoryClick = (story) => {
    setSelectedStory(story);
  };

  const handleCloseStoryViewer = () => {
    setSelectedStory(null);
  };

  const handleDeleteStory = (storyId, e) => {
    e.stopPropagation();
    const updatedStories = stories.filter(story => story.id !== storyId);
    updateStories(updatedStories);
  };

  // Avatar handling
  const handleSaveAvatarAsPost = (avatarData) => {
    const newPost = {
      id: Date.now(),
      username,
      text: avatarData.caption || "Check out my new AI avatar!",
      image: avatarData.avatar,
      timestamp: new Date().toLocaleString(),
      likes: [],
      comments: [],
      isAvatar: true
    };

    const updatedPosts = [newPost, ...posts];
    updatePosts(updatedPosts);
    
    // Add to avatar history
    const updatedAvatars = [avatarData, ...avatars];
    setAvatars(updatedAvatars);
    localStorage.setItem(`avatars_${username}`, JSON.stringify(updatedAvatars));
  };

  const handleSaveAvatarAsStory = (avatarData) => {
    const newStory = {
      id: Date.now(),
      username,
      image: avatarData.avatar,
      caption: avatarData.caption || "My new AI avatar!",
      timestamp: new Date().toISOString(),
      isAvatar: true
    };

    const updatedStories = [newStory, ...stories];
    updateStories(updatedStories);
  };

  // AI Storytelling Mode integration
  const handleSaveStoryAsPost = (storyData) => {
    const newPost = {
      id: Date.now(),
      username,
      text: storyData.caption,
      image: storyData.image,
      timestamp: new Date().toLocaleString(),
      likes: [],
      comments: [],
      isAiStory: true
    };

    const updatedPosts = [newPost, ...posts];
    updatePosts(updatedPosts);
  };

  const handleSaveStoryAsStory = (storyData) => {
    const newStory = {
      id: Date.now(),
      username,
      image: storyData.image,
      caption: storyData.caption,
      timestamp: new Date().toISOString(),
      isAiStory: true
    };

    const updatedStories = [newStory, ...stories];
    updateStories(updatedStories);
  };

  // Helper functions
  const updatePosts = (updatedPosts) => {
    setPosts(updatedPosts);
    localStorage.setItem(`posts_${username}`, JSON.stringify(updatedPosts));
  };

  const updateStories = (updatedStories) => {
    setStories(updatedStories);
    localStorage.setItem(`stories_${username}`, JSON.stringify(updatedStories));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleMenuItemClick = (item) => {
    const path = item === "Home" ? "/home" : `/${item.toLowerCase().replace(/\s+/g, '')}`;
    navigate(path);
  };

  const isActive = (menuItem) => {
    const path = location.pathname;
    if (menuItem === "Home") return path === "/home" || path === "/";
    return path.includes(menuItem.toLowerCase().replace(/\s+/g, ''));
  };

  // Menu items configuration
  const menuItems = [
    "Home",
    "Profile",
    "Friends",
    "Avatar Generation",
    "MoodAI",
    "Future Self Predictions",
    "AI Storytelling Mode",
    "AI Memory Vault"
  ];

  const getMenuItemIcon = (item) => {
    switch(item) {
      case "Home": return "home";
      case "Profile": return "user";
      case "Friends": return "users";
      case "Avatar Generation": return "robot";
      case "MoodAI": return "smile";
      case "Future Self Predictions": return "hourglass-half";
      case "AI Storytelling Mode": return "book-reader";
      case "AI Memory Vault": return "lock";
      default: return "circle";
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Time Capsule</h2>
        <div className="navbar-right">
          <div className="nav-profile">
            
            <span className="nav-username">{username}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Log Out
          </button>
        </div>
      </nav>
      
      <div className="main-content">
        <aside className="left-sidebar">
          <div className="user-greeting">
            <h2>Welcome, <span className="username">{username}</span>!</h2>
          </div>
          
          <div className="sidebar-menu">
            <h3>Menu</h3>
            <ul>
              {menuItems.map((item) => (
                <li
                  key={item}
                  className={isActive(item) ? "active" : ""}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <i className={`fas fa-${getMenuItemIcon(item)}`}></i>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="center-content">
          {location.pathname === "/home" || location.pathname === "/" ? (
            <>
              <div className="welcome-card">
                <div className="welcome-header">
                  <div className="profile-photo-upload">
                    <label htmlFor="profile-photo-input">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="welcome-avatar" />
                      ) : (
                        <div className="avatar-placeholder">
                          <i className="fas fa-user"></i>
                          <i className="fas fa-plus upload-indicator"></i>
                        </div>
                      )}
                    </label>
                    <input
                      id="profile-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div>
                    <h2>Welcome back, {username}!</h2>
                    <p>What would you like to share today?</p>
                  </div>
                </div>

                <div className="create-post">
                  <form onSubmit={handlePostSubmit}>
                    <textarea
                      placeholder={`What's on your mind, ${username}?`}
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows="3"
                    />
                    <div className="post-actions">
                      <button type="button" onClick={() => setIsStoryModalOpen(true)}>
                        <i className="fas fa-image"></i> Photo
                      </button>
                      <button type="submit" className="post-button">Post</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="stories-section">
                <div className="create-story-card" onClick={() => setIsStoryModalOpen(true)}>
                  <div className="add-story"><i className="fas fa-plus"></i></div>
                  <p>Create Story</p>
                </div>
                
                {stories.map((story) => (
                  <div 
                    key={story.id} 
                    className={`story-card ${story.isAvatar ? 'avatar-story' : ''} ${story.isAiStory ? 'ai-story' : ''}`} 
                    onClick={() => handleStoryClick(story)}
                  >
                    <div className="story-preview-container">
                      {story.image && <img src={story.image} alt="Story" className="story-preview-image" />}
                      <div className="story-overlay">
                        <p className="story-caption">{story.caption || "Your story"}</p>
                        <span className="story-time">
                          {new Date(story.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="delete-story-button"
                      onClick={(e) => handleDeleteStory(story.id, e)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="posts-container">
                {posts.map((post) => (
                  <div key={post.id} className={`post-card ${post.isAvatar ? 'avatar-post' : ''} ${post.isAiStory ? 'ai-story-post' : ''}`}>
                    <div className="post-header">
                      <div className="post-user-info">
                        <img 
                          src={post.isAvatar ? post.image : profilePhoto || "https://i.pravatar.cc/40"} 
                          alt="User" 
                          className={`post-avatar ${post.isAvatar ? 'avatar-post-image' : ''}`}
                        />
                        <div>
                          <strong>{post.username}</strong>
                          {post.isAvatar && (
                            <span className="post-badge">
                              <i className="fas fa-magic"></i> AI Avatar
                            </span>
                          )}
                          {post.isAiStory && (
                            <span className="post-badge">
                              <i className="fas fa-book-open"></i> AI Story
                            </span>
                          )}
                          <span className="post-time">{post.timestamp}</span>
                        </div>
                      </div>
                      {post.username === username && (
                        <button 
                          className="delete-post-button"
                          onClick={() => handleDeletePost(post.id)}
                          aria-label="Delete post"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="post-content">
                      {post.isAvatar && post.image && (
                        <img src={post.image} alt="AI Avatar" className="avatar-post-content-image" />
                      )}
                      {post.isAiStory && post.image && (
                        <img src={post.image} alt="AI Story" className="ai-story-post-image" />
                      )}
                      <p>{post.text}</p>
                    </div>
                    
                    <div className="post-stats">
                      {post.likes.length > 0 && (
                        <div className="like-count">
                          <i className="fas fa-heart"></i> {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                        </div>
                      )}
                      {post.comments.length > 0 && (
                        <div className="comment-count">
                          {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                        </div>
                      )}
                    </div>
                    
                    <div className="post-actions">
                      <button 
                        className={`action-button like-button ${post.likes.includes(username) ? 'liked' : ''}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <i className="fas fa-thumbs-up"></i> Like
                      </button>
                      {post.username === username && (
                        <button 
                          className="action-button delete-button"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      )}
                    </div>
                    
                    <div className="comments-section">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="comment">
                          <div className="comment-header">
                            <img 
                              src={profilePhoto || "https://i.pravatar.cc/30"} 
                              alt="User" 
                              className="comment-avatar" 
                            />
                            <div className="comment-user-info">
                              <strong>{comment.username}</strong>
                              <span className="comment-time">{comment.timestamp}</span>
                            </div>
                            {comment.username === username && (
                              <button 
                                className="delete-comment-button"
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                aria-label="Delete comment"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                          <div className="comment-text">
                            <p>{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentTexts[post.id] || ""}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <button 
                          className="post-comment-button"
                          onClick={() => handleAddComment(post.id)}
                          aria-label="Post comment"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : location.pathname.includes("/profile") ? (
            <Profile username={username} profilePhoto={profilePhoto} />
          ) : location.pathname.includes("/friends") ? (
            <Friends username={username} profilePhoto={profilePhoto} />
          ) : location.pathname.includes("/avatargeneration") ? (
            <AvatarGeneration 
              username={username}
              profilePhoto={profilePhoto}
              onSaveAsPost={handleSaveAvatarAsPost}
              onSaveAsStory={handleSaveAvatarAsStory}
            />
          ) : location.pathname.includes("/moodai") ? (
            <MoodAi username={username} profilePhoto={profilePhoto} />
          ) : location.pathname.includes("/futureselfpredictions") ? (
            <FutureSelfPredictions username={username} profilePhoto={profilePhoto} />
          ) : location.pathname.includes("/aistorytellingmode") ? (
            <AiStorytellingMode 
              username={username} 
              profilePhoto={profilePhoto} 
              onSaveAsPost={handleSaveStoryAsPost}
              onSaveAsStory={handleSaveStoryAsStory}
            />
          ) : location.pathname.includes("/aimemoryvault") ? (
            <AiMemoryVault username={username} profilePhoto={profilePhoto} />
          ) : null}
        </main>

        <aside className="right-sidebar">
          <div className="trending-card">
            <h3>Trending Now</h3>
            <div className="trending-item">
              <div className="trending-icon"><i className="fas fa-fire"></i></div>
              <div>
                <h4>Trends</h4>
                <p>What's Trending</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {isStoryModalOpen && (
        <div className="modal-overlay">
          <div className="story-modal">
            <div className="modal-header">
              <h3>Create Story</h3>
              <button onClick={() => setIsStoryModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {storyImage ? (
                <div className="story-preview">
                  <img src={storyImage} alt="Story preview" />
                </div>
              ) : (
                <div className="upload-area">
                  <label htmlFor="story-upload" className="upload-label">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Upload Image</span>
                    <input
                      id="story-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
              <textarea
                placeholder="Add a caption..."
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setIsStoryModalOpen(false)}>Cancel</button>
              <button 
                onClick={handleStorySubmit}
                disabled={!storyImage && storyCaption.trim() === ""}
              >
                Post Story
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStory && (
        <div className="modal-overlay" onClick={handleCloseStoryViewer}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <button onClick={handleCloseStoryViewer}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="story-viewer-content">
              {selectedStory.image && (
                <img src={selectedStory.image} alt="Story" className="story-viewer-image" />
              )}
              <div className="story-viewer-caption">
                <p>{selectedStory.caption}</p>
                <span className="story-viewer-time">
                  {new Date(selectedStory.timestamp).toLocaleString()}
                </span>
              </div>
              <button 
                className="delete-story-button"
                onClick={(e) => {
                  handleDeleteStory(selectedStory.id, e);
                  handleCloseStoryViewer();
                }}
              >
                <i className="fas fa-trash"></i> Delete Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;