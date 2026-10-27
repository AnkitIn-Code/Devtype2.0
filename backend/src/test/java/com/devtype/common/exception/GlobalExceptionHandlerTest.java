package com.devtype.common.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(GlobalExceptionHandlerTest.TestErrorController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Validation failure returns HTTP 400 with structured validation errors")
    void testValidationErrorHandling() throws Exception {
        TestValidationRequest invalidRequest = new TestValidationRequest("", null);

        mockMvc.perform(post("/api/test/errors/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsString("Validation failed")))
                .andExpect(jsonPath("$.path", is("/api/test/errors/validation")))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.validationErrors", hasSize(2)))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("ResourceNotFoundException returns HTTP 404 with standard ErrorResponse")
    void testResourceNotFoundHandling() throws Exception {
        mockMvc.perform(get("/api/test/errors/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Practice session not found with id: '999'")))
                .andExpect(jsonPath("$.path", is("/api/test/errors/not-found")))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @WithMockUser
    @DisplayName("Non-existent URL triggers 404 NoResourceFoundException handling")
    void testUnmappedEndpointHandling() throws Exception {
        mockMvc.perform(get("/api/v1/unknown-endpoint-does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Requested endpoint or resource was not found")));
    }

    @Test
    @DisplayName("Unexpected internal exception returns HTTP 500 without leaking stack traces or internal details")
    void testUnhandledExceptionSanitization() throws Exception {
        mockMvc.perform(get("/api/test/errors/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status", is(500)))
                .andExpect(jsonPath("$.error", is("Internal Server Error")))
                .andExpect(jsonPath("$.message", is("An unexpected error occurred. Please contact support if the issue persists.")))
                .andExpect(jsonPath("$.path", is("/api/test/errors/unexpected")))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist())
                .andExpect(jsonPath("$.exception").doesNotExist())
                .andExpect(jsonPath("$.database").doesNotExist());
    }

    @Test
    @DisplayName("Malformed JSON returns HTTP 400 with unreadable payload message")
    void testMalformedJsonHandling() throws Exception {
        mockMvc.perform(post("/api/test/errors/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json-payload"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", is("Malformed or unreadable request payload")));
    }

    // Test request POJO for validation testing
    static class TestValidationRequest {
        @NotBlank(message = "Username cannot be blank")
        private String username;

        @NotNull(message = "Age is required")
        private Integer age;

        public TestValidationRequest() {
        }

        public TestValidationRequest(String username, Integer age) {
            this.username = username;
            this.age = age;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public Integer getAge() {
            return age;
        }

        public void setAge(Integer age) {
            this.age = age;
        }
    }

    @RestController
    @RequestMapping("/api/test/errors")
    static class TestErrorController {

        @PostMapping("/validation")
        public String handleValidation(@Valid @RequestBody TestValidationRequest request) {
            return "ok";
        }

        @GetMapping("/not-found")
        public void handleNotFound() {
            throw new ResourceNotFoundException("Practice session", "id", 999L);
        }

        @GetMapping("/unexpected")
        public void handleUnexpected() {
            throw new RuntimeException("Simulated unexpected database failure with sensitive connection string: postgres://admin:secret@neon.tech/db");
        }
    }
}
