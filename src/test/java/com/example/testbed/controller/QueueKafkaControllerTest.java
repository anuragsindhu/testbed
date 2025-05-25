package com.example.testbed.controller;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

public class QueueKafkaControllerTest {

  private final QueueKafkaController controller = new QueueKafkaController();

  // --- GET Endpoints ---

  @Test
  public void testGetQueueManagers() {
    var qms = controller.getQueueManagers();
    assertThat(qms).containsExactly("QM1", "QM2", "QM3");
  }

  @Test
  public void testGetQueues() {
    var queues = controller.getQueues("QM1");
    assertThat(queues).containsExactly("Queue1", "Queue2", "Queue3");
  }

  @Test
  public void testGetKafkaClusters() {
    var kcs = controller.getKafkaClusters();
    assertThat(kcs).containsExactly("KC1", "KC2", "KC3");
  }

  @Test
  public void testGetKafkaTopics() {
    var topics = controller.getKafkaTopics("KC1");
    assertThat(topics).containsExactly("Topic1", "Topic2", "Topic3");
  }

  // --- POST /api/upload Tests ---

  // Test: Both file and manual content provided.
  @Test
  public void testUploadWithBothFileAndContentReturnsError() {
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "File content".getBytes());
    ResponseEntity<String> response = controller.upload(file, "Manual content", "unix", "queue", "QM1", "Queue1", null);
    assertThat(response.getStatusCodeValue()).isEqualTo(400);
    assertThat(response.getBody()).contains("not both");
  }

  // Test: Neither file nor manual content provided.
  @Test
  public void testUploadWithNoContentReturnsError() {
    ResponseEntity<String> response = controller.upload(null, "", "unix", "kafka", "KC1", "Topic1", null);
    assertThat(response.getStatusCodeValue()).isEqualTo(400);
    assertThat(response.getBody()).contains("No content provided");
  }

  // Test: File with invalid MIME type.
  @Test
  public void testUploadWithInvalidFileTypeReturnsError() {
    // Using MIME type "image/png" which is not allowed.
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "image/png", "Some content".getBytes());
    ResponseEntity<String> response = controller.upload(file, null, "unix", "queue", "QM1", "Queue1", null);
    assertThat(response.getStatusCodeValue()).isEqualTo(400);
    assertThat(response.getBody()).contains("File type not allowed");
  }

  // Test: File with invalid extension.
  @Test
  public void testUploadWithInvalidFileExtensionReturnsError() {
    MockMultipartFile file = new MockMultipartFile("file", "test.png", "text/plain", "Content".getBytes());
    ResponseEntity<String> response = controller.upload(file, null, "unix", "queue", "QM1", "Queue1", null);
    assertThat(response.getStatusCodeValue()).isEqualTo(400);
    assertThat(response.getBody()).contains("File extension not allowed");
  }

  // Test: Valid manual content submission.
  @Test
  public void testUploadWithManualContentReturnsSuccess() {
    ResponseEntity<String> response = controller.upload(null, "This is manual content", "unix", "kafka", "KC1", "Topic1", "{\"x\":\"y\"}");
    assertThat(response.getStatusCodeValue()).isEqualTo(200);
    assertThat(response.getBody()).contains("Upload successful");
    assertThat(response.getBody()).contains("This is manual content");
    assertThat(response.getBody()).contains("x=y");
  }

  // Test: Valid file submission.
  @Test
  public void testUploadWithValidFileReturnsSuccess() {
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "File content".getBytes());
    ResponseEntity<String> response = controller.upload(file, null, "windows", "queue", "QM1", "Queue1", "{\"header1\":\"value1\"}");
    assertThat(response.getStatusCodeValue()).isEqualTo(200);
    assertThat(response.getBody()).contains("Upload successful");
    assertThat(response.getBody()).contains("File content");
    assertThat(response.getBody()).contains("header1=value1");
  }

  // Test: Invalid headers JSON.
  @Test
  public void testUploadWithInvalidHeadersReturnsError() {
    ResponseEntity<String> response = controller.upload(null, "Content", "unix", "queue", "QM1", "Queue1", "not a json");
    assertThat(response.getStatusCodeValue()).isEqualTo(400);
    assertThat(response.getBody()).contains("Invalid headers format");
  }
}
