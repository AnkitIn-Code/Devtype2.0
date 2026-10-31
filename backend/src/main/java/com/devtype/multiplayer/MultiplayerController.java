package com.devtype.multiplayer;

import com.devtype.auth.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;

import com.devtype.template.PracticeTemplateRepository;
import com.devtype.template.PracticeTemplate;

@RestController
@RequestMapping("/api/v1/multiplayer")
public class MultiplayerController {
    private final MultiplayerService service;
    private final AiBugFixService aiBugFixService;
    private final PracticeTemplateRepository practiceTemplateRepository;

    public MultiplayerController(MultiplayerService service, AiBugFixService aiBugFixService, PracticeTemplateRepository practiceTemplateRepository) {
        this.service = service;
        this.aiBugFixService = aiBugFixService;
        this.practiceTemplateRepository = practiceTemplateRepository;
    }

    public record Enter(
        @NotBlank String mode,
        Long templateId,
        String language,
        @Min(2) @Max(8) Integer capacity
    ) {}

    public record Join(@NotBlank @Size(max=16) String code) {}
    public record BugFixGenReq(Long templateId, String title, String language, String code) {}
    public record BugFixVerifyReq(String language, String originalCode, String buggedCode, String submittedCode) {}
    public record CloseRoomReq(@NotBlank String roomId) {}

    @GetMapping("/templates")
    public Object templates() {
        return service.catalog();
    }

    @GetMapping("/current")
    public Object current() {
        return service.current(SecurityUtils.getRequiredCurrentUserId());
    }

    @GetMapping("/history")
    public Object history(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        long uid = SecurityUtils.getRequiredCurrentUserId();
        if (page != null || size != null) {
            return service.history(uid, page == null ? 0 : page, size == null ? 10 : size);
        }
        return service.history(uid);
    }

    @PostMapping("/enter")
    public Object enter(@Valid @RequestBody Enter input) {
        return service.enter(
            SecurityUtils.getRequiredCurrentUserId(),
            input.mode(),
            input.templateId() == null ? 0L : input.templateId(),
            input.language(),
            input.capacity() == null ? 4 : input.capacity()
        );
    }

    @PostMapping("/join")
    public Object join(@Valid @RequestBody Join input) {
        return service.join(SecurityUtils.getRequiredCurrentUserId(), input.code());
    }

    @PostMapping("/close-room")
    public Object closeRoom(@Valid @RequestBody CloseRoomReq input) {
        service.closeRoom(SecurityUtils.getRequiredCurrentUserId(), input.roomId());
        return Map.of("success", true, "message", "Room closed successfully.");
    }

    @PostMapping("/leave")
    public Object leave() {
        long uid = SecurityUtils.getRequiredCurrentUserId();
        RaceRoom r = service.leave(uid);
        return Map.of("success", true, "roomId", r != null ? r.id : "");
    }

    @PostMapping("/bug-fix/generate")
    public Object generateBugs(@RequestBody BugFixGenReq input) {
        String code = input.code();
        if ((code == null || code.isBlank()) && input.templateId() != null && input.templateId() > 0) {
            code = practiceTemplateRepository.findById(input.templateId())
                .map(PracticeTemplate::getContent)
                .orElse("");
        }
        return aiBugFixService.generateBugs(
            input.language() == null ? "javascript" : input.language(),
            input.title() == null ? "Challenge" : input.title(),
            code == null ? "" : code
        );
    }

    @PostMapping("/bug-fix/verify")
    public Object verifyFix(@RequestBody BugFixVerifyReq input) {
        return aiBugFixService.verifyFix(
            input.language() == null ? "javascript" : input.language(),
            input.originalCode() == null ? "" : input.originalCode(),
            input.buggedCode() == null ? "" : input.buggedCode(),
            input.submittedCode() == null ? "" : input.submittedCode()
        );
    }
}
