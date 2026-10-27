package com.devtype.template;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PracticeTemplateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PracticeTemplateRepository practiceTemplateRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private PracticeTemplate publishedJava;
    private PracticeTemplate publishedPython;
    private PracticeTemplate publishedCpp;
    private PracticeTemplate unpublishedTemplate;

    @BeforeEach
    void setUp() {
        practiceTemplateRepository.deleteAll();

        publishedJava = new PracticeTemplate(
                "Java Binary Search",
                "java-binary-search",
                "java",
                DifficultyLevel.BEGINNER,
                "Algorithms",
                "public class BinarySearch { public int search() { return 0; } }",
                90
        );
        publishedJava.setDescription("Fast logarithmic search on sorted arrays.");
        publishedJava.setPublished(true);

        publishedPython = new PracticeTemplate(
                "Python Quick Sort",
                "python-quick-sort",
                "python",
                DifficultyLevel.INTERMEDIATE,
                "Sorting",
                "def quick_sort(arr): return arr",
                120
        );
        publishedPython.setDescription("Divide and conquer sorting algorithm in Python.");
        publishedPython.setPublished(true);

        publishedCpp = new PracticeTemplate(
                "C++ LRU Cache",
                "cpp-lru-cache",
                "C++",
                DifficultyLevel.ADVANCED,
                "Data Structures",
                "class LRUCache { /* implementation */ };",
                180
        );
        publishedCpp.setDescription("O(1) capacity-constrained cache with hash map and doubly linked list.");
        publishedCpp.setPublished(true);

        unpublishedTemplate = new PracticeTemplate(
                "Unpublished Draft Template",
                "unpublished-draft",
                "java",
                DifficultyLevel.BEGINNER,
                "Drafts",
                "// Draft content",
                60
        );
        unpublishedTemplate.setDescription("Internal draft exercise.");
        unpublishedTemplate.setPublished(false);

        practiceTemplateRepository.saveAll(List.of(
                publishedJava, publishedPython, publishedCpp, unpublishedTemplate
        ));
    }

    @Test
    @DisplayName("GET /api/v1/templates lists published templates and excludes unpublished ones")
    void testListTemplates_ExcludesUnpublished() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(3)))
                .andExpect(jsonPath("$.data.items", hasSize(3)))
                .andExpect(jsonPath("$.data.items[?(@.slug == 'unpublished-draft')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/v1/templates filters by language case-insensitively")
    void testListTemplates_FilterByLanguage() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("language", "JAVA")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].slug", is("java-binary-search")));
    }

    @Test
    @DisplayName("GET /api/v1/templates filters by difficulty")
    void testListTemplates_FilterByDifficulty() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("difficulty", "INTERMEDIATE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].slug", is("python-quick-sort")));
    }

    @Test
    @DisplayName("GET /api/v1/templates filters by category case-insensitively")
    void testListTemplates_FilterByCategory() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("category", "data structures")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].slug", is("cpp-lru-cache")));
    }

    @Test
    @DisplayName("GET /api/v1/templates search performs case-insensitive substring matching")
    void testListTemplates_Search() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("search", "logarithmic")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.items[0].slug", is("java-binary-search")));
    }

    @Test
    @DisplayName("GET /api/v1/templates validates pagination and supports sorting")
    void testListTemplates_PaginationAndSorting() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("page", "0")
                        .param("size", "2")
                        .param("sort", "title,asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(3)))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.items[0].title", is("C++ LRU Cache")))
                .andExpect(jsonPath("$.data.items[1].title", is("Java Binary Search")))
                .andExpect(jsonPath("$.data.hasNext", is(true)));
    }

    @Test
    @DisplayName("GET /api/v1/templates rejects unsupported sort field with HTTP 400")
    void testListTemplates_RejectsUnsupportedSortField() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("sort", "malicious_column,desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("Unsupported sort field")));
    }

    @Test
    @DisplayName("GET /api/v1/templates rejects invalid page or size with HTTP 400")
    void testListTemplates_RejectsInvalidPageOrSize() throws Exception {
        mockMvc.perform(get("/api/v1/templates")
                        .param("page", "-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));

        mockMvc.perform(get("/api/v1/templates")
                        .param("size", "0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("GET /api/v1/templates/{id} retrieves published template by numeric ID")
    void testGetTemplate_ByNumericId_Success() throws Exception {
        mockMvc.perform(get("/api/v1/templates/" + publishedJava.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(publishedJava.getId().intValue())))
                .andExpect(jsonPath("$.data.slug", is("java-binary-search")))
                .andExpect(jsonPath("$.data.content", org.hamcrest.Matchers.containsString("BinarySearch")))
                .andExpect(jsonPath("$.data.code", org.hamcrest.Matchers.containsString("BinarySearch")))
                .andExpect(jsonPath("$.data.lineCount", org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$.data.characterCount", org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    @DisplayName("GET /api/v1/templates/{id} retrieves published template by slug")
    void testGetTemplate_BySlug_Success() throws Exception {
        mockMvc.perform(get("/api/v1/templates/python-quick-sort")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("python-quick-sort")))
                .andExpect(jsonPath("$.data.language", is("python")));
    }

    @Test
    @DisplayName("GET /api/v1/templates/slug/{slug} retrieves template explicitly by slug")
    void testGetTemplate_ExplicitSlug_Success() throws Exception {
        mockMvc.perform(get("/api/v1/templates/slug/cpp-lru-cache")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug", is("cpp-lru-cache")))
                .andExpect(jsonPath("$.data.difficulty", is("ADVANCED")));
    }

    @Test
    @DisplayName("GET /api/v1/templates/{id} returns HTTP 404 for missing template")
    void testGetTemplate_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/templates/non-existent-template")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("not found")));
    }

    @Test
    @DisplayName("GET /api/v1/templates/{id} returns HTTP 404 when requested template is unpublished")
    void testGetTemplate_Unpublished_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/templates/" + unpublishedTemplate.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        mockMvc.perform(get("/api/v1/templates/unpublished-draft")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    @DisplayName("GET /api/v1/templates/languages and /categories return distinct published values")
    void testDistinctSupportingEndpoints() throws Exception {
        MvcResult langResult = mockMvc.perform(get("/api/v1/templates/languages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode langData = objectMapper.readTree(langResult.getResponse().getContentAsString()).get("data");
        assertThat(langData.isArray()).isTrue();
        assertThat(langData.toString()).contains("java", "python", "C++");

        MvcResult catResult = mockMvc.perform(get("/api/v1/templates/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode catData = objectMapper.readTree(catResult.getResponse().getContentAsString()).get("data");
        assertThat(catData.isArray()).isTrue();
        assertThat(catData.toString()).contains("Algorithms", "Sorting", "Data Structures");
        assertThat(catData.toString()).doesNotContain("Drafts");
    }
}
