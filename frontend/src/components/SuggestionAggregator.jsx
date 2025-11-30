import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '../i18n/i18n.jsx';
import './SuggestionAggregator.css';

function SuggestionAggregator({ suggestions, onAccept, onMerge, streaming = false }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showMerged, setShowMerged] = useState(false);
  const [mergedPrompt, setMergedPrompt] = useState('');
  const [userPreference, setUserPreference] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [isSavingAccepted, setIsSavingAccepted] = useState(false);
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
      alert(error.message || t('suggestions.mergeFail'));
    } finally {
      setIsMerging(false);
    }
  };

  const extractPrompt = (text) => {
    if (!text) return '';
    const match = text.match(/<prompt>([\s\S]*?)<\/prompt>/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return text.trim();
  };

  const extractAnalysis = (text) => {
    if (!text) return '';
    const match = text.match(/<analysis>([\s\S]*?)<\/analysis>/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return '';
  };

  const handleAcceptSuggestion = async (suggestion) => {
    if (!onAccept) return;
    setIsSavingAccepted(true);
    try {
      await onAccept(extractPrompt(suggestion));
    } finally {
      setIsSavingAccepted(false);
    }
  };

  const handleAcceptMerged = async () => {
    if (!onAccept) return;
    setIsSavingAccepted(true);
    try {
      await onAccept(extractPrompt(mergedPrompt));
    } finally {
      setIsSavingAccepted(false);
    }
  };

  return (
    <div className="suggestion-aggregator">
      <div className="suggestions-header">
        <h3>{t('suggestions.header', { count: suggestions.length })}</h3>
        {!streaming && (
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
        )}
      </div>

      {!streaming && !showMerged && suggestions.length > 1 && (
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
          <div className="suggestion-full-content">
            <div className="markdown-content">
              <ReactMarkdown>{mergedPrompt}</ReactMarkdown>
            </div>
          </div>
          <div className="merged-actions">
            <button className="accept-btn primary" onClick={handleAcceptMerged} disabled={isSavingAccepted}>
              {isSavingAccepted ? t('common.loading') : t('suggestions.useMerged')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="suggestions-tabs">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.model}
                className={`tab ${activeTab === index ? 'active' : ''} ${suggestion.streaming ? 'streaming' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {suggestion.model.split('/').pop().split(':')[0]}
                {suggestion.streaming && <span className="tab-streaming">●</span>}
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

                <div className="suggestion-full-content">
                  <div className={`markdown-content ${suggestion.streaming ? 'streaming-output' : ''}`}>
                    <ReactMarkdown>{suggestion.suggestion}</ReactMarkdown>
                    {suggestion.streaming && <span className="streaming-cursor">▌</span>}
                  </div>
                </div>

                {!streaming && (
                  <div className="suggestion-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptSuggestion(suggestion.suggestion)}
                    >
                      {t('suggestions.useSingle')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SuggestionAggregator;
