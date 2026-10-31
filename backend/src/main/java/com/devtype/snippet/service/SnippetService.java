package com.devtype.snippet.service;

import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.snippet.Snippet;
import com.devtype.snippet.SnippetRepository;
import com.devtype.snippet.dto.CreateSnippetRequest;
import com.devtype.snippet.dto.SnippetDetailResponse;
import com.devtype.snippet.dto.SnippetSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SnippetService {

    private static final Logger log = LoggerFactory.getLogger(SnippetService.class);

    private final SnippetRepository snippetRepository;

    public SnippetService(SnippetRepository snippetRepository) {
        this.snippetRepository = snippetRepository;
    }

    @Transactional
    public SnippetDetailResponse createSnippet(CreateSnippetRequest request, Long userId) {
        String baseSlug = (request.title() != null ? request.title() : "custom-snippet")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        String slug = baseSlug + "-" + System.currentTimeMillis();
        String tagsString = request.tags() != null ? String.join(",", request.tags()) : "";

        Snippet snippet = new Snippet(
                request.title(),
                slug,
                request.description(),
                request.language(),
                request.category() != null ? request.category() : "Custom",
                request.subCategory(),
                request.difficulty() != null ? request.difficulty() : "INTERMEDIATE",
                request.code(),
                tagsString,
                false,
                true,
                userId,
                request.xpBounty() != null && request.xpBounty() > 0 ? request.xpBounty() : 40
        );

        Snippet saved = snippetRepository.save(snippet);
        log.info("Created custom snippet id={} title='{}' for user id={}", saved.getId(), saved.getTitle(), userId);
        return SnippetDetailResponse.fromEntity(saved);
    }

    @Transactional
    public SnippetDetailResponse updateSnippet(Long id, CreateSnippetRequest request, Long userId) {
        Snippet snippet = snippetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with ID: " + id));

        snippet.setTitle(request.title());
        snippet.setLanguage(request.language());
        if (request.category() != null) snippet.setCategory(request.category());
        if (request.subCategory() != null) snippet.setSubCategory(request.subCategory());
        if (request.difficulty() != null) snippet.setDifficulty(request.difficulty());
        snippet.setCode(request.code());
        if (request.description() != null) snippet.setDescription(request.description());
        if (request.tags() != null) snippet.setTags(String.join(",", request.tags()));

        Snippet updated = snippetRepository.save(snippet);
        return SnippetDetailResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public SnippetDetailResponse getById(Long id) {
        Snippet snippet = snippetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with ID: " + id));
        return SnippetDetailResponse.fromEntity(snippet);
    }

    @Transactional(readOnly = true)
    public SnippetDetailResponse getBySlug(String slug) {
        Snippet snippet = snippetRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with slug: " + slug));
        return SnippetDetailResponse.fromEntity(snippet);
    }

    @Transactional(readOnly = true)
    public SnippetDetailResponse getByIdOrSlug(String identifier) {
        try {
            Long numericId = Long.parseLong(identifier);
            return getById(numericId);
        } catch (NumberFormatException e) {
            return getBySlug(identifier);
        }
    }

    @Transactional(readOnly = true)
    public List<SnippetSummaryResponse> getUserSnippets(Long userId) {
        return snippetRepository.findByCreatedByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(SnippetSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SnippetSummaryResponse> filterSnippets(String category, String language, String difficulty) {
        String cat = (category != null && !category.equalsIgnoreCase("All") && !category.isBlank()) ? category.trim() : null;
        String lang = (language != null && !language.equalsIgnoreCase("All") && !language.isBlank()) ? language.trim() : null;
        String diff = (difficulty != null && !difficulty.equalsIgnoreCase("All") && !difficulty.isBlank()) ? difficulty.trim() : null;

        List<Snippet> list;
        if (cat == null && lang == null && diff == null) {
            list = snippetRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        } else {
            list = snippetRepository.findAll().stream()
                    .filter(s -> cat == null || (s.getCategory() != null && s.getCategory().equalsIgnoreCase(cat)))
                    .filter(s -> lang == null || (s.getLanguage() != null && s.getLanguage().equalsIgnoreCase(lang)))
                    .filter(s -> diff == null || (s.getDifficulty() != null && s.getDifficulty().equalsIgnoreCase(diff)))
                    .sorted((a, b) -> (b.getCreatedAt() != null && a.getCreatedAt() != null) ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                    .toList();
        }

        return list.stream()
                .map(SnippetSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteSnippet(Long id, Long userId) {
        Snippet snippet = snippetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with ID: " + id));
        snippetRepository.delete(snippet);
        log.info("Deleted snippet id={}", id);
    }
}
