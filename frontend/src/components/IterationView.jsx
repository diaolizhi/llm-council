import React, { useState } from 'react';
import PromptEditor from './PromptEditor';
import TestResults from './TestResults';
import SuggestionAggregator from './SuggestionAggregator';
import { useI18n } from '../i18n/i18n.jsx';
import './IterationView.css';

function IterationView({ session, onAction }) {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [initMode, setInitMode] = useState('generate'); // 'generate' or 'provide'
  const [objective, setObjective] = useState('');
  const [testInput, setTestInput] = useState('');
  const [showTestInput, setShowTestInput] = useState(false);
  const { t } = useI18n();

  const latestIteration = session?.iterations?.[session.iterations.length - 1];
  const hasIterations = session?.iterations?.length > 0;
  const promptTitle = session?.prompt_title || session?.title;
  const stage = session?.stage;

  const stageLabels = {
    init: t('iteration.stage.init'),
    prompt_ready: t('iteration.stage.promptReady'),
    title_ready: t('iteration.stage.titleReady'),
    tested: t('iteration.stage.tested')
  };
  const stageLabel = stage ? (stageLabels[stage] || stage) : null;

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await onAction('initialize', {
        mode: initMode,
        objective: initMode === 'generate' ? objective : null,
        prompt: initMode === 'provide' ? currentPrompt : null
      });
    } catch (error) {
      console.error('Error initializing:', error);
      alert(t('iteration.alert.initFail'));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleTestClick = () => {
    setShowTestInput(true);
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onAction('test', { test_input: testInput || null });
      setShowTestInput(false);
    } catch (error) {
      console.error('Error testing:', error);
      alert(t('iteration.alert.testFail'));
    } finally {
      setIsTesting(false);
    }
  };

  const handleFeedbackChange = async (model, feedback) => {
    try {
      await onAction('feedback', { model, ...feedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      await onAction('suggest', {});
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert(t('iteration.alert.suggestFail'));
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleMergeSuggestions = async (userPreference) => {
    try {
      const result = await onAction('merge', { userPreference });
      return result.improved_prompt;
    } catch (error) {
      console.error('Error merging suggestions:', error);
      throw error;
    }
  };

  const handleAcceptSuggestion = async (improvedPrompt) => {
    const rationale = prompt(
      t('iteration.rationale.prompt'),
      t('iteration.rationale.default')
    );
    if (rationale) {
      try {
        await onAction('iterate', {
          prompt: improvedPrompt,
          change_rationale: rationale,
          user_decision: 'accepted'
        });
      } catch (error) {
        console.error('Error creating iteration:', error);
        alert(t('iteration.alert.iterateFail'));
      }
    }
  };

  // Initialization view (no iterations yet)
  if (!hasIterations) {
    return (
      <div className="iteration-view">
        <div className="init-container">
          <h2>{t('iteration.init.title')}</h2>

          <div className="init-mode-selector">
            <button
              className={`mode-btn ${initMode === 'generate' ? 'active' : ''}`}
              onClick={() => setInitMode('generate')}
            >
              {t('iteration.init.generateMode')}
            </button>
            <button
              className={`mode-btn ${initMode === 'provide' ? 'active' : ''}`}
              onClick={() => setInitMode('provide')}
            >
              {t('iteration.init.provideMode')}
            </button>
          </div>

          {initMode === 'generate' ? (
            <div className="init-form">
              <label>{t('iteration.init.describeLabel')}</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder={t('iteration.init.objectivePlaceholder')}
                rows={5}
                className="objective-input"
              />
            </div>
          ) : (
            <div className="init-form">
              <label>{t('iteration.init.provideLabel')}</label>
              <PromptEditor
                prompt={currentPrompt}
                onChange={setCurrentPrompt}
              />
            </div>
          )}

          <button
            className="init-btn"
            onClick={handleInitialize}
            disabled={isInitializing || (initMode === 'generate' && !objective.trim()) || (initMode === 'provide' && !currentPrompt.trim())}
          >
            {isInitializing ? t('iteration.init.initializing') : t('iteration.init.initButton')}
          </button>
        </div>
      </div>
    );
  }

  // Main iteration view
  return (
    <div className="iteration-view">
      <div className="iteration-header">
        <h2>{promptTitle || t('promptEditor.title')}</h2>
        <div className="iteration-meta">
          <span>{t('iteration.header.version', { version: latestIteration.version })}</span>
          {stageLabel && <span className="stage-tag">{stageLabel}</span>}
          {latestIteration.change_rationale && <span>{latestIteration.change_rationale}</span>}
        </div>
      </div>

      <PromptEditor
        prompt={latestIteration.prompt}
        version={latestIteration.version}
        readOnly={true}
      />

      <div className="action-section">
        <h3>{t('iteration.test.stepTitle')}</h3>
        <p>{t('iteration.test.stepDescription')}</p>

        {!showTestInput ? (
          <button
            className="action-btn test-btn"
            onClick={handleTestClick}
            disabled={isTesting}
          >
            {t('iteration.test.button')}
          </button>
        ) : (
          <div className="test-input-container">
            <label>{t('iteration.test.testInputLabel')}</label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder={t('iteration.test.placeholder')}
              rows={4}
              className="test-input-textarea"
            />
            <div className="test-input-actions">
              <button
                className="action-btn test-btn"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? t('iteration.test.testing') : t('iteration.test.run')}
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={() => setShowTestInput(false)}
                disabled={isTesting}
              >
                {t('iteration.test.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {latestIteration.test_results && latestIteration.test_results.length > 0 && (
        <>
          <TestResults
            testResults={latestIteration.test_results}
            onFeedbackChange={handleFeedbackChange}
          />

          <div className="action-section">
            <h3>{t('iteration.suggestions.stepTitle')}</h3>
            <p>{t('iteration.suggestions.stepDescription')}</p>
            <button
              className="action-btn suggest-btn"
              onClick={handleGenerateSuggestions}
              disabled={isGeneratingSuggestions}
            >
              {isGeneratingSuggestions ? t('iteration.suggestions.generating') : t('iteration.suggestions.button')}
            </button>
          </div>
        </>
      )}

      {latestIteration.suggestions && latestIteration.suggestions.length > 0 && (
        <SuggestionAggregator
          suggestions={latestIteration.suggestions}
          onAccept={handleAcceptSuggestion}
          onMerge={handleMergeSuggestions}
        />
      )}
    </div>
  );
}

export default IterationView;
