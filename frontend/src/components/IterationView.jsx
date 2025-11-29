import React, { useState } from 'react';
import PromptEditor from './PromptEditor';
import TestResults from './TestResults';
import SuggestionAggregator from './SuggestionAggregator';
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

  const latestIteration = session?.iterations?.[session.iterations.length - 1];
  const hasIterations = session?.iterations?.length > 0;

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
      alert('Failed to initialize prompt. Please try again.');
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
      alert('Failed to test prompt. Please try again.');
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
      alert('Failed to generate suggestions. Please try again.');
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
    const rationale = prompt('Please provide a brief rationale for this change:', 'Applied improvement suggestions');
    if (rationale) {
      try {
        await onAction('iterate', {
          prompt: improvedPrompt,
          change_rationale: rationale,
          user_decision: 'accepted'
        });
      } catch (error) {
        console.error('Error creating iteration:', error);
        alert('Failed to create new iteration. Please try again.');
      }
    }
  };

  // Initialization view (no iterations yet)
  if (!hasIterations) {
    return (
      <div className="iteration-view">
        <div className="init-container">
          <h2>Initialize Your Prompt</h2>

          <div className="init-mode-selector">
            <button
              className={`mode-btn ${initMode === 'generate' ? 'active' : ''}`}
              onClick={() => setInitMode('generate')}
            >
              Generate from Objective
            </button>
            <button
              className={`mode-btn ${initMode === 'provide' ? 'active' : ''}`}
              onClick={() => setInitMode('provide')}
            >
              Provide Existing Prompt
            </button>
          </div>

          {initMode === 'generate' ? (
            <div className="init-form">
              <label>Describe your objective:</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="E.g., Create a comprehensive code review prompt that checks for bugs, style, and best practices..."
                rows={5}
                className="objective-input"
              />
            </div>
          ) : (
            <div className="init-form">
              <label>Paste your prompt:</label>
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
            {isInitializing ? 'Initializing...' : 'Initialize Prompt'}
          </button>
        </div>
      </div>
    );
  }

  // Main iteration view
  return (
    <div className="iteration-view">
      <div className="iteration-header">
        <h2>Version {latestIteration.version}</h2>
        <div className="iteration-meta">
          <span>{latestIteration.change_rationale}</span>
        </div>
      </div>

      <PromptEditor
        prompt={latestIteration.prompt}
        version={latestIteration.version}
        readOnly={true}
      />

      <div className="action-section">
        <h3>Step 1: Test Your Prompt</h3>
        <p>Test this prompt with multiple LLMs to see how they respond.</p>

        {!showTestInput ? (
          <button
            className="action-btn test-btn"
            onClick={handleTestClick}
            disabled={isTesting}
          >
            Test Prompt with LLMs
          </button>
        ) : (
          <div className="test-input-container">
            <label>Test Input (Optional):</label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter a test question or input to use with your prompt. Leave empty to test the prompt as-is. Example: 'Review this code: function add(a, b) { return a + b; }'"
              rows={4}
              className="test-input-textarea"
            />
            <div className="test-input-actions">
              <button
                className="action-btn test-btn"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? 'Testing...' : 'Run Test'}
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={() => setShowTestInput(false)}
                disabled={isTesting}
              >
                Cancel
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
            <h3>Step 2: Generate Improvement Suggestions</h3>
            <p>Based on the test results and your feedback, get suggestions from all LLMs.</p>
            <button
              className="action-btn suggest-btn"
              onClick={handleGenerateSuggestions}
              disabled={isGeneratingSuggestions}
            >
              {isGeneratingSuggestions ? 'Generating Suggestions...' : 'Generate Improvement Suggestions'}
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
