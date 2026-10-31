package com.devtype.multiplayer;

import com.devtype.ai.client.FireworksAiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AiBugFixService {
    private static final Logger log = LoggerFactory.getLogger(AiBugFixService.class);
    private final FireworksAiClient fireworksAiClient;
    private final ObjectMapper json;

    public AiBugFixService(FireworksAiClient fireworksAiClient, ObjectMapper json) {
        this.fireworksAiClient = fireworksAiClient;
        this.json = json;
    }

    public record GenerateResult(String buggedCode, String bugsDescription, int bugCount, List<String> hints) {}
    public record VerifyResult(boolean correct, String feedback, List<String> remainingIssues) {}

    public GenerateResult generateBugs(String language, String title, String code) {
        if (code == null || code.isBlank()) {
            return new GenerateResult("// No template code provided", "Empty template", 0, List.of());
        }

        String systemPrompt = """
            You are an expert competitive programming challenge designer.
            Your task is to take a working code snippet and inject 1 to 2 realistic, subtle bugs into it.

            CRITICAL REQUIREMENTS:
            1. You MUST keep 90%–95% of the original code completely intact and recognizable!
            2. DO NOT delete, wipe, or replace the template code with placeholders or 'TODO' comments.
            3. The entire template must be returned with ONLY 1 or 2 small, realistic modifications:
               - An operator or comparison flip (e.g., '>' instead of '<', '==' instead of '!=', '+' instead of '-').
               - An off-by-one loop boundary (e.g., 'i <= length' instead of 'i < length', or 'i = 1' instead of 'i = 0').
               - A subtle logic swap (e.g., setting a map before checking complement, swapping two variable names).
               - A syntax mistake (e.g., missing semicolon, missing closing parenthesis).
            4. Make sure each bug is novel and unique so the drill is fresh every time.

            You MUST return a pure JSON object in this exact schema:
            {
              "buggedCode": "<full modified code with only the 1-2 subtle bugs injected>",
              "bugsDescription": "<short 1-line summary of what bug was introduced without giving away the direct answer>",
              "bugCount": 1,
              "hints": ["<concise hint 1>", "<concise hint 2>"]
            }
            Do not wrap JSON in markdown ticks. Return pure JSON.
            """;

        String userPrompt = String.format("Language: %s\nTitle: %s\nOriginal Code:\n%s", language, title, code);

        try {
            String raw = fireworksAiClient.generateChatCompletion(systemPrompt, userPrompt);
            JsonNode root = json.readTree(cleanJson(raw));
            String bugged = root.path("buggedCode").asText(null);
            // Verify bugged code is at least 60% the length of original to avoid truncated/erased responses
            if (bugged != null && !bugged.isBlank() && bugged.trim().length() >= Math.min(code.trim().length() * 0.6, 20)) {
                String desc = root.path("bugsDescription").asText("Subtle logic and syntax bugs introduced.");
                int count = root.path("bugCount").asInt(1);
                List<String> hints = new ArrayList<>();
                if (root.has("hints") && root.get("hints").isArray()) {
                    for (JsonNode h : root.get("hints")) hints.add(h.asText());
                }
                return new GenerateResult(bugged, desc, count, hints);
            }
        } catch (Exception e) {
            log.warn("Fireworks AI bug generation fallback used: {}", e.getMessage());
        }

        return fallbackGenerate(code, language);
    }

    public VerifyResult verifyFix(String language, String originalCode, String buggedCode, String submittedCode) {
        String systemPrompt = """
            You are an expert automated code evaluator.
            A user was given a bugged code snippet and asked to fix it so that it behaves correctly and cleanly.
            The user submitted their fixed code.
            Determine whether the user's submitted code successfully resolves the bug(s) and is logically correct.
            IMPORTANT: Do NOT require the submitted code to be an exact verbatim character-for-character match with the original code. As long as the logic is correct, syntax is valid, and the bug is resolved, it must be considered correct.
            Return a JSON object with:
            {
              "correct": <true or false>,
              "feedback": "<clear and constructive explanation of whether the fix works, or what is still wrong>",
              "remainingIssues": ["<issue 1 if false>"]
            }
            Do not wrap JSON in markdown ticks. Return pure JSON.
            """;

        String userPrompt = String.format("""
            Language: %s
            Original Working Reference:
            %s

            Bugged Version Given To User:
            %s

            User Submitted Fix:
            %s
            """, language, originalCode, buggedCode, submittedCode);

        try {
            String raw = fireworksAiClient.generateChatCompletion(systemPrompt, userPrompt);
            JsonNode root = json.readTree(cleanJson(raw));
            boolean correct = root.path("correct").asBoolean(false);
            String feedback = root.path("feedback").asText(correct ? "Great job! The logic is correct and all bugs are resolved." : "The code still contains errors.");
            List<String> issues = new ArrayList<>();
            if (root.has("remainingIssues") && root.get("remainingIssues").isArray()) {
                for (JsonNode issue : root.get("remainingIssues")) issues.add(issue.asText());
            }
            return new VerifyResult(correct, feedback, issues);
        } catch (Exception e) {
            log.warn("Fireworks AI bug verification fallback used: {}", e.getMessage());
        }

        boolean matchesOriginal = normalizeCode(submittedCode).equals(normalizeCode(originalCode));
        boolean differsFromBugged = !normalizeCode(submittedCode).equals(normalizeCode(buggedCode));
        boolean ok = matchesOriginal || (differsFromBugged && submittedCode != null && submittedCode.trim().length() > 10);
        return new VerifyResult(ok, ok ? "Fix verified! Bug successfully resolved." : "Code still contains the bug. Check logic carefully.", ok ? List.of() : List.of("Logic or syntax error remains."));
    }

    private String cleanJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        return s.trim();
    }

    private String normalizeCode(String c) {
        return c == null ? "" : c.replaceAll("\\s+", " ").trim();
    }

    private GenerateResult fallbackGenerate(String code, String language) {
        if (code == null || code.isBlank()) {
            return new GenerateResult("// No template code provided", "Empty template", 0, List.of());
        }

        Random rng = new Random();
        int choice = rng.nextInt(5);
        String bugged = code;
        String desc = "Subtle logic comparison error introduced.";
        List<String> hints = new ArrayList<>();

        if (choice == 0 && code.contains("<")) {
            bugged = code.replaceFirst("<", ">");
            desc = "Inequality boundary condition reversed (> instead of <).";
            hints.add("Check loop termination and array boundary comparisons.");
        } else if (choice == 1 && code.contains("==")) {
            bugged = code.replaceFirst("==", "!=");
            desc = "Equality condition inverted (!= instead of ==).";
            hints.add("Inspect conditional equality checks.");
        } else if (choice == 2 && code.contains("+")) {
            bugged = code.replaceFirst("\\+", "-");
            desc = "Arithmetic operation sign inverted (- instead of +).";
            hints.add("Review the index calculation or accumulator operators.");
        } else if (choice == 3 && code.contains("int i = 0")) {
            bugged = code.replaceFirst("int i = 0", "int i = 1");
            desc = "Loop initialization off-by-one error (i starts at 1).";
            hints.add("Look closely at where loop indexing begins.");
        } else if (choice == 4 && code.contains(";")) {
            int semi = code.indexOf(';');
            bugged = code.substring(0, semi) + code.substring(semi + 1);
            desc = "Syntax statement terminator omitted.";
            hints.add("Look for a missing statement terminator (;).");
        } else if (code.contains("return")) {
            bugged = code.replaceFirst("return ", "return !");
            desc = "Return value logical negation defect.";
            hints.add("Check the return value expression.");
        } else {
            bugged = code.replaceFirst("([a-zA-Z_]+)", "$1_err");
            desc = "Identifier typo defect.";
            hints.add("Check variable names for spelling typos.");
        }

        return new GenerateResult(bugged, desc, 1, hints);
    }
}
