import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IterationView from './components/IterationView';
import { api } from './api';
import { useI18n } from './i18n/i18n.jsx';
import './App.css';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load current session when selected
  useEffect(() => {
    if (currentSessionId) {
      loadSession(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const sessionsList = await api.listSessions();
      setSessions(sessionsList);

      // Select first session if available
      if (sessionsList.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessionsList[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const session = await api.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleNewSession = async () => {
    try {
      const session = await api.createSession();
      setSessions([session, ...sessions]);
      setCurrentSessionId(session.id);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create new session. Please try again.');
    }
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleAction = async (action, data) => {
    if (!currentSessionId) return;

    try {
      let result;

      switch (action) {
        case 'initialize':
          result = await api.initializePrompt(currentSessionId, data.mode, data);
          await loadSession(currentSessionId);
          await loadSessions(); // Refresh session list
          return result;

        case 'test':
          result = await api.testPrompt(currentSessionId, data.models, data.test_input);
          await loadSession(currentSessionId);
          return result;

        case 'feedback':
          result = await api.submitFeedback(currentSessionId, data.model, data.rating, data.feedback);
          await loadSession(currentSessionId);
          return result;

        case 'suggest':
          result = await api.generateSuggestions(currentSessionId, data.models);
          await loadSession(currentSessionId);
          return result;

        case 'merge':
          result = await api.mergeSuggestions(currentSessionId, data.userPreference);
          return result;

        case 'iterate':
          result = await api.createIteration(
            currentSessionId,
            data.prompt,
            data.change_rationale,
            data.user_decision
          );
          await loadSession(currentSessionId);
          await loadSessions(); // Refresh session list
          return result;

        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />
      <main className="main-content">
        {currentSession ? (
          <IterationView
            session={currentSession}
            onAction={handleAction}
          />
        ) : (
          <div className="empty-state">
            <h2>{t('app.empty.title')}</h2>
            <p>{t('app.empty.description')}</p>
            <button className="create-session-btn" onClick={handleNewSession}>
              {t('app.empty.button')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
