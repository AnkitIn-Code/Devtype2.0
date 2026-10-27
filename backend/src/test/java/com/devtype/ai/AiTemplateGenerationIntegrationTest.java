package com.devtype.ai;

import com.devtype.ai.client.FireworksAiClient;
import com.devtype.ai.config.FireworksProperties;
import com.devtype.ai.dto.GenerateTemplateRequest;
import com.devtype.ai.dto.SaveGeneratedTemplateRequest;
import com.devtype.ai.exception.AiServiceException;
import com.devtype.ai.service.AiRateLimiterService;
import com.devtype.auth.service.JwtService;
import com.devtype.practice.PracticeSession;
import com.devtype.practice.PracticeSessionRepository;
import com.devtype.practice.dto.CompletePracticeSessionRequest;
import com.devtype.practice.dto.StartPracticeSessionRequest;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import com.devtype.user.UserStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiTemplateGenerationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PracticeTemplateRepository practiceTemplateRepository;

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private FireworksProperties fireworksProperties;

    @Autowired
    private AiRateLimiterService aiRateLimiterService;

    @MockBean
    private FireworksAiClient fireworksAiClient;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    private static final String SAMPLE_FIREWORKS_JSON = """
            {
              "title": "Two Sum Algorithm",
              "description": "Find indices of the two numbers that add up to target.",
              "language": "Java",
              "difficulty": "intermediate",
              "topic": "arrays",
              "instructions": "Type the hash map complement lookup cleanly.",
              "code": "public int[] twoSum(int[] nums, int target) {\\n    Map<Integer, Integer> map = new HashMap<>();\\n    for (int i = 0; i < nums.length; i++) {\\n        int comp = target - nums[i];\\n        if (map.containsKey(comp)) return new int[]{map.get(comp), i};\\n        map.put(nums[i], i);\\n    }\\n    return new int[]{};\\n}"
            }
            """;

    @BeforeEach
    void setUp() {
        practiceSessionRepository.deleteAll();
        practiceTemplateRepository.deleteAll();
        userRepository.deleteAll();

        // 1. User A
        userA = new User();
        userA.setUsername("alice_coder");
        userA.setEmail("alice@devtype.io");
        userA.setPasswordHash("hash_alice");
        userA.setDisplayName("Alice Coder");
        userA.setRole(UserRole.USER);
        userA.setStatus(UserStatus.ACTIVE);
        userA.setAccountType(AccountType.STANDARD);
        userA = userRepository.saveAndFlush(userA);
        tokenA = jwtService.generateToken(userA);

        // 2. User B
        userB = new User();
        userB.setUsername("bob_coder");
        userB.setEmail("bob@devtype.io");
        userB.setPasswordHash("hash_bob");
        userB.setDisplayName("Bob Coder");
        userB.setRole(UserRole.USER);
        userB.setStatus(UserStatus.ACTIVE);
        userB.setAccountType(AccountType.STANDARD);
        userB = userRepository.saveAndFlush(userB);
        tokenB = jwtService.generateToken(userB);

        // Clear in-memory rate limiter for test isolation
        aiRateLimiterService.reset();

        // Ensure test API key is present
        fireworksProperties.setApiKey("test-fw-key-secret-12345");
    }

    @Test
    @DisplayName("Generate template requires authentication")
    void generateTemplate_unauthenticated_returns401() throws Exception {
        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "java", "intermediate", "arrays", "algorithm", "balanced", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Generate template with missing server API key returns 503")
    void generateTemplate_missingApiKey_returns503() throws Exception {
        fireworksProperties.setApiKey("");

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "java", "intermediate", "arrays", "algorithm", "balanced", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message", containsString("not configured")));
    }

    @Test
    @DisplayName("Generate template with invalid inputs returns 400 validation error")
    void generateTemplate_invalidInput_returns400() throws Exception {
        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "brainfuck", "impossible", "arrays", "algorithm", "balanced", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Unsupported programming language")));
    }

    @Test
    @DisplayName("Successful AI generation returns structured response and never leaks API key")
    void generateTemplate_success_returnsStructuredResponse() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenReturn(SAMPLE_FIREWORKS_JSON);

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "java", "intermediate", "arrays", "algorithm", "balanced", "Include hash map lookup"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("Two Sum Algorithm")))
                .andExpect(jsonPath("$.data.language", is("Java")))
                .andExpect(jsonPath("$.data.difficulty", equalToIgnoringCase("intermediate")))
                .andExpect(jsonPath("$.data.topic", is("arrays")))
                .andExpect(jsonPath("$.data.code", containsString("public int[] twoSum")))
                .andExpect(jsonPath("$.data.lineCount", greaterThan(0)))
                .andExpect(jsonPath("$.data.characterCount", greaterThan(0)))
                .andExpect(jsonPath("$.data.estimatedDurationSeconds", greaterThan(0)))
                .andReturn();

        // Verify API key is NOT leaked anywhere in response body
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).doesNotContain("test-fw-key-secret-12345");
        assertThat(responseBody).doesNotContain("Bearer");
    }

    @Test
    @DisplayName("Generated code strips markdown code fences automatically")
    void generateTemplate_stripsMarkdownFences() throws Exception {
        String fencedJson = """
                {
                  "title": "Python QuickSort",
                  "description": "Recursive divide-and-conquer sorting algorithm.",
                  "language": "python",
                  "difficulty": "intermediate",
                  "topic": "recursion",
                  "instructions": "Type the partition function.",
                  "code": "```python\\ndef quicksort(arr):\\n    if len(arr) <= 1:\\n        return arr\\n    pivot = arr[len(arr) // 2]\\n    return quicksort([x for x in arr if x < pivot]) + [x for x in arr if x == pivot] + quicksort([x for x in arr if x > pivot])\\n```"
                }
                """;
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenReturn(fencedJson);

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "python", "intermediate", "recursion", "algorithm", "balanced", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code", not(containsString("```python"))))
                .andExpect(jsonPath("$.data.code", not(containsString("```"))))
                .andExpect(jsonPath("$.data.code", containsString("def quicksort(arr):")));
    }

    @Test
    @DisplayName("Upstream Fireworks 401 returns 503 without leaking provider secrets")
    void generateTemplate_providerAuthError_returns503() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenThrow(new AiServiceException("AI provider authentication failed. Check API key.", HttpStatus.SERVICE_UNAVAILABLE));

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "javascript", "beginner", "strings", "function", "compact", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message", containsString("authentication failed")));
    }

    @Test
    @DisplayName("Upstream Fireworks rate limit returns 429")
    void generateTemplate_providerRateLimit_returns429() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenThrow(new AiServiceException("AI provider rate limit reached. Please wait a moment.", HttpStatus.TOO_MANY_REQUESTS));

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "javascript", "beginner", "strings", "function", "compact", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("rate limit reached")));
    }

    @Test
    @DisplayName("Upstream Fireworks timeout returns 504 Gateway Timeout")
    void generateTemplate_providerTimeout_returns504() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenThrow(new AiServiceException("AI generation request timed out.", HttpStatus.GATEWAY_TIMEOUT));

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "cpp", "advanced", "graphs", "algorithm", "deep", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.message", containsString("timed out")));
    }

    @Test
    @DisplayName("Malformed JSON from model returns 502 Bad Gateway")
    void generateTemplate_malformedModelOutput_returns502() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenReturn("Sorry, I am not able to generate this code.");

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "java", "beginner", "loops", "snippet", "compact", null
        );

        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message", containsString("could not be parsed as valid JSON")));
    }

    @Test
    @DisplayName("Per-user hourly rate limiter blocks excessive generation requests")
    void generateTemplate_perUserRateLimitingEnforced() throws Exception {
        when(fireworksAiClient.generateChatCompletion(anyString(), anyString()))
                .thenReturn(SAMPLE_FIREWORKS_JSON);

        GenerateTemplateRequest request = new GenerateTemplateRequest(
                "java", "intermediate", "arrays", "algorithm", "balanced", null
        );

        int limit = fireworksProperties.getRateLimitPerHour();
        // Consume all allowed slots
        for (int i = 0; i < limit; i++) {
            mockMvc.perform(post("/api/v1/ai/templates/generate")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        // Exceeded request must be rejected with 429
        mockMvc.perform(post("/api/v1/ai/templates/generate")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Hourly AI template generation limit reached")));
    }

    @Test
    @DisplayName("Get Quota endpoint reports accurate used and remaining capacity")
    void getQuota_reportsRemainingUsage() throws Exception {
        mockMvc.perform(get("/api/v1/ai/quota")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hourlyLimit", is(fireworksProperties.getRateLimitPerHour())))
                .andExpect(jsonPath("$.data.usedInLastHour", is(0)))
                .andExpect(jsonPath("$.data.remainingInLastHour", is(fireworksProperties.getRateLimitPerHour())));
    }

    @Test
    @DisplayName("Save generated template assigns ownership and prevents cross-user visibility")
    void saveGeneratedTemplate_enforcesOwnershipAndVisibility() throws Exception {
        SaveGeneratedTemplateRequest saveRequest = new SaveGeneratedTemplateRequest(
                "My Custom AI Algorithm",
                "Private practice template.",
                "Java",
                "intermediate",
                "Algorithms",
                "public class MyAlgo { public void run() {} }",
                60
        );

        // User A saves the template
        mockMvc.perform(post("/api/v1/ai/templates/save")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title", is("My Custom AI Algorithm")))
                .andExpect(jsonPath("$.data.aiGenerated", is(true)))
                .andExpect(jsonPath("$.data.authorUsername", is("alice_coder")));

        // User A can retrieve it
        mockMvc.perform(get("/api/v1/ai/templates/saved")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("My Custom AI Algorithm")));

        // User B cannot see User A's private generated templates
        mockMvc.perform(get("/api/v1/ai/templates/saved")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    @DisplayName("Practice session starts directly with custom AI snippet and records completion metrics")
    void immediatePractice_withCustomAiContent_tracksSessionSuccessfully() throws Exception {
        StartPracticeSessionRequest startRequest = new StartPracticeSessionRequest();
        startRequest.setCustomTitle("AI Synthesized Drill");
        startRequest.setCustomLanguage("Java");
        startRequest.setCustomDifficulty("INTERMEDIATE");
        startRequest.setCustomContent("public class Drill { public static void main(String[] args) {} }");

        MvcResult startResult = mockMvc.perform(post("/api/v1/practice-sessions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
                .andReturn();

        JsonNode root = objectMapper.readTree(startResult.getResponse().getContentAsString());
        Long sessionId = root.path("data").path("id").asLong();

        // Complete the session
        CompletePracticeSessionRequest completeRequest = new CompletePracticeSessionRequest();
        completeRequest.setTotalKeystrokes(62);
        completeRequest.setCorrectCharacters(60);
        completeRequest.setIncorrectCharacters(2);
        completeRequest.setErrorCount(2);
        completeRequest.setElapsedMs(12000L); // 12 seconds

        mockMvc.perform(post("/api/v1/practice-sessions/" + sessionId + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.netWpm", greaterThan(0.0)))
                .andExpect(jsonPath("$.data.accuracyPercent", greaterThan(0.0)));

        PracticeSession saved = practiceSessionRepository.findById(sessionId).orElseThrow();
        assertThat(saved.getTemplate()).isNull(); // No FK to catalog needed
        assertThat(saved.getNetWpm()).isNotNull();
    }
}
