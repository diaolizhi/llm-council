import ReactMarkdown from 'react-markdown';
import { useI18n } from '../../i18n/i18n.jsx';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  const { t } = useI18n();

  if (!finalResponse) {
    return null;
  }

  return (
    <div className="stage stage3">
      <h3 className="stage-title">{t('legacy.stage3.title')}</h3>
      <div className="final-response">
        <div className="chairman-label">
          {t('legacy.stage3.chairman', {
            model: finalResponse.model.split('/')[1] || finalResponse.model
          })}
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
