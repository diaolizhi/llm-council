import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n/i18n.jsx';
import './SettingsView.css';

function SettingsView({ onClose }) {
  const { t } = useI18n();
  const [settings, setSettings] = useState(null);
  const [modelsInput, setModelsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [activeTab, setActiveTab] = useState('connection'); // connection | prompts

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getSettings();
        if (cancelled) return;
        setSettings(data);
        setModelsInput((data.test_models || []).join('\n'));
        setIsDirty(false);
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePromptChange = (index, field, value) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const prompts = [...(prev.built_in_prompts || [])];
      prompts[index] = { ...prompts[index], [field]: value };
      return { ...prev, built_in_prompts: prompts };
    });
    setIsDirty(true);
  };

  const handleAddPrompt = () => {
    const newId = `custom-${Date.now()}`;
    setSettings((prev) => {
      if (!prev) {
        return prev;
      }
      const prompts = [...(prev.built_in_prompts || [])];
      prompts.push({
        id: newId,
        title: '',
        description: '',
        prompt: '',
      });
      return { ...prev, built_in_prompts: prompts };
    });
    setExpandedPromptId(newId);
    setIsDirty(true);
  };

  const handleRemovePrompt = (id) => {
    setSettings((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        built_in_prompts: (prev.built_in_prompts || []).filter((prompt) => prompt.id !== id),
      };
    });
    setIsDirty(true);
  };

  const modelsList = modelsInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const togglePromptExpanded = (id) => {
    setExpandedPromptId((prev) => (prev === id ? null : id));
  };

  const handleSave = async () => {
    if (!settings) return;
    setStatus(null);

    // Validate required fields before saving
    const invalidPrompt = (settings.built_in_prompts || []).find(
      (p) => !p.title.trim() || !p.prompt.trim()
    );
    if (invalidPrompt) {
      setStatus({ type: 'error', message: t('settings.validationPromptRequired') });
      return;
    }

    if (modelsList.length === 0) {
      setStatus({ type: 'error', message: t('settings.validationModelsRequired') });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        openrouter_api_key: settings.openrouter_api_key || null,
        built_in_prompts: settings.built_in_prompts || [],
        test_models: modelsList,
        synthesizer_model: settings.synthesizer_model,
        generator_model: settings.generator_model,
      };
      const updated = await api.saveSettings(payload);
      setStatus({ type: 'success', message: t('settings.saveSuccess') });
      setSettings(updated);
      setModelsInput((updated.test_models || []).join('\n'));
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save settings', error);
      setStatus({ type: 'error', message: t('settings.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="settings-view">
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button className="settings-close" onClick={onClose}>
            {t('settings.back')}
          </button>
        </div>
        <div className="settings-loading">{t('settings.loading')}</div>
      </div>
    );
  }

  return (
    <div className="settings-view">
      <div className="settings-header">
        <div>
          <h2>{t('settings.title')}</h2>
          <p className="settings-subtitle">{t('settings.subtitle')}</p>
        </div>
        <div className="settings-actions">
          {isDirty && <span className="settings-dirty">{t('settings.unsaved')}</span>}
          <button className="settings-close" onClick={onClose}>
            {t('settings.back')}
          </button>
          <button className="settings-save" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'connection' ? 'active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          {t('settings.tabConnection')}
        </button>
        <button
          className={`settings-tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          {t('settings.tabPrompts')}
        </button>
      </div>

      {status && (
        <div className={`settings-status ${status.type}`}>{status.message}</div>
      )}

      {activeTab === 'connection' && (
        <div className="settings-form">
          <div className="settings-field">
            <label>{t('settings.openRouterKeyLabel')}</label>
            <input
              type="text"
              value={settings.openrouter_api_key || ''}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, openrouter_api_key: event.target.value }))
              }
              placeholder={t('settings.openRouterKeyPlaceholder')}
            />
            <small>{t('settings.openRouterKeyHelp')}</small>
          </div>

          <div className="settings-field">
            <label>{t('settings.testModelsLabel')}</label>
            <textarea
              rows={3}
              value={modelsInput}
              onChange={(event) => {
                setModelsInput(event.target.value);
                setIsDirty(true);
              }}
              placeholder={t('settings.testModelsPlaceholder')}
            />
            <small>{t('settings.testModelsHelp')}</small>
            {modelsList.length > 0 && (
              <div className="models-preview">
                <span className="models-count">
                  {t('settings.modelsCount', { count: modelsList.length })}
                </span>
                <div className="models-chips">
                  {modelsList.map((model) => (
                    <span key={model} className="models-chip">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="settings-field">
            <label>{t('settings.generatorModelLabel')}</label>
            <input
              type="text"
              value={settings.generator_model || ''}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, generator_model: event.target.value }))
              }
            />
          </div>

          <div className="settings-field">
            <label>{t('settings.synthesizerModelLabel')}</label>
            <input
              type="text"
              value={settings.synthesizer_model || ''}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, synthesizer_model: event.target.value }))
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="settings-form">
          <div className="settings-section">
            <div className="settings-section-header">
              <div>
                <h3>{t('settings.builtinPromptsTitle')}</h3>
                <p className="settings-section-description">
                  {t('settings.builtinPromptsHelp')}
                </p>
                <p className="settings-warning">{t('settings.backendOnlyWarning')}</p>
              </div>
              <button type="button" className="settings-add-btn" onClick={handleAddPrompt}>
                {t('settings.addPrompt')}
              </button>
            </div>

            {(settings.built_in_prompts || []).length === 0 && (
              <div className="settings-empty">{t('settings.noPrompts')}</div>
            )}

            {(settings.built_in_prompts || []).map((prompt, index) => {
              const isExpanded = expandedPromptId === prompt.id;
              return (
                <div key={prompt.id} className="prompt-card">
                  <div className="prompt-card-header">
                    <div
                      className="prompt-card-title"
                      onClick={() => togglePromptExpanded(prompt.id)}
                    >
                      <span className="prompt-card-id">{prompt.id}</span>
                      <span className="prompt-card-name">
                        {prompt.title || t('settings.untitledPrompt')}
                      </span>
                    </div>
                    <div className="prompt-card-actions">
                      <button
                        type="button"
                        className="prompt-toggle-btn"
                        onClick={() => togglePromptExpanded(prompt.id)}
                      >
                        {isExpanded ? t('settings.collapse') : t('settings.expand')}
                      </button>
                      <button
                        type="button"
                        className="prompt-remove-btn"
                        onClick={() => handleRemovePrompt(prompt.id)}
                      >
                        {t('settings.removePrompt')}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="prompt-card-body">
                      <div className="settings-field">
                        <label>{t('settings.promptTitleLabel')}</label>
                        <input
                          type="text"
                          value={prompt.title}
                          onChange={(event) =>
                            handlePromptChange(index, 'title', event.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>{t('settings.promptDescriptionLabel')}</label>
                        <input
                          type="text"
                          value={prompt.description || ''}
                          onChange={(event) =>
                            handlePromptChange(index, 'description', event.target.value)
                          }
                        />
                      </div>

                      <div className="settings-field">
                        <label>{t('settings.promptBodyLabel')}</label>
                        <textarea
                          rows={6}
                          value={prompt.prompt}
                          onChange={(event) =>
                            handlePromptChange(index, 'prompt', event.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
