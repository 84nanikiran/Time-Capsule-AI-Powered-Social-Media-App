import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './AIMemoryVault.css';

const AIMemoryVault = ({ username }) => {
  const [vaultPassword, setVaultPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'text', content: '' });
  const [vaultEntries, setVaultEntries] = useState([]);
  const [deletedEntries, setDeletedEntries] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const checkVaultExists = () => {
      const vault = localStorage.getItem(`vault_${username}`);
      setVaultExists(!!vault);
    };
    checkVaultExists();

    const loadedDeleted = JSON.parse(localStorage.getItem(`deleted_entries_${username}`)) || [];
    setDeletedEntries(loadedDeleted);
  }, [username]);

  useEffect(() => {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const stillPendingDeletion = deletedEntries.filter(entry => {
      const deletionDate = new Date(entry.deletionTime);
      return deletionDate > fourteenDaysAgo;
    });

    if (stillPendingDeletion.length !== deletedEntries.length) {
      setDeletedEntries(stillPendingDeletion);
      localStorage.setItem(`deleted_entries_${username}`, JSON.stringify(stillPendingDeletion));
    }
  }, [deletedEntries, username]);

  const createVault = () => {
    if (vaultPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (vaultPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const encryptedVault = CryptoJS.AES.encrypt(
      JSON.stringify([]),
      `${username}:${vaultPassword}`
    ).toString();

    localStorage.setItem(`vault_${username}`, encryptedVault);
    setVaultExists(true);
    setSuccess('Vault created successfully!');
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const unlockVault = () => {
    try {
      const encryptedVault = localStorage.getItem(`vault_${username}`);
      if (!encryptedVault) {
        setError('No vault found for this user');
        return;
      }

      const bytes = CryptoJS.AES.decrypt(
        encryptedVault,
        `${username}:${passwordInput}`
      );
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        setError('Incorrect password');
        return;
      }

      setVaultEntries(JSON.parse(decrypted));
      setVaultUnlocked(true);
      setError('');
    } catch (err) {
      setError('Failed to unlock vault');
      console.error(err);
    }
  };

  const addEntry = () => {
    if (!newEntry.content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    const updatedEntries = [...vaultEntries, {
      ...newEntry,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }];

    const encryptedVault = CryptoJS.AES.encrypt(
      JSON.stringify(updatedEntries),
      `${username}:${passwordInput}`
    ).toString();

    localStorage.setItem(`vault_${username}`, encryptedVault);
    setVaultEntries(updatedEntries);
    setNewEntry({ type: 'text', content: '' });
    setSuccess('Entry added to vault!');
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeEntry = (id) => {
    if (!window.confirm('Are you sure you want to delete this entry? It will be permanently removed after 14 days.')) {
      return;
    }

    const entryToDelete = vaultEntries.find(entry => entry.id === id);
    if (!entryToDelete) return;

    const updatedEntries = vaultEntries.filter(entry => entry.id !== id);
    const encryptedVault = CryptoJS.AES.encrypt(
      JSON.stringify(updatedEntries),
      `${username}:${passwordInput}`
    ).toString();

    const updatedDeleted = [...deletedEntries, {
      ...entryToDelete,
      deletionTime: new Date().toISOString()
    }];

    localStorage.setItem(`vault_${username}`, encryptedVault);
    localStorage.setItem(`deleted_entries_${username}`, JSON.stringify(updatedDeleted));
    
    setVaultEntries(updatedEntries);
    setDeletedEntries(updatedDeleted);
    setSuccess('Entry moved to trash. It will be permanently deleted in 14 days.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const restoreEntry = (id) => {
    const entryToRestore = deletedEntries.find(entry => entry.id === id);
    if (!entryToRestore) return;

    const updatedDeleted = deletedEntries.filter(entry => entry.id !== id);
    const updatedEntries = [...vaultEntries, entryToRestore];

    const encryptedVault = CryptoJS.AES.encrypt(
      JSON.stringify(updatedEntries),
      `${username}:${passwordInput}`
    ).toString();

    localStorage.setItem(`vault_${username}`, encryptedVault);
    localStorage.setItem(`deleted_entries_${username}`, JSON.stringify(updatedDeleted));
    
    setVaultEntries(updatedEntries);
    setDeletedEntries(updatedDeleted);
    setSuccess('Entry restored successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const deletePermanently = (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this entry? This action cannot be undone.')) {
      return;
    }

    const updatedDeleted = deletedEntries.filter(entry => entry.id !== id);
    localStorage.setItem(`deleted_entries_${username}`, JSON.stringify(updatedDeleted));
    setDeletedEntries(updatedDeleted);
    setSuccess('Entry permanently deleted.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const downloadEntry = (entry) => {
    try {
      if (entry.type === 'text') {
        const blob = new Blob([entry.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vault-entry-${new Date(entry.timestamp).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (entry.type === 'image') {
        const a = document.createElement('a');
        a.href = entry.content;
        a.download = entry.name || `vault-image-${new Date(entry.timestamp).toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setSuccess('Entry downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download entry');
      console.error(err);
    }
  };

  const exportVault = () => {
    try {
      const data = {
        username,
        entries: vaultEntries,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Vault exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export vault');
      console.error(err);
    }
  };

  const lockVault = () => {
    setVaultUnlocked(false);
    setPasswordInput('');
    setVaultEntries([]);
    setShowDeleted(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewEntry({
        type: 'image',
        content: reader.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const getDaysRemaining = (deletionTime) => {
    const deletionDate = new Date(deletionTime);
    const now = new Date();
    const diffTime = deletionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 14;
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="vault-container">
      <div className="vault-header">
        <h1>AI Memory Vault</h1>
        <p className="subtitle">Your secure, encrypted storage</p>
      </div>

      {success && <div className="alert success">{success}</div>}
      {error && <div className="alert error">{error}</div>}

      {!vaultExists ? (
        <div className="vault-setup card">
          <h2>Create Your Memory Vault</h2>
          <p>Set up a password to protect your memories and private information.</p>
          
          <div className="form-group">
            <label>Create Password</label>
            <input
              type="password"
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
          </div>
          
          <button onClick={createVault} className="create-button">
            Create Vault
          </button>
        </div>
      ) : !vaultUnlocked ? (
        <div className="vault-unlock card">
          <h2>Unlock Your Vault</h2>
          <p>Enter your password to access your secured memories.</p>
          
          <div className="form-group">
            <label>Vault Password</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your vault password"
              onKeyPress={(e) => e.key === 'Enter' && unlockVault()}
            />
          </div>
          
          <button onClick={unlockVault} className="unlock-button">
            Unlock Vault
          </button>
        </div>
      ) : (
        <div className="vault-content">
          <div className="vault-actions">
            <div className="vault-controls">
              <button onClick={lockVault} className="lock-button">
                Lock Vault
              </button>
              <button onClick={exportVault} className="export-button">
                Export Vault
              </button>
              <button 
                onClick={() => setShowDeleted(!showDeleted)} 
                className={`trash-button ${showDeleted ? 'active' : ''}`}
              >
                {showDeleted ? 'Hide Trash' : `Show Trash (${deletedEntries.length})`}
              </button>
            </div>
            <div className="vault-stats">
              <span>{vaultEntries.length} active items</span>
              {deletedEntries.length > 0 && (
                <span className="pending-deletion">
                  {deletedEntries.length} in trash
                </span>
              )}
            </div>
          </div>
          
          {!showDeleted ? (
            <>
              <div className="add-entry card">
                <h3>Add New Entry</h3>
                <div className="entry-type-selector">
                  <button
                    className={newEntry.type === 'text' ? 'active' : ''}
                    onClick={() => setNewEntry({ type: 'text', content: '' })}
                  >
                    Text
                  </button>
                  <button
                    className={newEntry.type === 'image' ? 'active' : ''}
                    onClick={() => setNewEntry({ type: 'image', content: '' })}
                  >
                    Image
                  </button>
                </div>
                
                {newEntry.type === 'text' ? (
                  <div className="form-group">
                    <textarea
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                      placeholder="Write your private note here..."
                      rows="4"
                    />
                  </div>
                ) : (
                  <div className="image-upload">
                    {newEntry.content ? (
                      <div className="image-preview">
                        <img src={newEntry.content} alt="Preview" />
                        <button onClick={() => setNewEntry({ type: 'image', content: '' })}>
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                        <span>Click to upload image</span>
                      </label>
                    )}
                  </div>
                )}
                
                <button
                  onClick={addEntry}
                  disabled={!newEntry.content}
                  className="add-button"
                >
                  Add to Vault
                </button>
              </div>
              
              <div className="entries-list">
                {vaultEntries.length === 0 ? (
                  <div className="empty-vault card">
                    <h4>Your vault is empty</h4>
                    <p>Add your first entry to get started</p>
                  </div>
                ) : (
                  vaultEntries.map((entry) => (
                    <div key={entry.id} className="entry-card card">
                      <div className="entry-header">
                        <span className="entry-date">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <div className="entry-actions">
                          <button
                            onClick={() => downloadEntry(entry)}
                            className="download-entry"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="delete-entry"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {entry.type === 'text' ? (
                        <div className="text-entry">
                          <p>{entry.content}</p>
                        </div>
                      ) : (
                        <div className="image-entry">
                          <img src={entry.content} alt={entry.name || 'Vault image'} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="deleted-entries">
              <div className="deleted-header card">
                <h3>Trash</h3>
                <p>Items in trash will be automatically deleted after 14 days</p>
                {deletedEntries.length > 0 && (
                  <div className="trash-info">
                    <span>You can restore items or delete them permanently now</span>
                  </div>
                )}
              </div>
              
              {deletedEntries.length === 0 ? (
                <div className="empty-trash card">
                  <h4>Your trash is empty</h4>
                  <p>Deleted items will appear here</p>
                </div>
              ) : (
                <div className="entries-list">
                  {deletedEntries.map((entry) => (
                    <div key={entry.id} className="entry-card card deleted">
                      <div className="entry-header">
                        <span className="entry-date">
                          {new Date(entry.timestamp).toLocaleString()}
                          <span className="days-remaining">
                            (Deletes in {getDaysRemaining(entry.deletionTime)} days)
                          </span>
                        </span>
                        <div className="entry-actions">
                          <button
                            onClick={() => restoreEntry(entry.id)}
                            className="restore-entry"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => deletePermanently(entry.id)}
                            className="delete-permanent"
                          >
                            Delete Now
                          </button>
                        </div>
                      </div>
                      
                      {entry.type === 'text' ? (
                        <div className="text-entry">
                          <p>{entry.content}</p>
                        </div>
                      ) : (
                        <div className="image-entry">
                          <img src={entry.content} alt={entry.name || 'Vault image'} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIMemoryVault;