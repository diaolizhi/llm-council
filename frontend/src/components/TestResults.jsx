import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import OutputRating from './OutputRating';
import { useI18n } from '../i18n/i18n.jsx';
import './TestResults.css';

function TestResults({ testResults, onFeedbackChange }) {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useI18n();

  if (!testResults || testResults.length === 0) {
    return (
      <div className="test-results">
        <p className="no-results">{t('testResults.none')}</p>
      </div>
    );
  }

  const handleRatingChange = (model, rating) => {
    if (onFeedbackChange) {
      onFeedbackChange(model, { rating });
    }
  };

  const handleFeedbackTextChange = (model, feedback) => {
    if (onFeedbackChange) {
      onFeedbackChange(model, { feedback });
    }
  };

  return (
    <div className="test-results">
      <div className="results-header">
        <h3>{t('testResults.header', { count: testResults.length })}</h3>
      </div>

      <div className="results-tabs">
        {testResults.map((result, index) => (
          <button
            key={result.model}
            className={`tab ${activeTab === index ? 'active' : ''} ${result.error ? 'error' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {result.model.split('/').pop().split(':')[0]}
            {result.rating && <span className="tab-rating">★{result.rating}</span>}
          </button>
        ))}
      </div>

      <div className="results-content">
        {testResults.map((result, index) => (
          <div
            key={result.model}
            className={`result-panel ${activeTab === index ? 'active' : ''}`}
          >
            <div className="result-header">
              <h4>{result.model}</h4>
              {result.response_time > 0 && (
                <span className="response-time">{result.response_time.toFixed(2)}s</span>
              )}
            </div>

            {result.error ? (
              <div className="error-message">
                <p>{result.output}</p>
              </div>
            ) : (
              <>
                <div className="markdown-content output-text">
                  <ReactMarkdown>{result.output}</ReactMarkdown>
                </div>

                <OutputRating
                  rating={result.rating}
                  feedback={result.feedback}
                  onRatingChange={(rating) => handleRatingChange(result.model, rating)}
                  onFeedbackChange={(feedback) => handleFeedbackTextChange(result.model, feedback)}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestResults;
