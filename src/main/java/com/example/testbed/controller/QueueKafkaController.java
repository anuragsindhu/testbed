package com.example.testbed.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class QueueKafkaController {

  private final ObjectMapper objectMapper = new ObjectMapper();

  /**
   * GET /api/qms
   * Returns a list of all queue managers.
   */
  @GetMapping("/qms")
  public List<String> getQueueManagers() {
    // Replace with your service call or DAO call
    return Arrays.asList("QM1", "QM2", "QM3");
  }

  /**
   * GET /api/{queueManager}/queues
   * Returns the list of queues for the given queue manager.
   *
   * @param queueManager the queue manager name
   */
  @GetMapping("/{queueManager}/queues")
  public List<String> getQueues(@PathVariable String queueManager) {
    // Replace with your actual business logic. Here we return dummy data.
    return Arrays.asList("Queue1", "Queue2", "Queue3");
  }

  /**
   * GET /api/kcs
   * Returns a list of Kafka clusters.
   */
  @GetMapping("/kcs")
  public List<String> getKafkaClusters() {
    return Arrays.asList("KC1", "KC2", "KC3");
  }

  /**
   * GET /api/{kafkaCluster}/topics
   * Returns the list of topics for the given Kafka cluster.
   *
   * @param kafkaCluster the Kafka cluster name
   */
  @GetMapping("/{kafkaCluster}/topics")
  public List<String> getKafkaTopics(@PathVariable String kafkaCluster) {
    return Arrays.asList("Topic1", "Topic2", "Topic3");
  }

  /**
   * POST /api/upload
   *
   * This endpoint accepts either a file or manual content along with options:
   * - newlineFormat: either "windows" or "unix"
   * - tab: "queue" or "kafka" (determines backend logic or routing)
   * - primary: for queue tab, this is the selected Queue Manager; for Kafka tab, the selected Kafka Cluster.
   * - secondary: for queue tab, the selected Queue; for Kafka tab, the selected Topic.
   * - headers: an optional JSON string representing a map of header key-value pairs.
   *
   * The logic validates that only one method of content is provided, validates the file (if uploaded)
   * for allowed MIME types and file extensions, converts newlines as specified, and parses the headers.
   */
  @PostMapping("/upload")
  public ResponseEntity<String> upload(
      @RequestParam(required = false) MultipartFile file,
      @RequestParam(required = false) String content,
      @RequestParam(defaultValue = "unix") String newlineFormat,
      @RequestParam String tab,
      @RequestParam String primary,
      @RequestParam String secondary,
      @RequestParam(required = false) String headers) {

    // Check if both file and manual content are provided.
    if (file != null && !file.isEmpty() && content != null && !content.trim().isEmpty()) {
      return ResponseEntity.badRequest().body("Please provide either a file or pasted content, not both.");
    }
    // Check if neither file nor content is provided.
    if ((file == null || file.isEmpty()) && (content == null || content.trim().isEmpty())) {
      return ResponseEntity.badRequest().body("No content provided. Please provide a file or pasted content.");
    }

    // If a file is provided, validate its type and extension.
    if (file != null && !file.isEmpty()) {
      String contentType = file.getContentType();
      if (!isAllowedContentType(contentType)) {
        return ResponseEntity.badRequest()
            .body("File type not allowed. Please upload only text, JSON, or XML files.");
      }
      String fileName = file.getOriginalFilename();
      if (!isAllowedExtension(fileName)) {
        return ResponseEntity.badRequest().body("File extension not allowed.");
      }
      try {
        // Read file content to use it as the message content.
        content = new String(file.getBytes(), StandardCharsets.UTF_8);
      } catch (IOException e) {
        return ResponseEntity.badRequest().body("Error reading file: " + e.getMessage());
      }
    }

    // Convert newlines as needed.
    if (content != null) {
      if ("windows".equalsIgnoreCase(newlineFormat)) {
        content = content.replaceAll("\n", "\r\n");
      } else {
        content = content.replaceAll("\r\n", "\n");
      }
    }

    // Parse the optional headers JSON into a Map.
    Map<String, String> headerMap = new HashMap<>();
    if (headers != null && !headers.trim().isEmpty()) {
      try {
        headerMap = objectMapper.readValue(headers, new TypeReference<Map<String, String>>() {});
      } catch (Exception e) {
        return ResponseEntity.badRequest().body("Invalid headers format.");
      }
    }

    // At this point, all validations have passed.
    // You can now process the message content: for example, send to a messaging system or persist it.
    // For this sample, we just return a success message along with the data received.

    String responseMsg = String.format(
        "Upload successful for %s tab.\nPrimary: %s\nSecondary: %s\nContent: %s\nHeaders: %s",
        tab, primary, secondary, content, headerMap.toString());

    return ResponseEntity.ok(responseMsg);
  }

  /**
   * Helper method to check whether the MIME type is allowed.
   */
  private boolean isAllowedContentType(String contentType) {
    return "text/plain".equalsIgnoreCase(contentType)
        || "application/json".equalsIgnoreCase(contentType)
        || "application/xml".equalsIgnoreCase(contentType)
        || "text/xml".equalsIgnoreCase(contentType);
  }

  /**
   * Helper method to check whether the file extension is allowed.
   */
  private boolean isAllowedExtension(String filename) {
    if (filename == null) return false;
    String lowerFilename = filename.toLowerCase();
    return lowerFilename.endsWith(".txt")
        || lowerFilename.endsWith(".json")
        || lowerFilename.endsWith(".xml");
  }
}
