package com.devtype.auth;

import com.devtype.auth.dto.LoginRequest;
import com.devtype.auth.dto.RegisterRequest;
import com.devtype.auth.security.JwtProperties;
import com.devtype.user.AccountType;
import com.devtype.user.User;
import com.devtype.user.UserPreferences;
import com.devtype.user.UserPreferencesRepository;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationAndAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPreferencesRepository userPreferencesRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProperties jwtProperties;

    @Autowired
    private JwtEncoder jwtEncoder;

    @BeforeEach
    void setup() {
        // Clear records created by previous tests if any
        userPreferencesRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register succeeds, hashes password, assigns USER role, and creates preferences")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = new RegisterRequest("john_dev", "john@devtype.io", "P@ssword123", "John Developer");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.expiresIn", is(900)))
                .andExpect(jsonPath("$.data.user.username", is("john_dev")))
                .andExpect(jsonPath("$.data.user.email", is("john@devtype.io")))
                .andExpect(jsonPath("$.data.user.displayName", is("John Developer")))
                .andExpect(jsonPath("$.data.user.role", is("USER")))
                .andExpect(jsonPath("$.data.user.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.user.accountType", is("STANDARD")))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andReturn();

        // Verify in database
        Optional<User> userOpt = userRepository.findByUsername("john_dev");
        assertThat(userOpt).isPresent();
        User savedUser = userOpt.get();
        assertThat(savedUser.getPasswordHash()).startsWith("$2a$");
        assertThat(passwordEncoder.matches("P@ssword123", savedUser.getPasswordHash())).isTrue();

        // Verify default preferences were created
        Optional<UserPreferences> prefs = userPreferencesRepository.findByUserId(savedUser.getId());
        assertThat(prefs).isPresent();
        assertThat(prefs.get().getTheme()).isEqualTo("dark");
    }

    @Test
    @DisplayName("Password hashing and verification with BCrypt")
    void testPasswordHashingAndVerification() {
        String rawPassword = "ComplexPassword2026";
        String encoded = passwordEncoder.encode(rawPassword);

        assertThat(encoded).isNotEqualTo(rawPassword);
        assertThat(passwordEncoder.matches(rawPassword, encoded)).isTrue();
        assertThat(passwordEncoder.matches("WrongPassword", encoded)).isFalse();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register rejects duplicate username and email with HTTP 409")
    void testDuplicateUsernameAndEmailRejection() throws Exception {
        RegisterRequest initial = new RegisterRequest("dev_hero", "hero@devtype.io", "Pass12345", "Hero One");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initial)))
                .andExpect(status().isCreated());

        // Duplicate username (case-insensitive)
        RegisterRequest dupUsername = new RegisterRequest("DEV_HERO", "other@devtype.io", "Pass12345", "Hero Two");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupUsername)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("Username is already taken")));

        // Duplicate email (case-insensitive)
        RegisterRequest dupEmail = new RegisterRequest("other_hero", "HERO@DEVTYPE.IO", "Pass12345", "Hero Three");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupEmail)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("Email is already registered")));
    }

    @Test
    @DisplayName("Public registration cannot assign ADMIN role or DEMO account type")
    void testRegistrationPrivilegeEscalationAttemptIgnored() throws Exception {
        String maliciousPayload = """
                {
                    "username": "sneaky_admin",
                    "email": "sneaky@devtype.io",
                    "password": "Password123",
                    "displayName": "Sneaky Admin",
                    "role": "ADMIN",
                    "accountType": "DEMO",
                    "status": "SUSPENDED"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.role", is("USER")))
                .andExpect(jsonPath("$.data.user.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.user.accountType", is("STANDARD")));

        User user = userRepository.findByUsername("sneaky_admin").orElseThrow();
        assertThat(user.getRole()).isEqualTo(UserRole.USER);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getAccountType()).isEqualTo(AccountType.STANDARD);
    }

    @Test
    @DisplayName("POST /api/v1/auth/login succeeds with valid username or email and updates last_login_at")
    void testLoginSuccess() throws Exception {
        User user = new User("sarah_coder", "sarah@devtype.io", passwordEncoder.encode("ValidPass1"), "Sarah");
        userRepository.saveAndFlush(user);

        // Login by username
        LoginRequest usernameLogin = new LoginRequest("sarah_coder", "ValidPass1");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usernameLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.username", is("sarah_coder")));

        // Verify last_login_at updated
        User updated = userRepository.findByUsername("sarah_coder").orElseThrow();
        assertThat(updated.getLastLoginAt()).isNotNull();

        // Login by email
        LoginRequest emailLogin = new LoginRequest("SARAH@devtype.io", "ValidPass1");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login returns HTTP 401 on invalid password or non-existent user")
    void testLoginInvalidCredentials() throws Exception {
        User user = new User("test_user", "test@devtype.io", passwordEncoder.encode("CorrectPass1"), "Tester");
        userRepository.saveAndFlush(user);

        // Wrong password
        LoginRequest wrongPass = new LoginRequest("test_user", "WrongPassword1");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPass)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid username/email or password")));

        // Non-existent username (generic response prevents user enumeration)
        LoginRequest noUser = new LoginRequest("does_not_exist", "AnyPassword1");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noUser)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid username/email or password")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login rejects suspended and deactivated accounts")
    void testSuspendedAndDeactivatedAccountRejection() throws Exception {
        User suspendedUser = new User("suspended_dev", "suspended@devtype.io", passwordEncoder.encode("Pass12345"), "Suspended");
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        userRepository.saveAndFlush(suspendedUser);

        User deactivatedUser = new User("deactivated_dev", "deactivated@devtype.io", passwordEncoder.encode("Pass12345"), "Deactivated");
        deactivatedUser.setStatus(UserStatus.DEACTIVATED);
        userRepository.saveAndFlush(deactivatedUser);

        LoginRequest req1 = new LoginRequest("suspended_dev", "Pass12345");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("suspended")));

        LoginRequest req2 = new LoginRequest("deactivated_dev", "Pass12345");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("deactivated")));
    }

    @Test
    @DisplayName("GET /api/v1/users/me returns authenticated developer profile from security context")
    void testAuthenticatedAccessToUsersMe() throws Exception {
        RegisterRequest reg = new RegisterRequest("profile_user", "profile@devtype.io", "Password123", "Profile User");
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = jsonNode.path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("profile_user")))
                .andExpect(jsonPath("$.data.email", is("profile@devtype.io")))
                .andExpect(jsonPath("$.data.displayName", is("Profile User")))
                .andExpect(jsonPath("$.data.role", is("USER")))
                .andExpect(jsonPath("$.data.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.accountType", is("STANDARD")))
                .andExpect(jsonPath("$.data.createdAt", notNullValue()))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.secret").doesNotExist());
    }

    @Test
    @DisplayName("Anonymous access denied to protected endpoints with structured 401 ErrorResponse")
    void testAnonymousAccessDeniedToPrivateApis() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", containsString("authentication is required")))
                .andExpect(jsonPath("$.path", is("/api/v1/users/me")));
    }

    @Test
    @DisplayName("USER role denied access to /api/v1/admin/** with structured 403 ErrorResponse")
    void testUserDeniedAccessToAdminApi() throws Exception {
        User user = new User("standard_user", "std@devtype.io", passwordEncoder.encode("Pass12345"), "Standard User");
        user.setRole(UserRole.USER);
        userRepository.saveAndFlush(user);

        LoginRequest login = new LoginRequest("standard_user", "Pass12345");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/admin/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")))
                .andExpect(jsonPath("$.message", containsString("insufficient privileges")));
    }

    @Test
    @DisplayName("ADMIN role permitted to access /api/v1/admin/**")
    void testAdminPermittedAccessToAdminApi() throws Exception {
        User admin = new User("admin_hero", "admin@devtype.io", passwordEncoder.encode("AdminPass123"), "Admin Hero");
        admin.setRole(UserRole.ADMIN);
        userRepository.saveAndFlush(admin);

        LoginRequest login = new LoginRequest("admin_hero", "AdminPass123");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/admin/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.authorizedRole", is("ADMIN")));
    }

    @Test
    @DisplayName("JWT validation rejects malformed and expired tokens with HTTP 401")
    void testJwtValidationMalformedAndExpiredTokens() throws Exception {
        // Malformed token
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.malformed.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));

        // Expired token (issued in past, expired 60 seconds ago)
        Instant pastIssued = Instant.now().minusSeconds(120);
        Instant pastExpired = Instant.now().minusSeconds(60);

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.getIssuer())
                .issuedAt(pastIssued)
                .expiresAt(pastExpired)
                .subject("123")
                .claim("username", "expired_user")
                .claim("role", "ROLE_USER")
                .build();

        String expiredToken = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("CORS pre-flight requests permit configured origin and reject disallowed origins")
    void testCorsAllowedAndDisallowedOrigins() throws Exception {
        // Allowed origin: http://localhost:5173
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        // Disallowed origin: http://untrusted-site.com
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://untrusted-site.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
