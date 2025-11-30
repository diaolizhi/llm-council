import React, { useEffect, useState } from 'react';
import PromptEditor from './PromptEditor';
import TestResults from './TestResults';
import SuggestionAggregator from './SuggestionAggregator';
import { api } from '../api';
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
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualRationale, setManualRationale] = useState('');
  const [testSamples, setTestSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [sampleTitle, setSampleTitle] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleNotes, setSampleNotes] = useState('');
  const [isSavingSample, setIsSavingSample] = useState(false);
  const [isDeletingSample, setIsDeletingSample] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [editingSampleId, setEditingSampleId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mainTab, setMainTab] = useState('prompt'); // 'prompt', 'test', 'suggestions'
  const [streamingTestResults, setStreamingTestResults] = useState(null);
  const [streamingSuggestions, setStreamingSuggestions] = useState(null);
  const { t } = useI18n();

  const sortedIterations = (session?.iterations || []).slice().sort((a, b) => b.version - a.version);
  const activeIteration =
    sortedIterations.find((iter) => iter.version === activeVersion) ||
    sortedIterations[sortedIterations.length - 1];
  const hasIterations = session?.iterations?.length > 0;
  const promptTitle = session?.prompt_title || session?.title;
  const stage = activeIteration?.stage || session?.stage;
  const activeSampleId = activeIteration?.test_sample_id || null;
  const activeSampleTitle = activeIteration?.test_sample_title || '';
  const activeSampleInput = activeIteration?.test_sample_input || '';
  const activeSampleFromSet = testSamples.find((s) => s.id === activeSampleId);
  const selectedSampleMismatch =
    (selectedSampleId && activeSampleId && selectedSampleId !== activeSampleId) ||
    (!selectedSampleId && Boolean(activeSampleId));
  const sampleUsedTitle = activeSampleTitle || activeSampleFromSet?.title || t('iteration.test.defaultSampleTitle');
  const sampleUsedInput = activeSampleInput || activeSampleFromSet?.input || '';
  const selectedSample = testSamples.find((s) => s.id === selectedSampleId);
  const selectedSampleInput = selectedSample?.input || '';
  const selectedSampleTitle = selectedSample?.title || '';
  const isHidingDependentData = isResettingDependentData || isTesting || selectedSampleMismatch;
  const visibleTestResults = isHidingDependentData ? [] : (activeIteration?.test_results || []);
  const visibleSuggestions = (isHidingDependentData || isGeneratingSuggestions) ? [] : (activeIteration?.suggestions || []);

  const stageLabels = {
    init: t('iteration.stage.init'),
    prompt_ready: t('iteration.stage.promptReady'),
    title_ready: t('iteration.stage.titleReady'),
    tested: t('iteration.stage.tested')
  };
  const stageLabel = stage ? (stageLabels[stage] || stage) : null;

  useEffect(() => {
    const samples = session?.test_set || [];
    setTestSamples(samples);
  }, [session?.test_set]);

  useEffect(() => {
    const preferredId = activeSampleId || (testSamples[0]?.id ?? null);
    setSelectedSampleId(preferredId);
    setEditingSampleId(preferredId);

    const targetSample = testSamples.find((s) => s.id === preferredId);
    if (targetSample) {
      setSampleTitle(targetSample.title || '');
      setSampleInput(targetSample.input || '');
      setSampleNotes(targetSample.notes || '');
    } else {
      setSampleTitle('');
      setSampleInput('');
      setSampleNotes('');
    }
  }, [activeSampleId, testSamples]);

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

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
      showError(error.message || t('iteration.alert.iterateFail'));
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
      showError(error.message || t('iteration.alert.initFail'));
    } finally {
      setIsInitializing(false);
    }
  };

  const refreshSamples = async () => {
    if (!session?.id) return [];
    try {
      const samples = await api.listTestSamples(session.id);
      setTestSamples(samples);
      return samples;
    } catch (error) {
      console.error('Error loading test samples:', error);
      return [];
    }
  };

  const handleSelectSample = (sampleId) => {
    const sample = testSamples.find((s) => s.id === sampleId);
    const nextId = sample?.id || null;
    setSelectedSampleId(nextId);
    setEditingSampleId(nextId);
    setSampleTitle(sample?.title || '');
    setSampleInput(sample?.input || '');
    setSampleNotes(sample?.notes || '');
  };

  const handleNewSample = () => {
    setSelectedSampleId(null);
    setEditingSampleId(null);
    setSampleTitle('');
    setSampleInput('');
    setSampleNotes('');
  };

  const handleSaveSample = async () => {
    if (!session?.id) return;
    if (!sampleInput.trim()) {
      showError(t('iteration.test.sampleRequired'));
      return;
    }

    setIsSavingSample(true);
    try {
      let savedSample = null;
      const targetId = editingSampleId || selectedSampleId;
      if (targetId) {
        savedSample = await api.updateTestSample(session.id, targetId, {
          title: sampleTitle,
          test_input: sampleInput,
          notes: sampleNotes || null,
        });
      } else {
        savedSample = await api.createTestSample(session.id, {
          title: sampleTitle || t('iteration.test.defaultSampleTitle'),
          test_input: sampleInput,
          notes: sampleNotes || null,
        });
      }

      const samples = await refreshSamples();
      const nextId = savedSample?.id || targetId || (samples[0]?.id ?? null);
      setSelectedSampleId(nextId);
      setEditingSampleId(nextId);
      const nextSample = samples.find((s) => s.id === nextId);
      if (nextSample) {
        setSampleTitle(nextSample.title || '');
        setSampleInput(nextSample.input || '');
        setSampleNotes(nextSample.notes || '');
      }
    } catch (error) {
      console.error('Error saving test sample:', error);
      showError(error.message || t('iteration.test.saveSampleFail'));
    } finally {
      setIsSavingSample(false);
    }
  };

  const handleDeleteSample = async (sampleId = null) => {
    const targetId = sampleId || editingSampleId || selectedSampleId;
    if (!session?.id || !targetId) return;
    setIsDeletingSample(true);
    try {
      await api.deleteTestSample(session.id, targetId);
      const samples = await refreshSamples();
      const nextId = samples[0]?.id ?? null;
      setSelectedSampleId(nextId);
      setEditingSampleId(nextId);
      const nextSample = samples.find((s) => s.id === nextId);
      setSampleTitle(nextSample?.title || '');
      setSampleInput(nextSample?.input || '');
      setSampleNotes(nextSample?.notes || '');
    } catch (error) {
      console.error('Error deleting test sample:', error);
      showError(error.message || t('iteration.test.deleteSampleFail'));
    } finally {
      setIsDeletingSample(false);
    }
  };

  const handleTest = async () => {
    if (!selectedSampleId) {
      showError(t('iteration.test.sampleRequired'));
      return;
    }

    setIsTesting(true);
    setIsResettingDependentData(true);
    setStreamingTestResults(null);

    try {
      await api.testPromptStream(session.id, selectedSampleId, (event) => {
        if (event.type === 'start') {
          // Initialize streaming results with empty outputs
          const initialResults = event.models.map((model) => ({
            model,
            output: '',
            response_time: 0,
            rating: null,
            feedback: null,
            error: false,
            streaming: true,
          }));
          setStreamingTestResults(initialResults);
        } else if (event.type === 'delta') {
          // Append content to the specific model's output
          setStreamingTestResults((prev) => {
            if (!prev) return prev;
            return prev.map((result) =>
              result.model === event.model
                ? { ...result, output: result.output + event.content }
                : result
            );
          });
        } else if (event.type === 'error') {
          // Mark model as errored
          setStreamingTestResults((prev) => {
            if (!prev) return prev;
            return prev.map((result) =>
              result.model === event.model
                ? { ...result, output: `[Error: ${event.error}]`, error: true, streaming: false }
                : result
            );
          });
        } else if (event.type === 'model_done') {
          // Mark model as complete
          setStreamingTestResults((prev) => {
            if (!prev) return prev;
            return prev.map((result) =>
              result.model === event.model
                ? { ...result, streaming: false }
                : result
            );
          });
        } else if (event.type === 'complete') {
          // Streaming complete, reload session to get final state
          setStreamingTestResults(null);
          onAction('reload');
        }
      });
    } catch (error) {
      console.error('Error testing:', error);
      showError(error.message || t('iteration.alert.testFail'));
      setStreamingTestResults(null);
    } finally {
      setIsTesting(false);
      setIsResettingDependentData(false);
    }
  };

  const openSampleModal = async () => {
    setShowSampleModal(true);
    const samples = await refreshSamples();
    const preferId = selectedSampleId || samples[0]?.id || null;
    const sample = samples.find((s) => s.id === preferId);
    setEditingSampleId(preferId);
    setSampleTitle(sample?.title || '');
    setSampleInput(sample?.input || '');
    setSampleNotes(sample?.notes || '');
  };

  const closeSampleModal = () => {
    if (isSavingSample || isDeletingSample) return;
    setShowSampleModal(false);
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
    setStreamingSuggestions(null);

    try {
      await api.generateSuggestionsStream(session.id, (event) => {
        if (event.type === 'start') {
          // Initialize streaming suggestions with empty content
          const initialSuggestions = event.models.map((model) => ({
            model,
            suggestion: '',
            streaming: true,
          }));
          setStreamingSuggestions(initialSuggestions);
        } else if (event.type === 'delta') {
          // Append content to the specific model's suggestion
          setStreamingSuggestions((prev) => {
            if (!prev) return prev;
            return prev.map((item) =>
              item.model === event.model
                ? { ...item, suggestion: item.suggestion + event.content }
                : item
            );
          });
        } else if (event.type === 'error') {
          // Mark model as errored
          setStreamingSuggestions((prev) => {
            if (!prev) return prev;
            return prev.map((item) =>
              item.model === event.model
                ? { ...item, suggestion: `[Error: ${event.error}]`, error: true, streaming: false }
                : item
            );
          });
        } else if (event.type === 'model_done') {
          // Mark model as complete
          setStreamingSuggestions((prev) => {
            if (!prev) return prev;
            return prev.map((item) =>
              item.model === event.model
                ? { ...item, streaming: false }
                : item
            );
          });
        } else if (event.type === 'complete') {
          // Streaming complete, reload session to get final state
          setStreamingSuggestions(null);
          onAction('reload');
        }
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      showError(error.message || t('iteration.alert.suggestFail'));
      setStreamingSuggestions(null);
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
        {errorMessage && (
          <div className="error-toast">
            {errorMessage}
          </div>
        )}
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
            {isInitializing
              ? (initMode === 'generate' ? t('iteration.init.initializingPrompt') : t('iteration.init.initializingTitle'))
              : t('iteration.init.initButton')}
          </button>
        </div>
      </div>
    );
  }

  // Main iteration view
  return (
    <div className="iteration-view">
      {errorMessage && (
        <div className="error-toast">
          {errorMessage}
        </div>
      )}
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

      <div className="main-tabs">
        <button
          className={`main-tab ${mainTab === 'prompt' ? 'active' : ''}`}
          onClick={() => setMainTab('prompt')}
        >
          {t('iteration.tabs.prompt')}
        </button>
        <button
          className={`main-tab ${mainTab === 'test' ? 'active' : ''}`}
          onClick={() => setMainTab('test')}
        >
          {t('iteration.tabs.test')}
        </button>
        <button
          className={`main-tab ${mainTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setMainTab('suggestions')}
        >
          {t('iteration.tabs.suggestions')}
        </button>
      </div>

      <div className="main-tab-content">
        {mainTab === 'prompt' && (
          <PromptEditor
            prompt={activeIteration.prompt}
            version={activeIteration.version}
            readOnly={true}
          />
        )}

        {mainTab === 'test' && (
          <>
            <div className="action-section">
              <p>{t('iteration.test.stepDescription')}</p>

              <div className="sample-select-row">
                <label className="sample-label">{t('iteration.test.sampleSelectLabel')}</label>
                <select
                  value={selectedSampleId || ''}
                  onChange={(e) => handleSelectSample(e.target.value || null)}
                  className="sample-select"
                >
                  <option value="">{t('iteration.test.selectPlaceholder')}</option>
                  {testSamples.map((sample) => (
                    <option key={sample.id} value={sample.id}>
                      {sample.title || t('iteration.test.defaultSampleTitle')}
                    </option>
                  ))}
                </select>
                <button className="secondary-btn" onClick={openSampleModal}>
                  {t('iteration.test.manageSamples')}
                </button>
              </div>

              <div className="test-runner">
                <button
                  className="action-btn test-btn"
                  onClick={handleTest}
                  disabled={isTesting || !selectedSampleId || !selectedSampleInput.trim()}
                >
                  {isTesting ? t('iteration.test.testing') : t('iteration.test.button')}
                </button>
                {selectedSampleMismatch && (
                  <p className="info-text">{t('iteration.test.sampleMismatch')}</p>
                )}
              </div>
            </div>

            {/* Show streaming test results while streaming */}
            {streamingTestResults && streamingTestResults.length > 0 && (
              <>
                <div className="test-sample-summary">
                  <div className="test-sample-summary-header">
                    <h4>{t('iteration.test.sampleSummaryTitle')}</h4>
                    {selectedSampleTitle && <span className="sample-title-chip">{selectedSampleTitle}</span>}
                  </div>
                  <div className="test-sample-summary-body">
                    <pre>{selectedSampleInput || t('iteration.test.noSampleInput')}</pre>
                  </div>
                </div>
                <TestResults
                  testResults={streamingTestResults}
                  onFeedbackChange={null}
                  streaming={true}
                />
              </>
            )}

            {/* Show saved test results when not streaming */}
            {!streamingTestResults && visibleTestResults && visibleTestResults.length > 0 && (
              <>
                <div className="test-sample-summary">
                  <div className="test-sample-summary-header">
                    <h4>{t('iteration.test.sampleSummaryTitle')}</h4>
                    {sampleUsedTitle && <span className="sample-title-chip">{sampleUsedTitle}</span>}
                  </div>
                  <div className="test-sample-summary-body">
                    <pre>{sampleUsedInput || t('iteration.test.noSampleInput')}</pre>
                  </div>
                </div>
                <TestResults
                  testResults={visibleTestResults}
                  onFeedbackChange={handleFeedbackChange}
                />
              </>
            )}
          </>
        )}

        {mainTab === 'suggestions' && (
          <>
            <div className="action-section">
              <p>{t('iteration.suggestions.stepDescription')}</p>
              <button
                className="action-btn suggest-btn"
                onClick={handleGenerateSuggestions}
                disabled={isGeneratingSuggestions || visibleTestResults.length === 0}
              >
                {isGeneratingSuggestions ? t('iteration.suggestions.generating') : t('iteration.suggestions.button')}
              </button>
              {visibleTestResults.length === 0 && (
                <p className="info-text">{t('iteration.suggestions.needTest')}</p>
              )}
            </div>

            {/* Show streaming suggestions while streaming */}
            {streamingSuggestions && streamingSuggestions.length > 0 && (
              <SuggestionAggregator
                suggestions={streamingSuggestions}
                onAccept={null}
                onMerge={null}
                streaming={true}
                originalPrompt={activeIteration?.prompt || ''}
              />
            )}

            {/* Show saved suggestions when not streaming */}
            {!streamingSuggestions && visibleSuggestions && visibleSuggestions.length > 0 && (
              <SuggestionAggregator
                suggestions={visibleSuggestions}
                onAccept={handleAcceptSuggestion}
                onMerge={handleMergeSuggestions}
                originalPrompt={activeIteration?.prompt || ''}
              />
            )}
          </>
        )}
      </div>

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

      {showSampleModal && (
        <div className="sample-modal-backdrop" onClick={closeSampleModal}>
          <div className="sample-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sample-modal-header">
              <h4>{t('iteration.test.sampleModalTitle')}</h4>
              <button className="secondary-btn" onClick={handleNewSample}>
                {t('iteration.test.newSample')}
              </button>
            </div>

            <div className="sample-modal-content">
              <div className="sample-list">
                {testSamples.length === 0 && (
                  <p className="info-text">{t('iteration.test.sampleListEmpty')}</p>
                )}
                {testSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className={`sample-card ${editingSampleId === sample.id ? 'active' : ''}`}
                    onClick={() => {
                      setEditingSampleId(sample.id);
                      handleSelectSample(sample.id);
                    }}
                  >
                    <div className="sample-card-title">{sample.title || t('iteration.test.defaultSampleTitle')}</div>
                    <div className="sample-card-body">
                      <p className="sample-card-notes">{sample.notes}</p>
                      <pre className="sample-card-preview">{sample.input}</pre>
                    </div>
                    <div className="sample-card-actions">
                      <button
                        className="cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSample(sample.id);
                        }}
                        disabled={isDeletingSample}
                      >
                        {isDeletingSample ? t('common.loading') : t('iteration.test.deleteSample')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sample-form">
                <label className="sample-label">{t('iteration.test.sampleTitleLabel')}</label>
                <input
                  className="sample-input"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  placeholder={t('iteration.test.sampleTitlePlaceholder')}
                />

                <label className="sample-label">{t('iteration.test.sampleInputLabel')}</label>
                <textarea
                  className="sample-textarea"
                  rows={6}
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder={t('iteration.test.sampleInputPlaceholder')}
                />

                <label className="sample-label">{t('iteration.test.sampleNotesLabel')}</label>
                <textarea
                  className="sample-textarea"
                  rows={3}
                  value={sampleNotes}
                  onChange={(e) => setSampleNotes(e.target.value)}
                  placeholder={t('iteration.test.sampleNotesPlaceholder')}
                />

                <div className="sample-actions">
                  <button
                    className="action-btn"
                    onClick={handleSaveSample}
                    disabled={isSavingSample || !sampleInput.trim()}
                  >
                    {isSavingSample
                      ? t('common.loading')
                      : editingSampleId
                        ? t('iteration.test.updateSample')
                        : t('iteration.test.saveSample')}
                  </button>
                  <button className="cancel-btn" onClick={closeSampleModal} disabled={isSavingSample || isDeletingSample}>
                    {t('iteration.test.closeSampleModal')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IterationView;
