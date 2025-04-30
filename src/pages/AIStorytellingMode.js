import React, { useState, useRef, useEffect } from 'react';
import './AIStorytellingMode.css';

const AIStorytellingMode = ({ username, profilePhoto, onSaveAsPost, onSaveAsStory }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [storyHistory, setStoryHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(`${username}_storyHistory`);
    if (saved) setStoryHistory(JSON.parse(saved));
  }, [username]);

  useEffect(() => {
    if (storyHistory.length)
      localStorage.setItem(`${username}_storyHistory`, JSON.stringify(storyHistory));
  }, [storyHistory, username]);

  const dataURLtoFile = (dataUrl, filename) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please upload a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setError(null);
      setStory(null);
    };
    reader.onerror = () => setError('Failed to read image');
    reader.readAsDataURL(file);
  };

  const generateStory = async () => {
    if (!imagePreview) return setError('Upload an image first');

    setIsLoading(true);
    setError(null);
    setStory(null);

    try {
      const file = dataURLtoFile(imagePreview, 'image.jpg');
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mood', 'neutral');

      const res = await fetch('http://localhost:5001/generate_story', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('API Error: ' + res.status);

      const data = await res.json();
      const generated = data.story;

      setStory(generated);
      setStoryHistory(prev => [
        { image: imagePreview, story: generated, timestamp: new Date().toISOString() },
        ...prev.slice(0, 4)
      ]);
    } catch (err) {
      setError(err.message || 'Failed to generate story');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleSaveAsPost = () => {
    if (!story || !imagePreview) return;
    onSaveAsPost({ image: imagePreview, caption: story, isAiStory: true });
    resetState();
  };

  const handleSaveAsStory = () => {
    if (!story || !imagePreview) return;
    onSaveAsStory({ image: imagePreview, caption: story, isAiStory: true });
    resetState();
  };

  const copyToClipboard = () => {
    if (!story) return;
    navigator.clipboard.writeText(story);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const resetState = () => {
    setImagePreview(null);
    setStory(null);
    setError(null);
  };

  const loadFromHistory = (item) => {
    setImagePreview(item.image);
    setStory(item.story);
  };

  return (
    <div className="storytelling-container">
      <div className="user-header">
        <img src={profilePhoto || `https://i.pravatar.cc/40?u=${username}`} alt={username} className="user-avatar" />
        <h1 className="storytelling-title">AI Storytelling Mode</h1>
      </div>
      <p className="storytelling-subtitle">Upload a photo and let AI craft its story</p>

      {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}

      <div className="storytelling-content">
        <div className="upload-section">
          <div className={`image-upload-box ${imagePreview ? 'has-image' : ''}`} onClick={triggerFileInput}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <>
                <div className="upload-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                <p>Click to upload image</p>
                <p className="file-requirements">JPEG, PNG up to 5MB</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg, image/png, image/gif"
              style={{ display: 'none' }}
            />
          </div>

          <div className="controls">
            <button
              onClick={generateStory}
              disabled={!imagePreview || isLoading}
              className={`generate-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Generate Story</>}
            </button>

            {imagePreview && !isLoading && (
              <button onClick={resetState} className="clear-button">
                <i className="fas fa-times"></i> Clear
              </button>
            )}
          </div>
        </div>

        {story && (
          <div className="story-output">
            <div className="output-header">
              <h3><i className="fas fa-book-open"></i> Your Generated Story</h3>
              <div className="word-count">{story.split(' ').length} words</div>
            </div>
            <div className="story-text">{story}</div>
            <div className="story-actions">
              <button className="share-button post-button" onClick={handleSaveAsPost}>
                <i className="fas fa-share-square"></i> Share as Post
              </button>
              <button className="share-button story-button" onClick={handleSaveAsStory}>
                <i className="fas fa-history"></i> Share as Story
              </button>
              <button className={`copy-button ${isCopied ? 'copied' : ''}`} onClick={copyToClipboard}>
                <i className={`fas ${isCopied ? 'fa-check' : 'fa-copy'}`}></i> {isCopied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
        )}

        {storyHistory.length > 0 && (
          <div className="story-history">
            <h4><i className="fas fa-clock"></i> Recent Stories</h4>
            <div className="history-grid">
              {storyHistory.map((item, index) => (
                <div key={index} className="history-item" onClick={() => loadFromHistory(item)}>
                  <img src={item.image} alt="History" />
                  <div className="history-overlay"><i className="fas fa-eye"></i></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStorytellingMode;
