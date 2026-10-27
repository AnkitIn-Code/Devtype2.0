package com.devtype.ai.client;

import com.devtype.ai.config.FireworksProperties;
import com.devtype.ai.exception.AiServiceException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Dedicated backend HTTP client for communicating with Fireworks AI.
 * Encapsulates authentication, payload serialization, timeout policies,
 * and upstream error translation for the DeepSeek V4 Pro model.
 */
@Component
public class FireworksAiClient {

    private static final Logger log = LoggerFactory.getLogger(FireworksAiClient.class);

    private final FireworksProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public FireworksAiClient(FireworksProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        // Configure Java 21 HttpClient with connection and read timeouts
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Sends a chat completion prompt to the Fireworks AI API and returns the raw content string.
     *
     * @param systemPrompt System instructions enforcing JSON schema output
     * @param userPrompt User parameters and exercise requirements
     * @return Raw output string produced by DeepSeek V4 Pro
     */
    public String generateChatCompletion(String systemPrompt, String userPrompt) {
        String apiKey = properties.getApiKey();
        if (apiKey == null || apiKey.trim().isBlank()) {
            log.warn("Fireworks AI API key is not configured. Rejecting AI generation request.");
            throw new AiServiceException(
                    "Fireworks AI API key is not configured on the backend server. Please configure FIREWORKS_API_KEY in server environment.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        String model = properties.getModel();
        log.info("Dispatching code template generation to Fireworks AI model: {}", model);

        Map<String, Object> payload = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.6,
                "max_tokens", 1500,
                "response_format", Map.of("type", "json_object")
        );

        try {
            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new AiServiceException("Received empty response body from Fireworks AI.", HttpStatus.BAD_GATEWAY);
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new AiServiceException("AI model returned no generation choices.", HttpStatus.BAD_GATEWAY);
            }

            String content = choices.get(0).path("message").path("content").asText(null);
            if (content == null || content.isBlank()) {
                throw new AiServiceException("AI model returned empty message content.", HttpStatus.BAD_GATEWAY);
            }

            return content;

        } catch (HttpClientErrorException.Unauthorized ex) {
            log.error("Fireworks AI rejected request with 401 Unauthorized. Key invalid or revoked.");
            throw new AiServiceException(
                    "AI provider authentication failed. Please verify the FIREWORKS_API_KEY configuration.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        } catch (HttpClientErrorException.TooManyRequests ex) {
            log.warn("Fireworks AI upstream rate limit exceeded (429).");
            throw new AiServiceException(
                    "AI provider rate limit reached. Please wait a moment before trying again.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode().value() == 402) {
                log.error("Fireworks AI rejected request with 402 Payment Required. Credits or balance exhausted.");
                throw new AiServiceException(
                        "AI provider quota or credits exhausted. Please contact platform administrators.",
                        HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            log.error("Fireworks AI client error {}: {}", ex.getStatusCode(), ex.getStatusText());
            throw new AiServiceException(
                    "AI generation service rejected the request (" + ex.getStatusCode().value() + "). Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        } catch (HttpServerErrorException ex) {
            log.error("Fireworks AI returned HTTP status {}: {}", ex.getStatusCode(), ex.getStatusText());
            throw new AiServiceException(
                    "AI generation service is temporarily unavailable (" + ex.getStatusCode().value() + "). Please try again later.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        } catch (ResourceAccessException ex) {
            log.error("Fireworks AI connection or read timeout: {}", ex.getMessage());
            throw new AiServiceException(
                    "AI generation request timed out. Please try again with a shorter length or simpler topic.",
                    HttpStatus.GATEWAY_TIMEOUT
            );
        } catch (AiServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error during Fireworks AI communication: {}", ex.getMessage(), ex);
            throw new AiServiceException(
                    "An unexpected error occurred during AI template generation. Please try again.",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
