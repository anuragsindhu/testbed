// File: js/view.js

export class FormView {
  constructor() {
    this.template = document.getElementById("uploadFormTemplate");
    if (!this.template) {
      console.error("Upload form template not found");
    }
  }

  /**
   * Creates a fresh form for the given tab.
   * Enhances accessibility by adding ARIA roles and labels.
   *
   * @param {string} tabName - Either "queue" or "kafka".
   * @returns {HTMLElement} - The container element for the form.
   */
  createForm(tabName) {
    if (!this.template) return null;
    const clone = this.template.content.cloneNode(true);
    const container = clone.querySelector(".form-content");
    if (!container) {
      console.error("Form container (.form-content) not found in template");
      return null;
    }

    // Set ARIA attributes for accessibility.
    container.setAttribute("role", "form");
    container.setAttribute("aria-label", `${tabName} upload form`);

    const primarySelect = container.querySelector(".primary-select");
    const secondarySelect = container.querySelector(".secondary-select");
    const primaryLabel = container.querySelector(".primary-label");
    const secondaryLabel = container.querySelector(".secondary-label");

    // Set unique IDs for clarity.
    primarySelect.id = `${tabName}PrimarySelect`;
    secondarySelect.id = `${tabName}SecondarySelect`;

    // Update label text based on the tab.
    if (tabName === "queue") {
      primaryLabel.textContent = "Queue Manager:";
      secondaryLabel.textContent = "Queue:";
    } else {
      primaryLabel.textContent = "Kafka Cluster:";
      secondaryLabel.textContent = "Topic:";
    }

    return container;
  }

  /**
   * Updates a dropdown element with provided options.
   * Uses template literals for concise rendering.
   *
   * @param {HTMLElement} selectElement - The dropdown element to update.
   * @param {string} defaultText - Default option text.
   * @param {Array<string>} options - Array of option values.
   */
  updateDropdown(selectElement, defaultText, options) {
    let markup = `<option value="">${defaultText}</option>`;
    options.forEach((item) => {
      markup += `<option value="${item}">${item}</option>`;
    });
    selectElement.innerHTML = markup;
  }

  /**
   * Displays a message in the form.
   * Adds ARIA role "alert" so screen readers will announce the change.
   *
   * @param {HTMLElement} formElement - The form element that contains the message container.
   * @param {string} message - Text message to display.
   * @param {string} [type="success"] - Message type: "success" or "error".
   */
  showMessage(formElement, message, type = "success") {
    const messageDiv = formElement.querySelector(".message");
    if (!messageDiv) return;
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.setAttribute("role", "alert");
  }

  /**
   * Clears any message in the form.
   *
   * @param {HTMLElement} formElement - The form element.
   */
  clearMessage(formElement) {
    const messageDiv = formElement.querySelector(".message");
    if (messageDiv) {
      messageDiv.textContent = "";
      messageDiv.className = "message";
      messageDiv.removeAttribute("role");
    }
  }

  /**
   * Clears the headers container's content.
   *
   * @param {HTMLElement} container - The parent container of the headers.
   */
  clearHeaders(container) {
    const headersContainer = container.querySelector(".headers-container");
    if (headersContainer) headersContainer.innerHTML = "";
  }

  /**
   * Renders the HTML for a header row using template literals.
   * Includes ARIA attributes for accessibility.
   *
   * @returns {string} - The HTML markup for a single header row.
   */
  renderHeaderRow() {
    return `
      <div class="header-row" role="group" aria-label="Header row">
        <input type="text" placeholder="Header Key" aria-label="Header key" />
        <input type="text" placeholder="Header Value" aria-label="Header value" />
        <button type="button" class="remove-header-btn" aria-label="Remove header">Remove</button>
      </div>
    `;
  }

  /**
   * Binds event listeners for adding and removing header rows.
   * Uses event delegation for remove button clicks.
   *
   * @param {HTMLElement} container - The form container element.
   */
  bindAddHeader(container) {
    const headersContainer = container.querySelector(".headers-container");
    const addHeaderBtn = container.querySelector(".add-header-btn");
    if (!headersContainer || !addHeaderBtn) {
      console.error("Headers container or Add Header button not found.");
      return;
    }

    // Add header row using template rendering.
    addHeaderBtn.addEventListener("click", () => {
      headersContainer.insertAdjacentHTML("beforeend", this.renderHeaderRow());
    });

    // Use event delegation: attach a single listener to the headers container.
    headersContainer.addEventListener("click", (event) => {
      if (event.target && event.target.classList.contains("remove-header-btn")) {
        const headerRow = event.target.closest(".header-row");
        if (headerRow) {
          headerRow.remove();
        }
      }
    });
  }
}
