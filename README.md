# Queue and Kafka Interface

A web-based application that provides a unified user interface for uploading messages to either a message queue system (using a queue manager and queue) or a Kafka system (using a Kafka cluster and topic). This application demonstrates a modern, responsive interface built with HTML5, CSS3 (using Flexbox), and JavaScript, integrated with a Java Spring Boot back end.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Application Structure](#application-structure)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Development Notes](#development-notes)

---

## Features

- **Dual-Tab Interface:**  
  Two tabs are provided: one for QUEUE and another for KAFKA operations. Switching tabs resets all form inputs.

- **Dynamic Dropdowns:**  
  Two dropdown list boxes in each tab allow selection of primary and secondary items – for example, a Queue Manager and its Queues or a Kafka Cluster and its Topics.  
  The secondary list is dynamically populated based on the selected value of the primary list by calling REST APIs.

- **Message Upload:**  
  Users can either upload a file (with allowed extensions: `.txt`, `.json`, or `.xml`) or paste message content manually.  
  The form validates that only one content method is used and performs file type/extension validation.

- **Optional Headers:**  
  Users may add key-value header pairs dynamically using an "Add Header" button. Each header row can be removed as needed.

- **Responsive Layout:**  
  The application uses Flexbox CSS to create a modern, responsive interface that adapts well to various screen sizes.

- **Java Spring Boot Back End:**  
  The REST API endpoints (e.g., `/api/qms`, `/api/{queueManager}/queues`, `/api/kcs`, `/api/{kafkaCluster}/topics` and `/api/upload`) provide the data for the dropdowns and process the upload submission.

---

## Architecture

### User Interface

```
     +------------------------------------------------+
     |                     User                       |
     |  (Interacts with UI: clicks, inputs, etc.)     |
     +-------------------------+----------------------+
                               |
                               v
     +------------------------------------------------+
     |                    View                        |
     | (Renders UI, clones form template, implements   |
     |  event delegation for dynamic elements, and    |
     |  updates the DOM with ARIA/accessibility props)|
     +-------------------------+----------------------+
                               |
                               v
     +------------------------------------------------+
     |                 Controller                     |<---+
     | (Handles user events, validates input, wires   |    |
     |  View events to Model actions, manages state,   |    |  Pub/Sub (Event Bus)
     |  and emits global events to any subscribers)    |    |
     +-------------------------+----------------------+    |
                               |                           |
                               v                           |
     +------------------------------------------------+    |
     |                   Model                        |    |
     | (Manages data and API calls; delegates HTTP     |    |
     | requests to the APIService module)              |    |
     +-------------------------+----------------------+    |
                               |                           |
                               v                           |
     +------------------------------------------------+    |
     |                APIService                      |    |
     | (Encapsulates fetch(), implements error retry,   |    |
     |  and centralizes HTTP logic for all API calls)   |    |
     +------------------------------------------------+    |
                                                           |
                                                           +<-- Global listeners on the Event Bus

```

Notice how:

• The **User** interacts with the **View** (which renders the UI from templates and uses event delegation).  
• The **Controller** listens to events coming from the View (including via the Event Bus) and coordinates the workflow.  
• The **Controller** calls the **Model** (the data layer), which in turn uses the **APIService** to perform HTTP requests (with error retries and standardized logic).  
• The **Event Bus** is used by the Controller to publish cross-cutting events (like form submission successes or failures) that any part of the app can subscribe to.

### Flow Summary

1. **User Interaction:**
    - The user clicks or inputs data via the View (UI elements).

2. **View Layer:**
    - The View captures these events (like tab clicks, form submission, header row addition/removal) and updates the DOM accordingly.
    - It uses template literals and event delegation to handle dynamic elements.

3. **Controller Coordination:**
    - The Controller picks up these events, performs validation, and directs the Model to fetch data or submit form data.
    - It also manages application state (e.g., which tab is active) and updates the URL hash for routing.
    - The Controller emits global events using the Event Bus so other parts of the application (or external logging/analytics modules) can subscribe.

4. **Model & API Calls:**
    - The Model receives request commands from the Controller and makes API calls using the centrally managed APIService.
    - The APIService sends HTTP requests (using fetch), handles errors with retries, and returns the results back up to the Model.

5. **Event Bus:**
    - The Event Bus decouples parts of the system; the Controller emits events such as “formSubmitted” and “formSubmissionFailed” after processing.
    - Any component listening on the Event Bus can react accordingly.

## Technologies Used

- **Frontend:**
    - HTML5
    - CSS3 (Flexbox-based layout)
    - JavaScript (Vanilla ES6+)

- **Backend:**
    - Java with Spring Boot
    - RESTful web services

- **Testing:**
    - JUnit 5 and AssertJ for unit testing (for backend controllers)
    - Spring Boot Test with MockMvc for integration testing

---

## Application Structure

```
QueueKafkaApp/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/demo/
│   │   │       ├── controller/
│   │   │       │   └── QueueKafkaController.java
│   │   │       └── ... (other packages)
│   │   └── resources/
│   │       └── static/
│   │           ├── index.html          # Main HTML file with template
│   │           ├── css/
│   │           │   └── style.css       # Styles referencing Flexbox
│   │           └── js/
│   │               └── main.js        // Application bootstrapper
│   │               └── apiService.js  // Centralized HTTP requests with error handling
│   │               └── eventBus.js    // Global pub/sub system
│   │               └── model.js       // Data layer; uses apiService for API calls
│   │               └── view.js        // UI rendering, templating, and event delegation
│   │               └── controller.js  // Orchestrates interactions; handles routing and state
│   └── test/
│       └── java/
│           └── com/example/demo/
│               ├── controller/
│               │   ├── QueueKafkaControllerTest.java
│               ├── integration/
│               │   ├── QueueKafkaControllerTest.java
├── pom.xml (or build.gradle)
└── README.md
```

---

## Installation and Setup

### Prerequisites

- **JDK 17** or later installed
- **Maven** (or Gradle) installed for building the application
- A modern web browser (e.g., Chrome, Firefox) for testing the user interface

### Building the Application

1. **Clone the repository:**

   ```bash
   git clone https://github.com/anuragsindhu/testbed.git
   cd testbed
   ```

2. **Build with Maven:**

   ```bash
   mvn clean package
   ```

3. **Run the Application:**

   The application is a Spring Boot app. You can run it via Maven:

   ```bash
   mvn spring-boot:run
   ```

   Alternatively, run the packaged jar:

   ```bash
   java -jar target/testbed-0.0.1-SNAPSHOT.jar
   ```

4. **Open the Application in a Browser:**

   Once running (by default on port 8080), open your browser and navigate to:

   ```
   http://localhost:8080/index.html
   ```

---

## Usage

1. **Switching Tabs:**  
   By default, the QUEUE tab appears active. Click the "KAFKA" button to switch to the Kafka interface. Each tab switch reinitializes (resets) the form.

2. **Selecting Dropdown Options:**  
   The first dropdown in each tab is dynamically populated via a REST API call:
    - For QUEUE it retrieves the list of queue managers (`/api/qms`).
    - For KAFKA it retrieves the Kafka clusters (`/api/kcs`).

   Once you select a primary value, the secondary dropdown is populated:
    - For QUEUE, selecting a queue manager causes the queues to load.
    - For KAFKA, selecting a Kafka cluster loads its topics.

3. **Uploading Data:**  
   Fill out the form by either selecting a file (ensuring the file has an allowed extension and type) or pasting content into the textarea. You can optionally tick the "Use Windows New Line Format" checkbox.  
   Use the “Add Header” button to insert any additional header key-value pairs.  
   Finally, click “Upload” to submit the form. Results (success or error messages) will be displayed inline.

---

## API Endpoints

Your back end supports the following endpoints:

- **GET** `/api/qms`  
  Returns a list of queue managers.

- **GET** `/api/{queueManager}/queues`  
  Returns queues for the specified queue manager.

- **GET** `/api/kcs`  
  Returns a list of Kafka clusters.

- **GET** `/api/{kafkaCluster}/topics`  
  Returns topics for the specified Kafka cluster.

- **POST** `/api/upload`  
  Accepts a multipart request with either a file or pasted content, newline format preference, the selected tab ("queue" or "kafka"), the primary and secondary selections, and an optional headers JSON.  
  The endpoint validates the input and returns a success or error message.

---

## Testing

### Unit Tests

The unit tests (using JUnit and AssertJ) directly call methods of the `QueueKafkaController` to verify that REST endpoints return the expected dummy data and that the upload endpoint handles validation scenarios correctly.

- To run unit tests with Maven:

  ```bash
  mvn test
  ```

### Integration Tests

Integration tests use Spring Boot’s testing framework with MockMvc to simulate real HTTP requests. These tests validate that the endpoints respond correctly according to the specification.

- Integration tests also run automatically with:

  ```bash
  mvn test
  ```

---

## Development Notes

- **Frontend:**
    - The UI logic is bundled into `main.js`, which clones an HTML template (`<template>` element) and injects it into the tab sections.
    - The application uses Flexbox in `style.css` for a responsive layout.
    - Tab switching resets the form completely by reinitializing the content of each tab container.

- **Backend:**
    - The `QueueKafkaController` handles REST endpoints. Dummy data is used here for illustration; replace with your data source as needed.
    - File type and extension validations are performed in the `/api/upload` endpoint.

- **Modularity:**  
  While current UI helper functions live in **main.js**, you can refactor common methods into separate modules if required.

---
