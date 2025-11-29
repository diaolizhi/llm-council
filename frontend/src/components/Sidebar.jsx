import './Sidebar.css';
import { useI18n } from '../i18n/i18n.jsx';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
}) {
  const { t, locale, setLocale } = useI18n();

  const handleLocaleChange = (event) => {
    setLocale(event.target.value);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h1>{t('sidebar.title')}</h1>
        </div>
        <button className="new-conversation-btn" onClick={onNewSession}>
          {t('sidebar.newSession')}
        </button>
      </div>

      <div className="conversation-list">
        {sessions.length === 0 ? (
          <div className="no-conversations">{t('sidebar.noSessions')}</div>
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
                {session.prompt_title || session.title || t('sidebar.defaultSessionTitle')}
              </div>
              <div className="conversation-meta">
                {((session.version_count ?? session.iteration_count) || 0) === 1
                  ? t('sidebar.iterationSingular', { count: session.version_count ?? session.iteration_count ?? 0 })
                  : t('sidebar.iterationPlural', { count: session.version_count ?? session.iteration_count ?? 0 })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="language-switcher">
        <label htmlFor="language-select">{t('sidebar.language')}</label>
        <select
          id="language-select"
          value={locale}
          onChange={handleLocaleChange}
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </div>
  );
}
