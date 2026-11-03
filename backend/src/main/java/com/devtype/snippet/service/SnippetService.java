package com.devtype.snippet.service;

import com.devtype.admin.service.AdminAuditLogService;
import com.devtype.common.exception.ResourceNotFoundException;
import com.devtype.snippet.Snippet;
import com.devtype.snippet.SnippetRepository;
import com.devtype.snippet.dto.CreateSnippetRequest;
import com.devtype.snippet.dto.SnippetDetailResponse;
import com.devtype.snippet.dto.SnippetSummaryResponse;
import com.devtype.user.UserRepository;
import com.devtype.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SnippetService {

    private static final Logger log = LoggerFactory.getLogger(SnippetService.class);

    private final SnippetRepository snippetRepository;
    private final AdminAuditLogService auditLogService;
    private final UserRepository userRepository;

    public SnippetService(SnippetRepository snippetRepository,
                          AdminAuditLogService auditLogService,
                          UserRepository userRepository) {
        this.snippetRepository = snippetRepository;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
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

        // Record in admin audit log
        try {
            boolean isAdmin = false;
            if (userId != null) {
                isAdmin = userRepository.findById(userId)
                        .map(u -> u.getRole() == UserRole.ADMIN)
                        .orElse(false);
            }
            if (isAdmin || saved.isCurated() || userId == null) {
                auditLogService.recordLog(
                        userId,
                        "TEMPLATE_CREATE",
                        "TEMPLATE",
                        saved.getId(),
                        "NONE",
                        saved.getTitle() + " (" + saved.getLanguage() + ")",
                        "Created template: " + saved.getTitle() + " in " + saved.getLanguage() + " [" + saved.getCategory() + "]",
                        null
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to record template create audit log: {}", ex.getMessage());
        }

        return SnippetDetailResponse.fromEntity(saved);
    }

    @Transactional
    public SnippetDetailResponse updateSnippet(Long id, CreateSnippetRequest request, Long userId) {
        Snippet snippet = snippetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with ID: " + id));

        String prevTitle = snippet.getTitle();
        String prevLang = snippet.getLanguage();

        snippet.setTitle(request.title());
        snippet.setLanguage(request.language());
        if (request.category() != null) snippet.setCategory(request.category());
        if (request.subCategory() != null) snippet.setSubCategory(request.subCategory());
        if (request.difficulty() != null) snippet.setDifficulty(request.difficulty());
        snippet.setCode(request.code());
        if (request.description() != null) snippet.setDescription(request.description());
        if (request.tags() != null) snippet.setTags(String.join(",", request.tags()));

        Snippet updated = snippetRepository.save(snippet);

        // Record in admin audit log
        try {
            auditLogService.recordLog(
                    userId,
                    "TEMPLATE_UPDATE",
                    "TEMPLATE",
                    updated.getId(),
                    prevTitle + " (" + prevLang + ")",
                    updated.getTitle() + " (" + updated.getLanguage() + ")",
                    "Updated template #" + updated.getId() + ": " + updated.getTitle() + " (" + updated.getLanguage() + ")",
                    null
            );
        } catch (Exception ex) {
            log.warn("Failed to record template update audit log: {}", ex.getMessage());
        }

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

        String title = snippet.getTitle();
        String lang = snippet.getLanguage();

        snippetRepository.delete(snippet);
        log.info("Deleted snippet id={}", id);

        // Record in admin audit log
        try {
            auditLogService.recordLog(
                    userId,
                    "TEMPLATE_DELETE",
                    "TEMPLATE",
                    id,
                    title + " (" + lang + ")",
                    "DELETED",
                    "Admin deleted code template #" + id + ": " + title + " (" + lang + ")",
                    null
            );
        } catch (Exception ex) {
            log.warn("Failed to record template delete audit log: {}", ex.getMessage());
        }
    }
}
