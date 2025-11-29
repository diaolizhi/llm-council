import React, { useState } from 'react';
import PromptEditor from './PromptEditor';
import TestResults from './TestResults';
import SuggestionAggregator from './SuggestionAggregator';
import { useI18n } from '../i18n/i18n.jsx';
import './IterationView.css';

function IterationView({ session, activeVersion, onAction, onRestoreVersion }) {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [isResettingDependentData, setIsResettingDependentData] = useState(false);
  const [initMode, setInitMode] = useState('generate'); // 'generate' or 'provide'
  const [objective, setObjective] = useState('');
  const [testInput, setTestInput] = useState('');
  const [showTestInput, setShowTestInput] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualRationale, setManualRationale] = useState('');
  const { t } = useI18n();

  const sortedIterations = (session?.iterations || []).slice().sort((a, b) => b.version - a.version);
  const activeIteration =
    sortedIterations.find((iter) => iter.version === activeVersion) ||
    sortedIterations[sortedIterations.length - 1];
  const hasIterations = session?.iterations?.length > 0;
  const promptTitle = session?.prompt_title || session?.title;
  const stage = activeIteration?.stage || session?.stage;
  const isHidingDependentData = isResettingDependentData || isTesting;
  const visibleTestResults = isHidingDependentData ? [] : (activeIteration?.test_results || []);
  const visibleSuggestions = isHidingDependentData ? [] : (activeIteration?.suggestions || []);

  const stageLabels = {
    init: t('iteration.stage.init'),
    prompt_ready: t('iteration.stage.promptReady'),
    title_ready: t('iteration.stage.titleReady'),
    tested: t('iteration.stage.tested')
  };
  const stageLabel = stage ? (stageLabels[stage] || stage) : null;

  const handleVersionChange = (e) => {
    const version = Number(e.target.value);
    if (!version || version === activeIteration?.version) return;
    if (onRestoreVersion) {
      onRestoreVersion(session.id, version);
    }
  };

  const openManualModal = () => {
    if (!activeIteration) return;
    setManualPrompt(activeIteration.prompt || '');
    setManualRationale(t('iteration.rationale.default'));
    setShowManualModal(true);
  };

  const closeManualModal = () => {
    if (isSavingManual) return;
    setShowManualModal(false);
  };

  const handleManualVersionCreate = async () => {
    if (!activeIteration || !manualPrompt.trim() || !manualRationale.trim()) return;
    setIsSavingManual(true);
    try {
      await onAction('iterate', {
        prompt: manualPrompt,
        change_rationale: manualRationale,
        user_decision: 'manual',
      });
      setShowManualModal(false);
    } catch (error) {
      console.error('Error creating manual version:', error);
      alert(t('iteration.alert.iterateFail'));
    } finally {
      setIsSavingManual(false);
    }
  };

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
    setIsResettingDependentData(true);
    try {
      await onAction('test', { test_input: testInput || null });
      setShowTestInput(false);
    } catch (error) {
      console.error('Error testing:', error);
      alert(t('iteration.alert.testFail'));
    } finally {
      setIsTesting(false);
      setIsResettingDependentData(false);
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
    setManualPrompt(improvedPrompt || '');
    setManualRationale(t('iteration.rationale.default'));
    setShowManualModal(true);
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
        {sortedIterations.length > 0 && (
          <div className="iteration-header-actions">
            <div className="version-switcher">
              <select
                id="version-select"
                value={activeIteration?.version || ''}
                onChange={handleVersionChange}
                className="version-select"
              >
                {sortedIterations.map((iter) => (
                  <option key={iter.version} value={iter.version}>
                    v{iter.version} · {stageLabels[iter.stage] || iter.stage}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="manual-version-btn"
              onClick={openManualModal}
            >
              {t('iteration.manual.create')}
            </button>
          </div>
        )}
        <div className="iteration-meta">
          {activeIteration.change_rationale && <span>{activeIteration.change_rationale}</span>}
        </div>
      </div>

      <PromptEditor
        prompt={activeIteration.prompt}
        version={activeIteration.version}
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

      {visibleTestResults && visibleTestResults.length > 0 && (
        <>
          <TestResults
            testResults={visibleTestResults}
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

      {visibleSuggestions && visibleSuggestions.length > 0 && (
        <SuggestionAggregator
          suggestions={visibleSuggestions}
          onAccept={handleAcceptSuggestion}
          onMerge={handleMergeSuggestions}
        />
      )}

      {showManualModal && (
        <div className="manual-modal-backdrop" onClick={closeManualModal}>
          <div className="manual-modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('iteration.manual.title')}</h4>
            <label className="manual-label">{t('iteration.manual.newPrompt')}</label>
            <textarea
              className="manual-textarea"
              rows={8}
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
            />
            <label className="manual-label">{t('iteration.manual.rationale')}</label>
            <textarea
              className="manual-textarea"
              rows={3}
              value={manualRationale}
              onChange={(e) => setManualRationale(e.target.value)}
            />
            <div className="manual-modal-actions">
              <button className="cancel-btn" onClick={closeManualModal} disabled={isSavingManual}>
                {t('iteration.manual.cancel')}
              </button>
              <button
                className="action-btn"
                onClick={handleManualVersionCreate}
                disabled={isSavingManual || !manualPrompt.trim() || !manualRationale.trim()}
              >
                {isSavingManual ? t('common.loading') : t('iteration.manual.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IterationView;
