import React, { useState, useEffect } from 'react';
import './MoodAI.css';

const MoodAI = ({ username }) => {
  const [userInput, setUserInput] = useState('');
  const [moodPrediction, setMoodPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [probabilities, setProbabilities] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize localStorage data
  useEffect(() => {
    if (!localStorage.getItem(`${username}_moods`)) {
      localStorage.setItem(`${username}_moods`, JSON.stringify([]));
    }
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5004/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: userInput }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }
      
      const data = await response.json();
      
      setMoodPrediction(data.emotion);
      setConfidence(data.confidence);
      setProbabilities(data.probabilities);
      
      // Save to history
      try {
        const storedData = localStorage.getItem(`${username}_moods`);
        const existingMoods = storedData ? JSON.parse(storedData) : [];
        
        const moodEntry = {
          text: userInput,
          mood: data.emotion,
          confidence: data.confidence,
          timestamp: new Date().toLocaleString()
        };
        
        localStorage.setItem(
          `${username}_moods`, 
          JSON.stringify([moodEntry, ...existingMoods])
        );
      } catch (error) {
        console.error("Failed to save mood history:", error);
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Failed to analyze mood. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="moodai-container">
      <h2>MoodAI</h2>
      <p className="moodai-description">Share how you're feeling and I'll predict your mood</p>
      
      <form onSubmit={handleSubmit} className="moodai-form">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`How are you feeling today, ${username}?`}
          rows="4"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Predict My Mood'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {moodPrediction && (
        <div className="mood-result">
          <h3>Your Mood:</h3>
          <div className="mood-prediction">
            {moodPrediction} ({(confidence * 100).toFixed(1)}% confidence)
          </div>
          
          <div className="probabilities">
            <h4>Emotion Breakdown:</h4>
            <ul>
              {probabilities && Object.entries(probabilities).map(([emotion, prob]) => (
                <li key={emotion}>
                  <span className="emotion-name">{emotion}:</span>
                  <span className="emotion-prob">{(prob * 100).toFixed(1)}%</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${prob * 100}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="mood-history">
        <h3>Your Mood History</h3>
        <MoodHistory username={username} />
      </div>
    </div>
  );
};

const MoodHistory = ({ username }) => {
  const [moods, setMoods] = useState([]);
  const [error, setError] = useState(null);

  // Helper function to extract base emotion from mood string
  const getBaseEmotion = (moodStr) => {
    return moodStr.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
  };

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(`${username}_moods`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          setMoods(parsedData);
        } else {
          setMoods([]);
          localStorage.setItem(`${username}_moods`, JSON.stringify([]));
        }
      }
    } catch (err) {
      console.error("Error loading mood history:", err);
      setError("Failed to load mood history");
      setMoods([]);
      localStorage.setItem(`${username}_moods`, JSON.stringify([]));
    }
  }, [username]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="history-container">
      {moods.length > 0 ? (
        <ul>
          {moods.map((mood, index) => {
            const baseEmotion = getBaseEmotion(mood.mood);
            return (
              <li key={index}>
                <div className="mood-entry">
                  <span 
                    className="mood" 
                    data-emotion={baseEmotion}
                  >
                    {mood.mood} ({(mood.confidence * 100).toFixed(1)}%)
                  </span>
                  <span className="text">{mood.text}</span>
                  <span className="time">{mood.timestamp}</span>
                  {mood.probabilities && (
                    <div className="mini-probabilities">
                      {Object.entries(mood.probabilities)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([emotion, prob]) => (
                          <span 
                            key={emotion} 
                            className="mini-prob"
                            data-emotion={emotion.toLowerCase()}
                          >
                            {emotion}: {(prob * 100).toFixed(0)}%
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No mood history yet</p>
      )}
    </div>
  );
};

export default MoodAI;