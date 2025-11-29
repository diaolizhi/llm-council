import { useState, useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Prompt Optimizer</h1>
        <button className="new-conversation-btn" onClick={onNewSession}>
          + New Session
        </button>
      </div>

      <div className="conversation-list">
        {sessions.length === 0 ? (
          <div className="no-conversations">No sessions yet</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`conversation-item ${
                session.id === currentSessionId ? 'active' : ''
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="conversation-title">
                {session.title || 'New Session'}
              </div>
              <div className="conversation-meta">
                {session.iteration_count} {session.iteration_count === 1 ? 'iteration' : 'iterations'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
