import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '../i18n/i18n.jsx';
import './PromptEditor.css';

function PromptEditor({ prompt, onChange, readOnly = false, version = null }) {
  const [charCount, setCharCount] = useState(prompt?.length || 0);
  const { t } = useI18n();

  // Keep character count in sync when prompt prop changes
  React.useEffect(() => {
    setCharCount(prompt?.length || 0);
  }, [prompt]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="prompt-editor">
      <div className="editor-header">
        <h3>
          {version !== null
            ? t('promptEditor.titleWithVersion', { version })
            : t('promptEditor.title')}
        </h3>
        <span className="char-count">
          {t('promptEditor.charCount', { count: charCount })}
        </span>
      </div>
      {readOnly ? (
        <div className="markdown-content prompt-display">
          <ReactMarkdown>{prompt || ''}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="prompt-textarea"
          value={prompt || ''}
          onChange={handleChange}
          placeholder={t('promptEditor.placeholder')}
          rows={10}
        />
      )}
    </div>
  );
}

export default PromptEditor;
