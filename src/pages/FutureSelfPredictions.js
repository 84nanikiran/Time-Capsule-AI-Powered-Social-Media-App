import React, { useState, useRef } from 'react';
import './FutureSelfPredictions.css';

const FutureSelfPredictions = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [years, setYears] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const predictFutureSelf = async () => {
    if (!imagePreview) {
      setError('Please upload an image first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('years', years);

      const response = await fetch('http://localhost:5002/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="future-self-container">
      <h1 className="future-self-title">Future Self Predictions</h1>
      <p className="future-self-subtitle">See how you might look in the future with AI</p>

      {error && <div className="error-message">{error}</div>}

      <div className="future-self-content">
        <div className="upload-section">
          <div 
            className={`image-upload-box ${imagePreview ? 'has-image' : ''}`}
            onClick={triggerFileInput}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <>
                <div className="upload-icon">+</div>
                <p>Upload your photo</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="controls">
            <div className="years-selector">
              <label>Years in the Future:</label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
              <span className="years-value">{years} years</span>
            </div>

            <button 
              onClick={predictFutureSelf}
              disabled={!imagePreview || isLoading}
              className="predict-button"
            >
              {isLoading ? 'Generating...' : 'See My Future Self'}
            </button>
          </div>
        </div>

        {resultImage && (
          <div className="result-section">
            <h3>Your Future Self in {years} Years</h3>
            <div className="comparison-container">
              <div className="image-comparison">
                <div className="image-box">
                  <p>Current You</p>
                  <img src={imagePreview} alt="Current" />
                </div>
                <div className="image-box">
                  <p>Future You</p>
                  <img src={resultImage} alt="Future" />
                </div>
              </div>
            </div>
            <div className="result-actions">
              <button 
                className="download-button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = `future-self-${years}-years.jpg`;
                  link.click();
                }}
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureSelfPredictions;