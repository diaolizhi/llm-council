import React, { useState } from 'react';
import './PromptEditor.css';

function PromptEditor({ prompt, onChange, readOnly = false, version = null }) {
  const [charCount, setCharCount] = useState(prompt?.length || 0);

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
        <h3>Prompt {version !== null ? `(Version ${version})` : ''}</h3>
        <span className="char-count">{charCount} characters</span>
      </div>
      <textarea
        className="prompt-textarea"
        value={prompt || ''}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Enter your prompt here..."
        rows={10}
      />
    </div>
  );
}

export default PromptEditor;
