/* global cv */


import React, { useState, useRef, useEffect } from 'react';
import './AvatarGeneration.css';

const AvatarGeneration = ({ username, onSaveAsPost, onSaveAsStory }) => {
  const [originalImage, setOriginalImage] = useState(null);
  const [generatedAvatar, setGeneratedAvatar] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [caption, setCaption] = useState('');
  const [style, setStyle] = useState('cartoon');
  const [error, setError] = useState(null);
  const [cvReady, setCvReady] = useState(false);
  const fileInputRef = useRef(null);

  // Load OpenCV.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;
    script.onload = () => {
      window.Module = {
        onRuntimeInitialized: () => {
          setCvReady(true);
        }
      };
    };
    script.onerror = () => {
      setError("Failed to load OpenCV.js");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const applyCartoonEffect = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageData;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (style === 'cartoon' && window.cv) {
          try {
            // Convert image to OpenCV format
            ctx.drawImage(img, 0, 0);
            const src = cv.imread(canvas);
            const dst = new cv.Mat();
            const color = new cv.Mat();
            const gray = new cv.Mat();
            const edges = new cv.Mat();
            
            // Step 1: Bilateral Filter (smoothing while preserving edges)
            cv.bilateralFilter(src, color, 9, 150, 150);
            
            // Step 2: Edge detection
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.medianBlur(gray, gray, 7);
            cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_MEAN_C, 
                               cv.THRESH_BINARY, 9, 2);
            cv.cvtColor(edges, edges, cv.COLOR_GRAY2RGBA);
            
            // Step 3: Combine color and edges
            cv.bitwise_and(color, edges, dst);
            
            // Convert back to canvas
            cv.imshow(canvas, dst);
            
            // Clean up
            src.delete();
            dst.delete();
            color.delete();
            gray.delete();
            edges.delete();
          } catch (err) {
            console.error("OpenCV error:", err);
            // Fallback to canvas effects if OpenCV fails
            applyCanvasEffects(ctx, img);
          }
        } else {
          // Use canvas effects for other styles
          applyCanvasEffects(ctx, img);
        }

        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const applyCanvasEffects = (ctx, img) => {
    switch(style) {
      case 'watercolor':
        ctx.drawImage(img, 0, 0);
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.2;
          ctx.filter = 'blur(6px)';
          ctx.drawImage(ctx.canvas, 0, 0);
        }
        break;
        
      case 'pixel':
        const pixelSize = Math.max(4, Math.floor(ctx.canvas.width / 40));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, ctx.canvas.width/pixelSize, ctx.canvas.height/pixelSize);
        ctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width/pixelSize, ctx.canvas.height/pixelSize, 
                      0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
        
      case 'abstract':
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = getRandomColor();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
        
      case 'line-art':
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'grayscale(100%) contrast(200%)';
        ctx.globalCompositeOperation = 'color-dodge';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
        
      default:
        ctx.drawImage(img, 0, 0);
    }
  };

  const getRandomColor = () => {
    const colors = ['#ff3366', '#33ff66', '#3366ff', '#ff33cc', '#33ccff'];
    return colors[Math.floor(Math.random() * colors.length)] + '60';
  };

  const generateAvatar = async () => {
    if (!originalImage || !cvReady) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const avatarUrl = await applyCartoonEffect(originalImage);
      
      setGeneratedAvatar({
        original: originalImage,
        avatar: avatarUrl,
        style,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Avatar generation failed:", err);
      setError("Failed to generate avatar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Keep all your existing handler functions
  const handleSaveAsPost = () => {
    if (!generatedAvatar) return;
    onSaveAsPost({
      ...generatedAvatar,
      caption: caption.trim() || "Check out my new AI avatar!"
    });
    resetGenerator();
  };

  const handleSaveAsStory = () => {
    if (!generatedAvatar) return;
    onSaveAsStory({
      ...generatedAvatar,
      caption: caption.trim() || "My new AI avatar!"
    });
    resetGenerator();
  };

  const resetGenerator = () => {
    setGeneratedAvatar(null);
    setOriginalImage(null);
    setCaption('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Your exact same UI return
  return (
    <div className="avatar-generation-container">
      <div className="avatar-header">
        <h2>AI Avatar Generator</h2>
        <p>Upload your photo to create a custom cartoon avatar</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="avatar-creation-flow">
        {/* Step 1: Upload */}
        <div className={`creation-step ${!originalImage ? 'active' : ''}`}>
          <h3>1. Upload Your Photo</h3>
          <div 
            className="upload-area" 
            onClick={() => fileInputRef.current.click()}
            aria-label="Upload image"
          >
            {originalImage ? (
              <img src={originalImage} alt="Original" className="preview-image" />
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Click to upload an image</p>
                <p className="upload-hint">JPG or PNG, max 5MB</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg, image/png"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Step 2: Style Selection */}
        <div className={`creation-step ${originalImage && !generatedAvatar ? 'active' : ''}`}>
          <h3>2. Choose Style</h3>
          <div className="style-options">
            {[
              { value: 'cartoon', label: 'Cartoon', icon: 'fas fa-user-astronaut' },
              { value: 'watercolor', label: 'Watercolor', icon: 'fas fa-paint-brush' },
              { value: 'pixel', label: 'Pixel Art', icon: 'fas fa-gamepad' },
              { value: 'abstract', label: 'Abstract', icon: 'fas fa-shapes' },
              { value: 'line-art', label: 'Line Art', icon: 'fas fa-pen-nib' }
            ].map((option) => (
              <div
                key={option.value}
                className={`style-option ${style === option.value ? 'selected' : ''}`}
                onClick={() => setStyle(option.value)}
                aria-label={`Select ${option.label} style`}
              >
                <i className={option.icon}></i>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
          <button 
            className="generate-button"
            onClick={generateAvatar}
            disabled={!originalImage || isGenerating || !cvReady}
            aria-busy={isGenerating}
          >
            {!cvReady ? (
              'Loading OpenCV...'
            ) : isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              'Generate Avatar'
            )}
          </button>
        </div>

        {/* Step 3: Results */}
        {generatedAvatar && (
          <div className="creation-step active">
            <h3>3. Your AI Avatar</h3>
            <div className="result-container">
              <div className="image-comparison">
                <div className="image-box">
                  <p>Original</p>
                  <img src={generatedAvatar.original} alt="Original" />
                </div>
                <div className="image-box">
                  <p>AI {style.replace('-', ' ')}</p>
                  <img src={generatedAvatar.avatar} alt="Generated Avatar" />
                </div>
              </div>
              
              <div className="caption-input">
                <label htmlFor="avatar-caption">Add a caption:</label>
                <input
                  id="avatar-caption"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your avatar..."
                  maxLength="100"
                />
              </div>

              <div className="save-options">
                <button 
                  className="save-post" 
                  onClick={handleSaveAsPost}
                  aria-label="Save as post"
                >
                  <i className="fas fa-share-square"></i> Post to Timeline
                </button>
                <button 
                  className="save-story" 
                  onClick={handleSaveAsStory}
                  aria-label="Save as story"
                >
                  <i className="fas fa-history"></i> Share as Story
                </button>
                <button 
                  className="save-new" 
                  onClick={resetGenerator}
                  aria-label="Create another avatar"
                >
                  <i className="fas fa-redo"></i> Create Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarGeneration;