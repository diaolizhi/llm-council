import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import IterationView from './components/IterationView';
import { api } from './api';
import { useI18n } from './i18n/i18n.jsx';
import './App.css';
import SettingsView from './components/SettingsView';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
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
      const sessionsList = await api.listSessionsWithVersions();
      setSessions(sessionsList);

      // Select first session if available
      if (sessionsList.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessionsList[0].id);
        const defaultVersion =
          sessionsList[0].current_version ||
          (sessionsList[0].versions?.[sessionsList[0].versions.length - 1]?.version ?? null);
        setCurrentVersion(defaultVersion);
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
      setCurrentVersion(session.current_version || (session.iterations?.slice(-1)[0]?.version ?? null));
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
      setCurrentVersion(null);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create new session. Please try again.');
    }
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    const sessionMeta = sessions.find((s) => s.id === sessionId);
    if (sessionMeta) {
      setCurrentVersion(
        sessionMeta.current_version ||
          (sessionMeta.versions?.[sessionMeta.versions.length - 1]?.version ?? null)
      );
    } else {
      setCurrentVersion(null);
    }
  };

  const handleRestoreVersion = async (sessionId, version) => {
    if (!sessionId || !version) return;
    try {
      await api.restoreVersion(sessionId, version);
      setCurrentSessionId(sessionId);
      setCurrentVersion(version);
      await loadSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert(t('iteration.alert.restoreFail') || 'Failed to restore version');
    }
  };

  const handleOpenSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  const handleAction = async (action, data) => {
    if (!currentSessionId) return;

    try {
      let result;

      switch (action) {
        case 'initialize':
          result = await api.initializePrompt(currentSessionId, data.mode, data);
          await loadSession(currentSessionId);
          await loadSessions(); // Refresh session list
          setCurrentVersion(result?.version || null);
          return result;

        case 'test':
          result = await api.testPrompt(currentSessionId, data.test_sample_id, data.models);
          await loadSession(currentSessionId);
          setCurrentVersion((prev) => prev || result?.version || null);
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
          setCurrentVersion(result?.version || null);
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
        onOpenSettings={handleOpenSettings}
      />
      <main className="main-content">
        {currentSession ? (
          <IterationView
            session={currentSession}
            activeVersion={currentVersion}
            onRestoreVersion={handleRestoreVersion}
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

      {showSettings && (
        <div className="modal-overlay" onClick={handleCloseSettings}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SettingsView onClose={handleCloseSettings} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
