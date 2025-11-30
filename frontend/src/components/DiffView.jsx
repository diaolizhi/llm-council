import React from 'react';
import { diffLines, diffWords } from 'diff';
import { useI18n } from '../i18n/i18n.jsx';
import './DiffView.css';

function DiffView({ oldText, newText, mode = 'lines' }) {
  const { t } = useI18n();

  if (!oldText || !newText) {
    return (
      <div className="diff-view">
        <p className="no-diff">{t('diff.noDiff') || '无法显示差异对比'}</p>
      </div>
    );
  }

  const diffs = mode === 'lines' ? diffLines(oldText, newText) : diffWords(oldText, newText);

  return (
    <div className="diff-view">
      <div className="diff-container">
        <div className="diff-side">
          <div className="diff-header old-header">{t('diff.original') || '原始提示词'}</div>
          <div className="diff-content">
            {diffs.map((part, index) => {
              if (part.added) return null;
              return (
                <span
                  key={index}
                  className={part.removed ? 'diff-removed' : 'diff-unchanged'}
                >
                  {part.value}
                </span>
              );
            })}
          </div>
        </div>
        <div className="diff-side">
          <div className="diff-header new-header">{t('diff.improved') || '改进后提示词'}</div>
          <div className="diff-content">
            {diffs.map((part, index) => {
              if (part.removed) return null;
              return (
                <span
                  key={index}
                  className={part.added ? 'diff-added' : 'diff-unchanged'}
                >
                  {part.value}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiffView;
