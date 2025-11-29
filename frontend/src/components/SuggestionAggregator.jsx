import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '../i18n/i18n.jsx';
import './SuggestionAggregator.css';

function SuggestionAggregator({ suggestions, onAccept, onMerge }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showMerged, setShowMerged] = useState(false);
  const [mergedPrompt, setMergedPrompt] = useState('');
  const [userPreference, setUserPreference] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const { t } = useI18n();

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="suggestion-aggregator">
        <p className="no-suggestions">{t('suggestions.none')}</p>
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
      alert(t('suggestions.mergeFail'));
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
        <h3>{t('suggestions.header', { count: suggestions.length })}</h3>
        <div className="merge-controls">
          <button
            className="merge-btn"
            onClick={handleMerge}
            disabled={isMerging || showMerged}
          >
            {isMerging
              ? t('suggestions.merging')
              : showMerged
                ? t('suggestions.merged')
                : t('suggestions.merge')}
          </button>
        </div>
      </div>

      {!showMerged && suggestions.length > 1 && (
        <div className="user-preference">
          <input
            type="text"
            placeholder={t('suggestions.preferencePlaceholder')}
            value={userPreference}
            onChange={(e) => setUserPreference(e.target.value)}
            className="preference-input"
          />
        </div>
      )}

      {showMerged ? (
        <div className="merged-suggestion">
          <div className="merged-header">
            <h4>{t('suggestions.mergedTitle')}</h4>
            <button className="back-btn" onClick={() => setShowMerged(false)}>
              {t('suggestions.viewIndividuals')}
            </button>
          </div>
          <div className="merged-content">
            <pre className="merged-prompt">{mergedPrompt}</pre>
          </div>
          <div className="merged-actions">
            <button className="accept-btn primary" onClick={handleAcceptMerged}>
              {t('suggestions.useMerged')}
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
                    {t('suggestions.useSingle')}
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
