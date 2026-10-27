# DevType Security and AI Code Review

**Review date:** 2026-10-24  
**Scope:** Static review of the repository's Java/Spring backend, React frontend, Docker/Nginx configuration, dependency manifests, seeded/demo data, and AI generation flow. This is a source review, not a production penetration test. No production endpoint or database was accessed.

## Summary

The code has useful safeguards: public registration assigns `USER` on the server, admin routes require an admin role, private saved AI templates are owner-scoped, password hashes use BCrypt, demo seeding is disabled by default and refuses the production profile, and errors avoid stack traces in HTTP responses.

I found two actionable security/privacy issues, one deployment-sensitive configuration risk, and AI/data quality improvements:

| Priority | Finding |
|---|---|
| High | A fixed, publicly visible JWT signing secret is the default outside `prod`/`production` profiles. |
| Medium | Browser authentication tokens are stored in `localStorage`, exposing them to any successful same-origin script injection. |
| Medium | Session reports are mirrored into a global localStorage key and used as a fallback for every user on that browser. |
| Low / deployment check | Credentialed CORS trusts the configured origin patterns; the shipped defaults are local development origins, so deployment must override them and avoid broad patterns. |

## Findings

### 1. High: Predictable JWT signing key accepted outside production profiles

**Evidence:** [`application.yml`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/resources/application.yml:96>) supplies a fixed default JWT key. [`JwtProperties.java`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/java/com/devtype/auth/security/JwtProperties.java:29>) rejects that known value only when Spring's `prod` or `production` profile is active.

**Impact:** If a deployed environment omits `JWT_SECRET` or uses a different profile name, anyone who knows the repository can sign tokens with arbitrary claims, including `ROLE_ADMIN`. The configured token lifetime is 30 days, which increases the impact of token theft/forgery.

**Recommendation:** Remove the usable default. Fail startup unless an independently generated secret is provided in every environment. Validate entropy/strength and token lifetime, and use a short access-token lifetime with refresh/revocation controls where appropriate. Rotate the key if this default has ever been used in a reachable deployment.

### 2. Medium: Bearer token stored in browser localStorage

**Evidence:** [`authService.js`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/frontend/src/services/authService.js:8>) reads and writes `devtype_auth_token` in `localStorage`; [`api.js`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/frontend/src/services/api.js:22>) attaches it to requests.

**Impact:** Any successful XSS or compromised same-origin dependency can read and exfiltrate the bearer token. `localStorage` is available to all JavaScript executing on the origin. The repository's Nginx CSP includes `'unsafe-inline'` for scripts, which weakens an important XSS defense if inline script injection is possible.

**Recommendation:** Prefer a `Secure`, `HttpOnly`, `SameSite` cookie-based session/token design with CSRF protections appropriate to the deployment. If bearer tokens remain in browser storage, shorten their lifetime, add revocation/rotation, harden CSP (nonce/hash-based scripts; remove `unsafe-inline` where feasible), and audit every HTML injection/rendering path and third-party dependency.

### 3. Medium: Report data is copied to a browser-global key and can cross account boundaries

**Evidence:** [`reportStore.js`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/frontend/src/utils/reportStore.js:346>) writes a user-scoped record and also mirrors it to `devtype_sessions`. [`getSavedSessions`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/frontend/src/utils/reportStore.js:325>) falls back to that global key when the current user's key is absent.

**Impact:** On a shared browser, a later account with no user-scoped sessions can see a prior account's session report data. The frontend stores an additional copy of activity locally, outside server-side user authorization. The data is not a credential, but may reveal practice history and custom content.

**Recommendation:** Remove the global fallback and mirror. Use only data keyed to the authenticated account, clear that account's local data on logout/account switch, and fetch sensitive history from the authenticated API. Treat localStorage as user-editable and non-authoritative.

### 4. Low / deployment check: Credentialed CORS needs strict production origins

**Evidence:** [`CorsConfig.java`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/java/com/devtype/config/CorsConfig.java:26>) uses `setAllowedOriginPatterns` and enables credentials. [`application.yml`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/resources/application.yml:90>) supplies localhost origins by default.

**Impact:** The checked-in defaults are constrained to local development hosts, not an open wildcard. However, a production environment that sets a wildcard or overly broad origin pattern will allow credentialed cross-origin reads from matching sites, increasing exposure if browser credentials/cookies are introduced or sensitive authenticated responses are accessible.

**Recommendation:** Set an exact production allowlist at deployment, reject wildcard patterns when credentials are enabled, and verify the actual deployed `CORS_ALLOWED_ORIGINS` value. Do not use `*` or broad subdomain globs for trusted origins.

## Static data and secrets

- The codebase contains a fallback/demo password `DemoPassword123!` in [`application.yml`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/resources/application.yml:100>) and [`DemoDataProperties.java`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/java/com/devtype/demo/DemoDataProperties.java:22>). Demo seeding is off by default and production-profile seeding is explicitly rejected, which reduces immediate risk. Keep the switch off in every real deployment and avoid a known fallback password: require a unique secret or generate random demo-only credentials that cannot access real accounts.
- The frontend contains deterministic demo report records in [`reportStore.js`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/frontend/src/utils/reportStore.js:7>). They are synthetic fixtures, not secrets, but ensure production screens label demo data clearly and never mix it with user results.
- `.env.example` files contain placeholders; no credential-shaped file is tracked in the Git index based on the file listing reviewed. A targeted search of the current working tree did not surface a populated credential, but much of this tree is currently untracked, so a Git-history secret scan was not meaningful. Check the full repository history and production secret stores separately.

## AI agent / LLM-specific review

### Existing controls observed

- The AI API is authenticated, and generation has a per-user hourly quota.
- Request fields have length limits, supported languages are allowlisted, generated code has a 4,000-character cap, and saved templates are private by default.
- The Fireworks key is backend-only and upstream calls have connection/read timeouts.

### Recommendations

1. **Treat model output as hostile input.** The generation path parses JSON but does not strictly validate every returned field against length bounds/enums before returning it. Apply a schema/allowlist to title, description, language, difficulty, topic, instructions and duration; bound every string and reject unexpected structures.
2. **Make prompt injection boundaries explicit.** `customInstructions` is inserted in the user message. Keep it clearly delimited as untrusted content and state in the system prompt that user text cannot change policy or request secrets/tools. Do not add tools or data access to this agent without an explicit permission model.
3. **Do not execute generated code.** Keep generated snippets display-only. If execution/sandboxing is added later, use isolated ephemeral containers with no network, secrets, or host mounts and strict CPU/memory/time limits.
4. **Avoid logging raw model output.** On malformed JSON, the complete model response is logged in [`AiTemplateGeneratorService.java`](</run/media/ankit/A034668734666070/capstone project/Devtype2.0/backend/src/main/java/com/devtype/ai/service/AiTemplateGeneratorService.java:224>). Replace it with a bounded redacted excerpt or a response ID; model output may contain user-provided instructions or other sensitive text.
5. **Make quota state distributed.** The current AI limiter is in-memory, so it resets on restart and is independently enforced per application instance. Use a shared atomic store (for example Redis or a database counter) and add IP/global/provider budget controls to limit abuse and unexpected inference spend.
6. **Validate user-submitted saved templates too.** Saving accepts client-supplied fields independently of the prior generation result. Validate language/difficulty, duration upper bounds, and content policy on the save endpoint rather than assuming the browser sends an AI response.

## Testing performed and limits

- Reviewed security configuration, auth/JWT flows, user/admin controllers and services, DTO validation, AI request/response handling, browser storage/rendering, seeded/static data, Dockerfiles, Nginx headers, and dependency manifests.
- Attempted focused Maven tests for authentication/authorization and AI generation. The Maven wrapper could not create process streams in this environment; a direct `mvn` attempt also failed because Maven is not installed. Therefore no automated test result is claimed.
- No live HTTP probing, dependency vulnerability database lookup, secret-history scan, or production configuration review was performed.

## Suggested fix order

1. Remove the default JWT secret and make startup fail without a configured secret; rotate any key that may have been deployed.
2. Remove global report storage/fallback and address token storage/CSP.
3. Verify strict production CORS and demo-seed settings in deployment configuration.
4. Harden LLM output validation, logging, and distributed/global quotas before expanding agent capabilities.
