package com.devtype.ai.service;

import com.devtype.ai.client.FireworksAiClient;
import com.devtype.ai.config.FireworksProperties;
import com.devtype.ai.dto.AiQuotaResponse;
import com.devtype.ai.dto.GenerateTemplateRequest;
import com.devtype.ai.dto.GeneratedTemplateResponse;
import com.devtype.ai.dto.SaveGeneratedTemplateRequest;
import com.devtype.ai.exception.AiServiceException;
import com.devtype.common.exception.ApiException;
import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;
import com.devtype.template.PracticeTemplateRepository;
import com.devtype.template.dto.PracticeTemplateDetailResponse;
import com.devtype.template.dto.PracticeTemplateSummaryResponse;
import com.devtype.user.User;
import com.devtype.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Orchestrator for AI code template generation using Fireworks AI and DeepSeek V4 Pro.
 * Enforces per-user generation quotas, validates user input, constructs structured prompts,
 * parses and sanitizes model output, and integrates with the practice template persistence layer.
 */
@Service
public class AiTemplateGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(AiTemplateGeneratorService.class);

    private static final Set<String> ALLOWED_LANGUAGES = Set.of(
            "c++", "cpp", "c", "java", "python", "javascript", "typescript",
            "go", "rust", "sql", "c#", "csharp", "ruby", "kotlin", "swift", "php", "html", "css"
    );

    private static final Pattern CODE_FENCE_PATTERN = Pattern.compile("^```(?:[a-zA-Z0-9_-]+)?\\r?\\n|\\r?\\n```$");

    private final FireworksProperties properties;
    private final FireworksAiClient fireworksAiClient;
    private final AiRateLimiterService aiRateLimiterService;
    private final PracticeTemplateRepository practiceTemplateRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AiTemplateGeneratorService(
            FireworksProperties properties,
            FireworksAiClient fireworksAiClient,
            AiRateLimiterService aiRateLimiterService,
            PracticeTemplateRepository practiceTemplateRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.properties = properties;
        this.fireworksAiClient = fireworksAiClient;
        this.aiRateLimiterService = aiRateLimiterService;
        this.practiceTemplateRepository = practiceTemplateRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Generates a structured code-typing practice template via Fireworks AI and DeepSeek V4 Pro.
     * Enforces user authentication and per-user generation rate limits.
     */
    public GeneratedTemplateResponse generateTemplate(Long userId, GenerateTemplateRequest request) {
        if (properties.getApiKey() == null || properties.getApiKey().trim().isBlank()) {
            throw new AiServiceException(
                    "Fireworks AI API key is not configured on the backend server. Please configure FIREWORKS_API_KEY in server environment.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        validateGenerationRequest(request);

        // Enforce per-user sliding window quota
        aiRateLimiterService.consumeQuota(userId);

        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(request);

        String rawContent = fireworksAiClient.generateChatCompletion(systemPrompt, userPrompt);
        GeneratedTemplateResponse response = parseAndValidateAiOutput(rawContent, request, userId);

        log.info("Successfully generated template '{}' for user ID: {} using {}", response.title(), userId, properties.getModel());
        return response;
    }

    /**
     * Saves an AI-generated template to the authenticated user's personal private collection.
     */
    @Transactional
    public PracticeTemplateDetailResponse saveGeneratedTemplate(Long userId, SaveGeneratedTemplateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        DifficultyLevel difficultyLevel;
        try {
            difficultyLevel = DifficultyLevel.valueOf(request.difficulty().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            difficultyLevel = DifficultyLevel.INTERMEDIATE;
        }

        String baseSlug = slugify(request.title());
        String uniqueSlug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 8);

        PracticeTemplate template = new PracticeTemplate();
        template.setTitle(request.title().trim());
        template.setSlug(uniqueSlug);
        template.setDescription(request.description() != null ? request.description().trim() : "Custom AI-generated typing exercise.");
        template.setLanguage(request.language().trim());
        template.setDifficulty(difficultyLevel);
        template.setCategory(request.category() != null && !request.category().isBlank() ? request.category().trim() : "AI Generated");
        template.setContent(request.content().trim());
        template.setEstimatedDurationSeconds(request.estimatedDurationSeconds() != null ? request.estimatedDurationSeconds() : 60);
        template.setAuthor(user);
        template.setPublished(false); // Private to the user
        template.setAiGenerated(true);

        PracticeTemplate saved = practiceTemplateRepository.save(template);
        log.info("Saved private AI template ID {} ('{}') for user ID {}", saved.getId(), saved.getTitle(), userId);
        return PracticeTemplateDetailResponse.from(saved);
    }

    /**
     * Lists all saved AI practice templates authored by the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<PracticeTemplateSummaryResponse> listUserSavedTemplates(Long userId) {
        List<PracticeTemplate> templates = practiceTemplateRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        return templates.stream()
                .map(PracticeTemplateSummaryResponse::from)
                .toList();
    }

    /**
     * Retrieves current quota consumption metrics for the user.
     */
    public AiQuotaResponse getUserQuota(Long userId) {
        return aiRateLimiterService.getQuota(userId);
    }

    private void validateGenerationRequest(GenerateTemplateRequest request) {
        if (request.language() == null || request.language().isBlank()) {
            throw new IllegalArgumentException("Programming language is required.");
        }
        String normalizedLang = request.language().trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_LANGUAGES.contains(normalizedLang)) {
            throw new IllegalArgumentException("Unsupported programming language: " + request.language()
                    + ". Supported languages: C++, Java, Python, JavaScript, TypeScript, Go, Rust, SQL, C#, Ruby, Kotlin, Swift, PHP.");
        }

        if (request.difficulty() == null || request.difficulty().isBlank()) {
            throw new IllegalArgumentException("Difficulty is required (BEGINNER, INTERMEDIATE, or ADVANCED).");
        }
        try {
            DifficultyLevel.valueOf(request.difficulty().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid difficulty: " + request.difficulty()
                    + ". Must be BEGINNER, INTERMEDIATE, or ADVANCED.");
        }

        if (request.topic() == null || request.topic().trim().isBlank()) {
            throw new IllegalArgumentException("Topic is required.");
        }

        if (request.customInstructions() != null && request.customInstructions().length() > 500) {
            throw new IllegalArgumentException("Custom instructions must not exceed 500 characters.");
        }
    }

    private String buildSystemPrompt() {
        return """
                You are DevType's professional code-typing template engine.
                Your task is to generate clean, idiomatic, real-world code snippets specifically tailored for typing practice.

                CRITICAL INSTRUCTIONS:
                1. Respond ONLY with a valid, parseable JSON object matching the schema below.
                2. Do NOT output markdown code block markers (```json or ```) outside the JSON.
                3. The "code" property MUST contain pure source code. Do NOT put markdown code fences (```) INSIDE the "code" field.
                4. Use standard 4-space (or 2-space) indentation. Keep formatting clean, aesthetic, and readable for typists.
                5. Make the code self-contained with necessary imports/includes where applicable.

                JSON Output Schema:
                {
                  "title": "Concise descriptive title (e.g. 'LRU Cache Implementation', max 60 chars)",
                  "description": "One sentence explaining what the snippet does (max 150 chars)",
                  "language": "Exact language name (e.g. 'Java', 'Python', 'C++', 'Go', 'Rust', 'JavaScript')",
                  "difficulty": "BEGINNER, INTERMEDIATE, or ADVANCED",
                  "topic": "Specific domain topic (e.g. 'Data Structures', 'Algorithms', 'Concurrency')",
                  "instructions": "One actionable typing or algorithmic hint (max 120 chars)",
                  "code": "Pure source code with consistent indentation and standard syntax",
                  "estimatedDurationSeconds": 60
                }
                """;
    }

    private String buildUserPrompt(GenerateTemplateRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Language: ").append(request.language()).append("\n");
        sb.append("Difficulty: ").append(request.difficulty().toUpperCase(Locale.ROOT)).append("\n");
        sb.append("Topic: ").append(request.topic()).append("\n");
        sb.append("Exercise Type: ").append(request.getSanitizedExerciseType()).append("\n");
        sb.append("Target Length: ").append(request.getSanitizedTargetLength()).append("\n");

        if (request.customInstructions() != null && !request.customInstructions().trim().isBlank()) {
            sb.append("Custom Exercise Details: ").append(request.customInstructions().trim()).append("\n");
        }

        sb.append("\nGenerate the complete JSON object now.");
        return sb.toString();
    }

    private GeneratedTemplateResponse parseAndValidateAiOutput(String rawContent, GenerateTemplateRequest request, Long userId) {
        String cleanedJson = stripMarkdownEnvelopes(rawContent.trim());

        JsonNode root;
        try {
            root = objectMapper.readTree(cleanedJson);
        } catch (Exception ex) {
            log.error("Failed to parse JSON output from Fireworks AI: {}", cleanedJson);
            throw new AiServiceException(
                    "The AI model produced a response that could not be parsed as valid JSON. Please try generating again.",
                    HttpStatus.BAD_GATEWAY
            );
        }

        String title = root.path("title").asText("").trim();
        if (title.isBlank()) {
            title = request.topic() + " Drill (" + request.language() + ")";
        }
        if (title.length() > 150) {
            title = title.substring(0, 150);
        }

        String description = root.path("description").asText("").trim();
        if (description.isBlank()) {
            description = "AI-generated " + request.difficulty() + " typing practice for " + request.topic() + ".";
        }

        String rawCode = root.path("code").asText("").trim();
        String cleanedCode = sanitizeCodeSnippet(rawCode);

        if (cleanedCode.length() < 20) {
            throw new AiServiceException(
                    "The AI model produced code that is too short for a typing drill (" + cleanedCode.length() + " chars). Please retry.",
                    HttpStatus.BAD_GATEWAY
            );
        }

        if (cleanedCode.length() > 4000) {
            throw new AiServiceException(
                    "The AI model produced code that exceeds maximum template size limits (" + cleanedCode.length() + " chars). Please request a shorter length.",
                    HttpStatus.BAD_GATEWAY
            );
        }

        String instructions = root.path("instructions").asText("Focus on consistent rhythm and accurate punctuation.").trim();
        String difficulty = root.path("difficulty").asText(request.difficulty()).toUpperCase(Locale.ROOT);
        String topic = root.path("topic").asText(request.topic()).trim();
        String language = root.path("language").asText(request.language()).trim();

        int charCount = cleanedCode.length();
        int lineCount = cleanedCode.split("\r\n|\r|\n", -1).length;

        // Authoritatively compute duration: typing speed benchmark ~40 WPM (approx 3.5 chars/sec)
        int estimatedDuration = root.path("estimatedDurationSeconds").asInt(0);
        if (estimatedDuration < 15 || estimatedDuration > 600) {
            estimatedDuration = Math.max(30, Math.min(300, (int) Math.ceil((double) charCount / 3.5)));
        }

        AiQuotaResponse quota = aiRateLimiterService.getQuota(userId);

        return new GeneratedTemplateResponse(
                UUID.randomUUID().toString(),
                title,
                description,
                language,
                difficulty,
                topic,
                request.getSanitizedExerciseType(),
                instructions,
                cleanedCode,
                estimatedDuration,
                charCount,
                lineCount,
                properties.getModel(),
                quota.remainingInLastHour(),
                Instant.now()
        );
    }

    private String stripMarkdownEnvelopes(String raw) {
        if (raw.startsWith("```json")) {
            raw = raw.substring(7);
        } else if (raw.startsWith("```")) {
            raw = raw.substring(3);
        }
        if (raw.endsWith("```")) {
            raw = raw.substring(0, raw.length() - 3);
        }
        return raw.trim();
    }

    private String sanitizeCodeSnippet(String code) {
        if (code == null) return "";
        code = code.trim();
        // Remove leading markdown code fences if model enclosed them
        if (code.startsWith("```")) {
            int firstNewline = code.indexOf('\n');
            if (firstNewline != -1) {
                code = code.substring(firstNewline + 1);
            }
        }
        // Remove trailing markdown code fences
        if (code.endsWith("```")) {
            code = code.substring(0, code.length() - 3);
        }
        return code.trim();
    }

    private String slugify(String text) {
        if (text == null) return "template";
        String normalized = text.toLowerCase(Locale.ROOT).trim();
        normalized = normalized.replaceAll("[^a-z0-9\\s-]", "");
        normalized = normalized.replaceAll("\\s+", "-");
        normalized = normalized.replaceAll("-+", "-");
        if (normalized.length() > 50) {
            normalized = normalized.substring(0, 50);
        }
        return normalized.isEmpty() ? "template" : normalized;
    }
}
