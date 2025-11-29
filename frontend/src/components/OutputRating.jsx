import React, { useState } from 'react';
import { useI18n } from '../i18n/i18n.jsx';
import './OutputRating.css';

function OutputRating({ rating, feedback, onRatingChange, onFeedbackChange }) {
  const [expanded, setExpanded] = useState(false);
  const [currentRating, setCurrentRating] = useState(rating || 0);
  const [currentFeedback, setCurrentFeedback] = useState(feedback || '');
  const { t } = useI18n();

  const handleRatingClick = (value) => {
    setCurrentRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleFeedbackChange = (e) => {
    const newFeedback = e.target.value;
    setCurrentFeedback(newFeedback);
  };

  const handleFeedbackBlur = () => {
    if (onFeedbackChange) {
      onFeedbackChange(currentFeedback);
    }
  };

  const quickFeedbackOptions = [
    t('outputRating.quick.tooVerbose'),
    t('outputRating.quick.lacksExamples'),
    t('outputRating.quick.unclearInstructions'),
    t('outputRating.quick.goodStructure'),
    t('outputRating.quick.needsMoreDetail')
  ];

  const handleQuickFeedback = (option) => {
    const newFeedback = currentFeedback ? `${currentFeedback}; ${option}` : option;
    setCurrentFeedback(newFeedback);
    if (onFeedbackChange) {
      onFeedbackChange(newFeedback);
    }
  };

  return (
    <div className="output-rating">
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= currentRating ? 'filled' : ''}`}
            onClick={() => handleRatingClick(star)}
          >
            ★
          </span>
        ))}
        {currentRating > 0 && (
          <span className="rating-label">{t('outputRating.ratingLabel', { rating: currentRating })}</span>
        )}
      </div>

      <button
        className="feedback-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? t('outputRating.hideFeedback') : t('outputRating.showFeedback')}
      </button>

      {expanded && (
        <div className="feedback-section">
          <div className="quick-feedback">
            {quickFeedbackOptions.map((option) => (
              <button
                key={option}
                className="quick-feedback-btn"
                onClick={() => handleQuickFeedback(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <textarea
            className="feedback-textarea"
            value={currentFeedback}
            onChange={handleFeedbackChange}
            onBlur={handleFeedbackBlur}
            placeholder={t('outputRating.placeholder')}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

export default OutputRating;
