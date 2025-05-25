// File: src/main/resources/static/js/main.js

// Wait for the DOM to fully load before running our script.
document.addEventListener("DOMContentLoaded", () => {

  /**
   * createFormForTab
   * -----------------
   * Clones the reusable template for the upload form and customizes it for the given tab.
   * This function sets the correct IDs and labels for the primary and secondary dropdowns
   * (e.g. Queue Manager/Queue or Kafka Cluster/Topic). It then wires up all the logic:
   * - Populating dropdowns via REST API calls.
   * - Handling changes on the primary dropdown to update the secondary.
   * - Wiring dynamic header row addition.
   * - Wiring form submission.
   *
   * @param {string} tabName - Either "queue" or "kafka", used to customize the form.
   * @returns {DocumentFragment} - A fresh clone of the template with all logic attached.
   */
  function createFormForTab(tabName) {
    // Get the template element by its ID.
    const template = document.getElementById("uploadFormTemplate");
    if (!template) {
      console.error("uploadFormTemplate not found.");
      return null;
    }

    // Clone the content of the template (deep clone).
    const clone = template.content.cloneNode(true);

    // Find the wrapping container that holds the dropdowns and the form.
    const container = clone.querySelector(".form-content");
    if (!container) {
      console.error(".form-content not found in template.");
      return null;
    }

    // Retrieve dropdown elements from the container.
    const primarySelect = container.querySelector(".primary-select");
    const secondarySelect = container.querySelector(".secondary-select");
    if (!primarySelect || !secondarySelect) {
      console.error("Primary or secondary select not found.");
      return null;
    }
    // Set unique IDs based on the tab for clarity.
    primarySelect.id = `${tabName}PrimarySelect`;
    secondarySelect.id = `${tabName}SecondarySelect`;

    // Adjust label texts for clarity:
    // For the "queue" tab, the labels become "Queue Manager:" and "Queue:".
    // For the "kafka" tab, they become "Kafka Cluster:" and "Topic:".
    const primaryLabel = container.querySelector(".primary-label");
    const secondaryLabel = container.querySelector(".secondary-label");
    if (tabName === "queue") {
      primaryLabel.textContent = "Queue Manager:";
      secondaryLabel.textContent = "Queue:";
    } else if (tabName === "kafka") {
      primaryLabel.textContent = "Kafka Cluster:";
      secondaryLabel.textContent = "Topic:";
    }

    // Populate the primary dropdown by invoking a REST API call.
    populatePrimaryOptions(tabName, primarySelect);
    // When the primary dropdown changes, dynamically populate the secondary dropdown.
    bindPrimaryChangeHandler(tabName, primarySelect, secondarySelect);
    // Wire up the ability to add new header rows.
    bindHeaderWiring(container);

    // Locate the form element within the container.
    const form = container.querySelector(".upload-form");
    if (!form) {
      console.error("Upload form not found in container.");
      return null;
    }
    // Wire up the form submission handler with actual server calls.
    wireFormSubmission(form, container, tabName);

    return clone;
  }

  /**
   * populatePrimaryOptions
   * ------------------------
   * Populates the primary dropdown (either for Queue Managers or Kafka Clusters)
   * by calling the corresponding REST API endpoint.
   *
   * @param {string} tabName - "queue" or "kafka" to determine which API to call.
   * @param {HTMLElement} primarySelect - The dropdown element to populate.
   */
  function populatePrimaryOptions(tabName, primarySelect) {
    let endpoint, defaultText;
    if (tabName === "queue") {
      endpoint = "/api/qms";
      defaultText = "Select a Queue Manager";
    } else if (tabName === "kafka") {
      endpoint = "/api/kcs";
      defaultText = "Select a Kafka Cluster";
    }
    // Call the API and update the dropdown options.
    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        primarySelect.innerHTML = `<option value="">${defaultText}</option>`;
        data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item;
          option.textContent = item;
          primarySelect.appendChild(option);
        });
      })
      .catch((err) =>
        console.error(`Error fetching ${tabName} primary data:`, err)
      );
  }

  /**
   * bindPrimaryChangeHandler
   * -------------------------
   * Binds an event listener to the primary dropdown so that when its value changes,
   * the secondary dropdown is populated based on the selected primary value.
   *
   * @param {string} tabName - "queue" or "kafka"
   * @param {HTMLElement} primarySelect - The primary dropdown.
   * @param {HTMLElement} secondarySelect - The secondary dropdown to populate.
   */
  function bindPrimaryChangeHandler(tabName, primarySelect, secondarySelect) {
    primarySelect.addEventListener("change", () => {
      const selectedValue = primarySelect.value;
      let endpoint, defaultText;
      if (!selectedValue) {
        defaultText =
          tabName === "queue" ? "Select a Queue" : "Select a Kafka Topic";
        secondarySelect.innerHTML = `<option value="">${defaultText}</option>`;
        return;
      }
      if (tabName === "queue") {
        endpoint = `/api/${selectedValue}/queues`;
        defaultText = "Select a Queue";
      } else if (tabName === "kafka") {
        endpoint = `/api/${selectedValue}/topics`;
        defaultText = "Select a Kafka Topic";
      }
      // Fetch and populate the secondary dropdown.
      fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
          secondarySelect.innerHTML = `<option value="">${defaultText}</option>`;
          data.forEach((item) => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            secondarySelect.appendChild(option);
          });
        })
        .catch((err) =>
          console.error(`Error fetching ${tabName} secondary data:`, err)
        );
    });
  }

  /**
   * bindHeaderWiring
   * ----------------
   * Wires the click event of the "Add Header" button so that each click
   * adds a new row of header key-value inputs. It also sets up the remove functionality.
   *
   * @param {HTMLElement} container - The container element (".form-content") where headers are placed.
   */
  function bindHeaderWiring(container) {
    const headersContainer = container.querySelector(".headers-container");
    const addHeaderBtn = container.querySelector(".add-header-btn");
    if (!headersContainer || !addHeaderBtn) {
      console.error("Headers container or Add Header button not found.");
      return;
    }
    addHeaderBtn.addEventListener("click", () => {
      // Create a new header row.
      const headerRow = document.createElement("div");
      headerRow.className = "header-row";

      // Create the key input.
      const inputKey = document.createElement("input");
      inputKey.type = "text";
      inputKey.placeholder = "Header Key";

      // Create the value input.
      const inputValue = document.createElement("input");
      inputValue.type = "text";
      inputValue.placeholder = "Header Value";

      // Create a remove button to delete this header row.
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.className = "remove-header-btn";
      removeBtn.addEventListener("click", () => {
        headersContainer.removeChild(headerRow);
      });

      // Append inputs and button to the header row.
      headerRow.appendChild(inputKey);
      headerRow.appendChild(inputValue);
      headerRow.appendChild(removeBtn);
      // Append the header row to the headers container.
      headersContainer.appendChild(headerRow);
    });
  }

  /**
   * wireFormSubmission
   * ------------------
   * Wires the form submission event to perform validation, collect all data,
   * and send a POST request (using the fetch API) to invoke your server API.
   *
   * The function queries input elements reliably from the container.
   *
   * @param {HTMLFormElement} form - The upload form element.
   * @param {HTMLElement} container - The parent container that holds the dropdowns.
   * @param {string} tabName - "queue" or "kafka"
   */
  function wireFormSubmission(form, container, tabName) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Get the message display element inside the form.
      const messageDiv = form.querySelector(".message");
      if (!messageDiv) {
        console.error("Message container not found in form.");
        return;
      }
      // Clear previous messages.
      messageDiv.textContent = "";
      messageDiv.classList.remove("error", "success");

      // Retrieve primary and secondary dropdowns from the container.
      const primarySelect = container.querySelector(".primary-select");
      const secondarySelect = container.querySelector(".secondary-select");
      if (!primarySelect || !secondarySelect) {
        messageDiv.textContent = "Dropdowns not found.";
        messageDiv.classList.add("error");
        return;
      }
      // Ensure both dropdowns have a selected value.
      if (!primarySelect.value || !secondarySelect.value) {
        messageDiv.textContent =
          "Please select both a primary and a secondary item.";
        messageDiv.classList.add("error");
        return;
      }

      // Collect file input and manual content.
      const fileInput = form.querySelector(".file-input");
      const contentInput = form.querySelector(".content-input");
      const fileSelected =
        fileInput && fileInput.files && fileInput.files.length > 0;
      const manualContent = contentInput.value.trim();

      // Validate that both file and text content are not provided at the same time.
      if (fileSelected && manualContent.length > 0) {
        messageDiv.textContent =
          "Provide either a file or pasted content, not both.";
        messageDiv.classList.add("error");
        return;
      }
      // Validate that some content is provided.
      if (!fileSelected && manualContent.length === 0) {
        messageDiv.textContent = "No content provided.";
        messageDiv.classList.add("error");
        return;
      }

      // File validation: allow only certain types and extensions.
      if (fileSelected) {
        const allowedTypes = [
          "text/plain",
          "application/json",
          "application/xml",
          "text/xml",
        ];
        const fileType = fileInput.files[0].type;
        if (!allowedTypes.includes(fileType)) {
          messageDiv.textContent = "File type not allowed.";
          messageDiv.classList.add("error");
          return;
        }
        const fileName = fileInput.files[0].name.toLowerCase();
        if (
          !(
            fileName.endsWith(".txt") ||
            fileName.endsWith(".json") ||
            fileName.endsWith(".xml")
          )
        ) {
          messageDiv.textContent = "File extension not allowed.";
          messageDiv.classList.add("error");
          return;
        }
      }

      // Determine the newline format based on the checkbox.
      const newlineCheckbox = form.querySelector(".newline-check");
      const newlineFormat = newlineCheckbox.checked ? "windows" : "unix";

      // Build a FormData object with all data.
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

      // Send the data to the server with a POST request.
      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.text())
        .then((resultText) => {
          messageDiv.textContent = resultText;
          messageDiv.classList.add("success");
          // Reset the form.
          form.reset();
          // Clear headers in the container.
          const headersContainer = container.querySelector(".headers-container");
          if (headersContainer) headersContainer.innerHTML = "";
        })
        .catch((error) => {
          messageDiv.textContent = "Upload failed.";
          messageDiv.classList.add("error");
          console.error("Error during upload:", error);
        });
    });
  }

  /**
   * initializeTab
   * -------------
   * Reinitializes the content of a tab by clearing its content and appending a fresh clone
   * of the form template. This effectively resets all fields to their default state.
   *
   * @param {HTMLElement} tabElement - The container element for the tab.
   * @param {string} tabName - The tab name ("queue" or "kafka").
   */
  function initializeTab(tabElement, tabName) {
    // Clear existing content.
    tabElement.innerHTML = "";
    // Create a fresh form clone.
    const clone = createFormForTab(tabName);
    if (clone) {
      tabElement.appendChild(clone);
    }
  }

  // Retrieve tab container elements from the HTML.
  const tabQueue = document.getElementById("tabQueue");
  const tabKafka = document.getElementById("tabKafka");

  // Initialize both tabs with fresh form data.
  initializeTab(tabQueue, "queue");
  initializeTab(tabKafka, "kafka");

  // Wire tab switching buttons.
  const btnQueue = document.getElementById("btnQueue");
  const btnKafka = document.getElementById("btnKafka");

  // When the user clicks the QUEUE tab, reinitialize both tabs to ensure a full reset.
  btnQueue.addEventListener("click", () => {
    initializeTab(tabKafka, "kafka");
    initializeTab(tabQueue, "queue");
    btnQueue.classList.add("active");
    btnKafka.classList.remove("active");
    tabQueue.classList.add("active");
    tabKafka.classList.remove("active");
  });

  // When the user clicks the KAFKA tab, reinitialize both tabs similarly.
  btnKafka.addEventListener("click", () => {
    initializeTab(tabQueue, "queue");
    initializeTab(tabKafka, "kafka");
    btnKafka.classList.add("active");
    btnQueue.classList.remove("active");
    tabKafka.classList.add("active");
    tabQueue.classList.remove("active");
  });
});
