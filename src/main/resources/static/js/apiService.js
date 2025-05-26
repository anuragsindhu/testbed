// File: js/apiService.js

export class APIService {
  /**
   * @param {string} baseUrl - Optional base URL to prefix to all endpoints.
   */
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic method to make HTTP requests.
   * Automatically retries the request if an error occurs.
   *
   * @param {string} endpoint - The API endpoint.
   * @param {object} options - Options passed to fetch.
   * @param {number} retryCount - Number of retries before failing.
   * @returns {Promise<Response>} - The fetch response.
   */
  async request(endpoint, options = {}, retryCount = 2) {
    const url = this.baseUrl + endpoint;
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retryCount > 0) {
        // Wait for 500ms before trying again.
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.request(endpoint, options, retryCount - 1);
      }
      console.error(`Request to ${url} failed after retries:`, error);
      throw error;
    }
  }

  /**
   * Shortcut for GET requests.
   *
   * @param {string} endpoint
   * @param {number} retryCount
   * @returns {Promise<Response>}
   */
  async get(endpoint, retryCount = 2) {
    return this.request(endpoint, { method: "GET" }, retryCount);
  }

  /**
   * Shortcut for POST requests.
   *
   * @param {string} endpoint
   * @param {any} data - Data to send (e.g., a FormData instance).
   * @param {number} retryCount
   * @returns {Promise<Response>}
   */
  async post(endpoint, data, retryCount = 2) {
    return this.request(endpoint, { method: "POST", body: data }, retryCount);
  }
}
