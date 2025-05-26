// File: js/controller.js

export class FormController {
  constructor(model, view, eventBus) {
    this.model = model;
    this.view = view;
    this.eventBus = eventBus; // Global event bus for pub/sub
    // Cache DOM elements for tab containers and buttons.
    this.tabs = {
      queue: document.getElementById("tabQueue"),
      kafka: document.getElementById("tabKafka"),
    };
    this.tabButtons = {
      queue: document.getElementById("btnQueue"),
      kafka: document.getElementById("btnKafka"),
    };

    // State management: Track the active tab.
    this.state = {
      activeTab: "queue",
    };

    window.addEventListener("hashchange", this.handleRouting.bind(this));
  }

  // Updates active tab state, button classes, and URL hash.
  setActiveTab(tabName) {
    this.state.activeTab = tabName;
    Object.keys(this.tabButtons).forEach((key) => {
      if (key === tabName) {
        this.tabButtons[key].classList.add("active");
      } else {
        this.tabButtons[key].classList.remove("active");
      }
    });
    Object.keys(this.tabs).forEach((key) => {
      if (key === tabName) {
        this.tabs[key].classList.add("active");
      } else {
        this.tabs[key].classList.remove("active");
      }
    });
    window.location.hash = tabName;
  }

  // Handles changes in the URL hash to support basic routing.
  handleRouting() {
    const hash = window.location.hash.substring(1);
    if (hash && this.tabs[hash]) {
      this.initTab(hash);
      this.setActiveTab(hash);
    }
  }

  // Initialize a tab by clearing it and injecting a fresh form with proper event wiring.
  async initTab(tabName) {
    const tabElement = this.tabs[tabName];
    if (!tabElement) {
      console.error(`Tab element for ${tabName} not found.`);
      return;
    }
    tabElement.innerHTML = "";
    const formContainer = this.view.createForm(tabName);
    if (!formContainer) return;
    tabElement.appendChild(formContainer);

    // Populate the primary dropdown.
    const primarySelect = formContainer.querySelector(".primary-select");
    const defaultPrimary = tabName === "queue" ? "Select a Queue Manager" : "Select a Kafka Cluster";
    const primaryOptions = await this.model.fetchPrimaryOptions(tabName);
    this.view.updateDropdown(primarySelect, defaultPrimary, primaryOptions);

    // Bind primary dropdown change event to update the secondary dropdown.
    const secondarySelect = formContainer.querySelector(".secondary-select");
    primarySelect.addEventListener("change", async () => {
      const selectedValue = primarySelect.value;
      const defaultSecondary = tabName === "queue" ? "Select a Queue" : "Select a Kafka Topic";
      if (!selectedValue) {
        this.view.updateDropdown(secondarySelect, defaultSecondary, []);
        return;
      }
      const secondaryOptions = await this.model.fetchSecondaryOptions(tabName, selectedValue);
      this.view.updateDropdown(secondarySelect, defaultSecondary, secondaryOptions);
    });

    // Wire dynamic header rows.
    this.view.bindAddHeader(formContainer);

    // Wire form submission.
    const form = formContainer.querySelector(".upload-form");
    this.bindFormSubmission(form, formContainer, tabName);
  }

  // Validate form input, build FormData, and submit via the model.
  bindFormSubmission(form, container, tabName) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.view.clearMessage(form);

      // Validate dropdown selections.
      const primarySelect = container.querySelector(".primary-select");
      const secondarySelect = container.querySelector(".secondary-select");
      if (!primarySelect.value || !secondarySelect.value) {
        return this.view.showMessage(form, "Please select both a primary and a secondary item.", "error");
      }

      // Process file input and manual content.
      const fileInput = form.querySelector(".file-input");
      const contentInput = form.querySelector(".content-input");
      const fileSelected = fileInput && fileInput.files && fileInput.files.length > 0;
      const manualContent = contentInput.value.trim();

      if (fileSelected && manualContent.length > 0) {
        return this.view.showMessage(form, "Provide either a file or pasted content, not both.", "error");
      }
      if (!fileSelected && manualContent.length === 0) {
        return this.view.showMessage(form, "No content provided.", "error");
      }

      // Validate file type when file is selected.
      if (fileSelected) {
        const allowedTypes = ["text/plain", "application/json", "application/xml", "text/xml"];
        const fileType = fileInput.files[0].type;
        if (!allowedTypes.includes(fileType)) {
          return this.view.showMessage(form, "File type not allowed.", "error");
        }
        const fileName = fileInput.files[0].name.toLowerCase();
        if (!(fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".xml"))) {
          return this.view.showMessage(form, "File extension not allowed.", "error");
        }
      }

      // Get newline format.
      const newlineCheckbox = form.querySelector(".newline-check");
      const newlineFormat = newlineCheckbox && newlineCheckbox.checked ? "windows" : "unix";

      // Build FormData.
      const formData = new FormData();
      formData.append("newlineFormat", newlineFormat);
      formData.append("tab", tabName);
      formData.append("primary", primarySelect.value);
      formData.append("secondary", secondarySelect.value);
      if (fileSelected) {
        formData.append("file", fileInput.files[0]);
      } else {
        formData.append("content", manualContent);
      }

      // Collect dynamic header key-value pairs.
      const headersObj = {};
      container.querySelectorAll(".header-row").forEach((row) => {
        const inputs = row.querySelectorAll("input");
        if (inputs.length >= 2) {
          const key = inputs[0].value.trim();
          const value = inputs[1].value.trim();
          if (key) headersObj[key] = value;
        }
      });
      if (Object.keys(headersObj).length > 0) {
        formData.append("headers", JSON.stringify(headersObj));
      }

      // Submit the form data via the model.
      this.model.uploadForm(formData)
        .then((resultText) => {
          this.view.showMessage(form, resultText, "success");
          form.reset();
          this.view.clearHeaders(container);
          // Emit a global event indicating successful form submission.
          this.eventBus.emit("formSubmitted", { tab: tabName, result: resultText });
        })
        .catch((err) => {
          this.view.showMessage(form, "Upload failed.", "error");
          console.error("Upload failed:", err);
          this.eventBus.emit("formSubmissionFailed", { tab: tabName, error: err });
        });
    });
  }

  // Initialize the tabs, set up routing, and wire tab switching.
  init() {
    const initialTab = window.location.hash.substring(1) || "queue";
    this.initTab("queue");
    this.initTab("kafka");
    this.setActiveTab(initialTab);

    // Wire up tab button events.
    this.tabButtons.queue.addEventListener("click", () => {
      this.initTab("queue");
      this.setActiveTab("queue");
    });
    this.tabButtons.kafka.addEventListener("click", () => {
      this.initTab("kafka");
      this.setActiveTab("kafka");
    });
  }
}
