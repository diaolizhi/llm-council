/**
 * API client for the Prompt Optimizer backend.
 */

// In desktop mode (served from backend), use relative path
// In development mode (Vite dev server), use absolute URL
const API_BASE = import.meta.env.DEV ? 'http://localhost:8001' : '';

/**
 * Extract detailed error message from response.
 * Tries to get the 'detail' field from JSON response, falls back to status text.
 */
async function extractErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    if (data.detail) {
      return data.detail;
    }
    if (data.message) {
      return data.message;
    }
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
  } catch {
    // Response is not JSON or already consumed
  }
  return `${fallbackMessage} (HTTP ${response.status}: ${response.statusText})`;
}

export const api = {
  /**
   * List all optimization sessions.
   */
  async listSessions() {
    const response = await fetch(`${API_BASE}/api/sessions`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to list sessions');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * List all sessions with version history details.
   */
  async listSessionsWithVersions() {
    const sessions = await this.listSessions();
    const versions = await Promise.all(
      sessions.map(async (session) => {
        try {
          const history = await this.getVersionHistory(session.id);
          return { ...session, versions: history.versions || [] };
        } catch (error) {
          console.error(`Failed to load versions for session ${session.id}`, error);
          return { ...session, versions: [] };
        }
      })
    );
    return versions;
  },

  /**
   * Create a new optimization session.
   */
  async createSession(title = 'New Optimization Session', objective = null) {
    const response = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, objective }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to create session');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Get a specific session.
   */
  async getSession(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to get session');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Initialize a prompt (first iteration).
   */
  async initializePrompt(sessionId, mode, data) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode, ...data }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to initialize prompt');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Test a prompt with models.
   */
  async testPrompt(sessionId, testSampleId, models = null) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ models, test_sample_id: testSampleId }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to test prompt');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Submit feedback for a test result.
   */
  async submitFeedback(sessionId, model, rating = null, feedback = null) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, rating, feedback }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to submit feedback');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Generate improvement suggestions.
   */
  async generateSuggestions(sessionId, models = null) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ models }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to generate suggestions');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Merge improvement suggestions.
   */
  async mergeSuggestions(sessionId, userPreference = null) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_preference: userPreference }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to merge suggestions');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Create a new iteration.
   */
  async createIteration(sessionId, prompt, changeRationale, userDecision = null) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/iterate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        change_rationale: changeRationale,
        user_decision: userDecision,
      }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to create iteration');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Get session metrics.
   */
  async getMetrics(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/metrics`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to get metrics');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Get version history.
   */
  async getVersionHistory(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/versions`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to get version history');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Export session.
   */
  async exportSession(sessionId, format = 'json') {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/export?format=${format}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to export session');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Restore a specific version as the current active version.
   */
  async restoreVersion(sessionId, version) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to restore version');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * List test samples for a session.
   */
  async listTestSamples(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test-samples`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to list test samples');
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return data.samples || [];
  },

  /**
   * Create a test sample for a session.
   */
  async createTestSample(sessionId, { title, test_input, notes = null }) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test-samples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, test_input, notes }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to create test sample');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Update a test sample for a session.
   */
  async updateTestSample(sessionId, sampleId, { title, test_input, notes = null }) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test-samples/${sampleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, test_input, notes }),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to update test sample');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Delete a test sample for a session.
   */
  async deleteTestSample(sessionId, sampleId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test-samples/${sampleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to delete test sample');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Get current application settings.
   */
  async getSettings() {
    const response = await fetch(`${API_BASE}/api/settings`);
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to load settings');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Save application settings.
   */
  async saveSettings(payload) {
    const response = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to save settings');
      throw new Error(errorMsg);
    }
    return response.json();
  },

  /**
   * Reset application settings to defaults.
   */
  async resetSettings() {
    const response = await fetch(`${API_BASE}/api/settings/reset`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorMsg = await extractErrorMessage(response, 'Failed to reset settings');
      throw new Error(errorMsg);
    }
    return response.json();
  },
};
