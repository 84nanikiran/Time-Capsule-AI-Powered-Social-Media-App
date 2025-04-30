import React, { useState, useEffect } from 'react';
import names from '../data/names.json';
import './Friends.css';

const Friends = ({ username }) => {
  // Initialize empty friends list
  const [friends, setFriends] = useState([]);
  
  // Initialize empty banned names list 
  const [bannedNames, setBannedNames] = useState([]);
  
  // Current suggestions
  const [currentBatch, setCurrentBatch] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);

  // Load data only once when component mounts
  useEffect(() => {
    const savedFriends = localStorage.getItem(`${username}_friends`);
    const savedBanned = localStorage.getItem(`${username}_bannedNames`);
    
    if (savedFriends) setFriends(JSON.parse(savedFriends));
    if (savedBanned) setBannedNames(JSON.parse(savedBanned));
    
    // Generate first batch
    generateNewBatch();
  }, [username]);

  // Timer for next batch
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const generateNewBatch = () => {
    const availableNames = names.filter(name => !bannedNames.includes(name));
    const batchSize = Math.min(10 + Math.floor(Math.random() * 6), availableNames.length);
    
    const newBatch = [];
    const availableCopy = [...availableNames];
    
    for (let i = 0; i < batchSize && availableCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableCopy.length);
      newBatch.push(availableCopy[randomIndex]);
      availableCopy.splice(randomIndex, 1);
    }

    setCurrentBatch(newBatch);
    setTimeLeft(600);
  };

  const handleAddFriend = (name) => {
    const newFriends = [...friends, name];
    const newBanned = [...bannedNames, name];
    
    setFriends(newFriends);
    setBannedNames(newBanned);
    
    localStorage.setItem(`${username}_friends`, JSON.stringify(newFriends));
    localStorage.setItem(`${username}_bannedNames`, JSON.stringify(newBanned));
    
    setCurrentBatch(prev => prev.filter(n => n !== name));
  };

  const handleRemoveFriend = (name) => {
    const newFriends = friends.filter(f => f !== name);
    setFriends(newFriends);
    localStorage.setItem(`${username}_friends`, JSON.stringify(newFriends));
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Friends</h2>
        <div className="batch-timer">
          Next batch in: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2, '0')}
        </div>
      </div>

      <div className="friends-columns">
        <div className="friends-list">
          <h3>Your Friends ({friends.length})</h3>
          {friends.length > 0 ? (
            <ul>
              {friends.map((name, i) => (
                <li key={i}>
                  <div className="friend-info">
                    <img src={`https://i.pravatar.cc/30?u=${name}`} alt={name} />
                    <span>{name}</span>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFriend(name)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No friends added yet</p>
          )}
        </div>

        <div className="suggestions-list">
          <h3>Suggestions ({currentBatch.length})</h3>
          {currentBatch.length > 0 ? (
            <ul>
              {currentBatch.map((name, i) => (
                <li key={i}>
                  <div className="friend-info">
                    <img src={`https://i.pravatar.cc/30?u=${name}`} alt={name} />
                    <span>{name}</span>
                  </div>
                  <button
                    className="add-btn"
                    onClick={() => handleAddFriend(name)}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No suggestions available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;