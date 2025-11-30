/**
 * API client for the Prompt Optimizer backend.
 */

const API_BASE = 'http://localhost:8001';

export const api = {
  /**
   * List all optimization sessions.
   */
  async listSessions() {
    const response = await fetch(`${API_BASE}/api/sessions`);
    if (!response.ok) {
      throw new Error('Failed to list sessions');
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
      throw new Error('Failed to create session');
    }
    return response.json();
  },

  /**
   * Get a specific session.
   */
  async getSession(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error('Failed to get session');
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
      throw new Error('Failed to initialize prompt');
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
      throw new Error('Failed to test prompt');
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
      throw new Error('Failed to submit feedback');
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
      throw new Error('Failed to generate suggestions');
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
      throw new Error('Failed to merge suggestions');
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
      throw new Error('Failed to create iteration');
    }
    return response.json();
  },

  /**
   * Get session metrics.
   */
  async getMetrics(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/metrics`);
    if (!response.ok) {
      throw new Error('Failed to get metrics');
    }
    return response.json();
  },

  /**
   * Get version history.
   */
  async getVersionHistory(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/versions`);
    if (!response.ok) {
      throw new Error('Failed to get version history');
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
      throw new Error('Failed to export session');
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
      throw new Error('Failed to restore version');
    }
    return response.json();
  },

  /**
   * List test samples for a session.
   */
  async listTestSamples(sessionId) {
    const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/test-samples`);
    if (!response.ok) {
      throw new Error('Failed to list test samples');
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
      throw new Error('Failed to create test sample');
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
      throw new Error('Failed to update test sample');
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
      throw new Error('Failed to delete test sample');
    }
    return response.json();
  },

  /**
   * Get current application settings.
   */
  async getSettings() {
    const response = await fetch(`${API_BASE}/api/settings`);
    if (!response.ok) {
      throw new Error('Failed to load settings');
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
      throw new Error('Failed to save settings');
    }
    return response.json();
  },
};
