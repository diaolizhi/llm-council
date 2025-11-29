import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './SuggestionAggregator.css';

function SuggestionAggregator({ suggestions, onAccept, onMerge }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showMerged, setShowMerged] = useState(false);
  const [mergedPrompt, setMergedPrompt] = useState('');
  const [userPreference, setUserPreference] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="suggestion-aggregator">
        <p className="no-suggestions">No suggestions yet. Generate suggestions first.</p>
      </div>
    );
  }

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const merged = await onMerge(userPreference);
      setMergedPrompt(merged);
      setShowMerged(true);
    } catch (error) {
      console.error('Error merging suggestions:', error);
      alert('Failed to merge suggestions. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleAcceptSuggestion = (suggestion) => {
    if (onAccept) {
      onAccept(suggestion);
    }
  };

  const handleAcceptMerged = () => {
    if (onAccept) {
      onAccept(mergedPrompt);
    }
  };

  return (
    <div className="suggestion-aggregator">
      <div className="suggestions-header">
        <h3>Improvement Suggestions ({suggestions.length} models)</h3>
        <div className="merge-controls">
          <button
            className="merge-btn"
            onClick={handleMerge}
            disabled={isMerging || showMerged}
          >
            {isMerging ? 'Merging...' : showMerged ? 'Merged ✓' : 'Merge All Suggestions'}
          </button>
        </div>
      </div>

      {!showMerged && suggestions.length > 1 && (
        <div className="user-preference">
          <input
            type="text"
            placeholder="Optional: What should we prioritize in the improvements?"
            value={userPreference}
            onChange={(e) => setUserPreference(e.target.value)}
            className="preference-input"
          />
        </div>
      )}

      {showMerged ? (
        <div className="merged-suggestion">
          <div className="merged-header">
            <h4>Merged Improved Prompt</h4>
            <button className="back-btn" onClick={() => setShowMerged(false)}>
              ← View Individual Suggestions
            </button>
          </div>
          <div className="merged-content">
            <pre className="merged-prompt">{mergedPrompt}</pre>
          </div>
          <div className="merged-actions">
            <button className="accept-btn primary" onClick={handleAcceptMerged}>
              Use This Improved Prompt
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="suggestions-tabs">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.model}
                className={`tab ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {suggestion.model.split('/').pop().split(':')[0]}
              </button>
            ))}
          </div>

          <div className="suggestions-content">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.model}
                className={`suggestion-panel ${activeTab === index ? 'active' : ''}`}
              >
                <div className="suggestion-header">
                  <h4>{suggestion.model}</h4>
                </div>

                <div className="markdown-content suggestion-text">
                  <ReactMarkdown>{suggestion.suggestion}</ReactMarkdown>
                </div>

                <div className="suggestion-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptSuggestion(suggestion.suggestion)}
                  >
                    Use This Suggestion
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SuggestionAggregator;
