// File: js/model.js

import { APIService } from './apiService.js';

export class FormModel {
  constructor() {
    // Initialize the APIService instance.
    // If you need to set a base URL (e.g. for versioned APIs), pass it here.
    this.api = new APIService();
  }

  /**
   * Fetches primary options based on the tab.
   * For 'queue' it calls /api/qms and for 'kafka' it calls /api/kcs.
   *
   * @param {string} tabName - "queue" or "kafka".
   * @returns {Promise<Array>} - An array of options.
   */
  async fetchPrimaryOptions(tabName) {
    const endpoint = tabName === "queue" ? "/api/qms" : "/api/kcs";
    try {
      const response = await this.api.get(endpoint);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching primary options for ${tabName}:`, error);
      return [];
    }
  }

  /**
   * Fetches secondary options based on the selected primary value.
   *
   * @param {string} tabName - "queue" or "kafka".
   * @param {string} primaryValue - The selected primary option.
   * @returns {Promise<Array>} - An array of secondary options.
   */
  async fetchSecondaryOptions(tabName, primaryValue) {
    if (!primaryValue) return [];
    const endpoint =
      tabName === "queue"
        ? `/api/${primaryValue}/queues`
        : `/api/${primaryValue}/topics`;
    try {
      const response = await this.api.get(endpoint);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching secondary options for ${tabName}:`, error);
      return [];
    }
  }

  /**
   * Uploads the form data to the server.
   *
   * @param {FormData} formData - The form data to send.
   * @returns {Promise<string>} - The server's response as text.
   */
  async uploadForm(formData) {
    try {
      const response = await this.api.post("/api/upload", formData);
      return await response.text();
    } catch (error) {
      console.error("Error during upload:", error);
      throw error;
    }
  }
}
