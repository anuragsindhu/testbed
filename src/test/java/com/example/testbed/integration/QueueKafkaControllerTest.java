package com.example.testbed.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
public class QueueKafkaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  // Test GET endpoints

  @Test
  public void testGetQueueManagers() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/qms"))
        .andReturn();
    String content = result.getResponse().getContentAsString();
    assertThat(content).contains("QM1", "QM2", "QM3");
  }

  @Test
  public void testGetQueues() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/QM1/queues"))
        .andReturn();
    String content = result.getResponse().getContentAsString();
    assertThat(content).contains("Queue1", "Queue2", "Queue3");
  }

  @Test
  public void testGetKafkaClusters() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/kcs"))
        .andReturn();
    String content = result.getResponse().getContentAsString();
    assertThat(content).contains("KC1", "KC2", "KC3");
  }

  @Test
  public void testGetKafkaTopics() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/KC1/topics"))
        .andReturn();
    String content = result.getResponse().getContentAsString();
    assertThat(content).contains("Topic1", "Topic2", "Topic3");
  }

  // Test POST /api/upload endpoint

  // Test: Both file and manual content provided should return error.
  @Test
  public void testUploadWithBothFileAndContentReturnsError() throws Exception {
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "File content".getBytes());
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .file(file)
            .param("content", "Manual content")
            .param("newlineFormat", "unix")
            .param("tab", "queue")
            .param("primary", "QM1")
            .param("secondary", "Queue1"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("Either a file or pasted content");
  }

  // Test: No content provided.
  @Test
  public void testUploadWithNoContentReturnsError() throws Exception {
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .param("newlineFormat", "unix")
            .param("tab", "kafka")
            .param("primary", "KC1")
            .param("secondary", "Topic1"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("No content provided");
  }

  // Test: Upload with invalid file type.
  @Test
  public void testUploadWithInvalidFileTypeReturnsError() throws Exception {
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "image/png", "Content".getBytes());
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .file(file)
            .param("newlineFormat", "unix")
            .param("tab", "queue")
            .param("primary", "QM1")
            .param("secondary", "Queue1"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("File type not allowed");
  }

  // Test: Valid manual content submission.
  @Test
  public void testUploadWithManualContentReturnsSuccess() throws Exception {
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .param("content", "This is manual content")
            .param("newlineFormat", "unix")
            .param("tab", "kafka")
            .param("primary", "KC1")
            .param("secondary", "Topic1")
            .param("headers", "{\"headerKey\":\"headerValue\"}"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("Upload successful");
    assertThat(response).contains("This is manual content");
    assertThat(response).contains("headerKey=headerValue");
  }

  // Test: Valid file submission.
  @Test
  public void testUploadWithValidFileReturnsSuccess() throws Exception {
    MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "File content".getBytes());
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .file(file)
            .param("newlineFormat", "windows")
            .param("tab", "queue")
            .param("primary", "QM1")
            .param("secondary", "Queue1")
            .param("headers", "{\"fileHeader\":\"fileValue\"}"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("Upload successful");
    assertThat(response).contains("File content");
    assertThat(response).contains("fileHeader=fileValue");
  }

  // Test: Invalid headers JSON.
  @Test
  public void testUploadWithInvalidHeadersReturnsError() throws Exception {
    MvcResult result = mockMvc.perform(multipart("/api/upload")
            .param("content", "Content")
            .param("newlineFormat", "unix")
            .param("tab", "queue")
            .param("primary", "QM1")
            .param("secondary", "Queue1")
            .param("headers", "invalidjson"))
        .andReturn();
    String response = result.getResponse().getContentAsString();
    assertThat(response).containsIgnoringCase("Invalid headers format");
  }
}
