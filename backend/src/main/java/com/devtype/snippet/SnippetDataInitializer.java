package com.devtype.snippet;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;

@Component
public class SnippetDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SnippetDataInitializer.class);

    private final SnippetRepository snippetRepository;
    private final ObjectMapper objectMapper;

    public SnippetDataInitializer(SnippetRepository snippetRepository, ObjectMapper objectMapper) {
        this.snippetRepository = snippetRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedCpAlgorithmsBlueprints();
    }

    private void seedCpAlgorithmsBlueprints() {
        try (InputStream is = getClass().getResourceAsStream("/data/cp_algorithms_templates.json")) {
            if (is == null) {
                log.info("CP algorithms templates JSON resource not found, skipping blueprint seeding.");
                return;
            }
            List<CpTemplateSeedDto> templates = objectMapper.readValue(is, new TypeReference<>() {});
            int seededCount = 0;
            for (CpTemplateSeedDto t : templates) {
                if (t.slug() != null && snippetRepository.findBySlug(t.slug()).isEmpty()) {
                    Snippet snippet = new Snippet(
                            t.title(),
                            t.slug(),
                            t.description(),
                            t.language() != null ? t.language() : "C++",
                            t.category() != null ? t.category() : "Competitive Algorithms",
                            t.subCategory(),
                            t.difficulty() != null ? t.difficulty().toUpperCase() : "INTERMEDIATE",
                            t.code() != null ? t.code() : "// Blueprint implementation",
                            t.tags() != null ? String.join(",", t.tags()) : "",
                            true,
                            false,
                            null,
                            t.xpBounty() > 0 ? t.xpBounty() : 50
                    );
                    snippetRepository.save(snippet);
                    seededCount++;
                }
            }
            if (seededCount > 0) {
                log.info("Successfully seeded {} algorithmic blueprints into snippets table.", seededCount);
            }
        } catch (Exception e) {
            log.error("Failed to seed cp-algorithms blueprints from JSON", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record CpTemplateSeedDto(
            Integer phase,
            String id,
            String slug,
            String title,
            String category,
            String subCategory,
            String language,
            String difficulty,
            List<String> tags,
            int xpBounty,
            String description,
            String code
    ) {}
}
