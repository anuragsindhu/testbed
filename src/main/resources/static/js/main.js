// File: js/main.js

import { FormModel } from './model.js';
import { FormView } from './view.js';
import { FormController } from './controller.js';
import { EventBus } from './eventBus.js';

document.addEventListener("DOMContentLoaded", () => {
  const model = new FormModel();
  const view = new FormView();
  const eventBus = new EventBus();
  const controller = new FormController(model, view, eventBus);

  // Global listener for a successful form submission.
  eventBus.on("formSubmitted", (data) => {
    console.log("Global Event: Form submitted successfully!", data);
    // Additional handling such as analytics or logging can be added here.
  });

  // Global listener for a failed form submission.
  eventBus.on("formSubmissionFailed", (data) => {
    console.error("Global Event: Form submission failed.", data);
  });

  controller.init();
});
