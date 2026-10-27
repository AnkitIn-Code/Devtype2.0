# DevType Frontend

DevType is a code typing practice application built with React and Vite, featuring a handcrafted Apple macOS Liquid Glass aesthetic, real-time keystroke telemetry, and full integration with the Spring Boot REST backend.

---

## Architecture & Authentication

### Centralized Authentication Service
Authentication is managed centrally via `src/services/authService.js` and exposed throughout the React component tree using `src/context/AuthContext.jsx`.

- **User Registration**: `POST /api/v1/auth/register`
  - Validates `displayName`, `username`, `email`, and `password`
  - Server assigns default roles (`USER`), initial status (`ACTIVE`), and account type (`STANDARD`)
  - Excludes client manipulation of roles or status
- **User Authentication**: `POST /api/v1/auth/login`
  - Supports login with username or email plus password
  - Returns short-lived JWT access token and sanitized user profile
- **Session Verification**: `GET /api/v1/users/me`
  - Synchronizes developer profile with backend security context via `Authorization: Bearer <token>`
- **Route Guards**:
  - `ProtectedRoute`: Guards authenticated routes (`/dashboard`, `/practice`, `/templates`, etc.) and redirects unauthenticated visitors to `/login`, preserving the intended destination in router state.
  - `PublicOnlyRoute`: Protects `/login` and `/signup`, redirecting already-authenticated developers straight to the dashboard.

### Token Storage Trade-Offs & Security
JWT Bearer access tokens are held in `localStorage` under the key `devtype_auth_token`.

**Trade-Off Analysis**:
1. **CSRF Protection**: Because tokens are explicitly attached via the `Authorization: Bearer <token>` header on REST requests (rather than ambient cookie authentication), standard Cross-Site Request Forgery (CSRF) vectors are mitigated.
2. **XSS Exposure Warning**: `localStorage` is accessible to JavaScript executing in the application origin. Therefore, **`localStorage` is NOT completely secure against Cross-Site Scripting (XSS)**. If malicious scripts were injected into the application, tokens could theoretically be read. To mitigate this risk, DevType strictly avoids `dangerouslySetInnerHTML`, validates all inputs, and recommends configuring a strict Content Security Policy (CSP) in production.
3. **Future Refresh Token Roadmap**: The Spring Boot backend currently implements stateless access tokens with a 24-hour expiration (`devtype.jwt.expiration-seconds: 86400`). If sliding sessions with dedicated refresh tokens (`/api/v1/auth/refresh`) using `HttpOnly; SameSite=Strict` cookies are introduced in the backend, `authService.js` is structured for seamless transition.

---

## Routes

| Route | Access | Component | Purpose |
|---|---|---|---|
| `/` | Public | `LandingPage` | Public product landing page showcasing features, workflow, and typing preview |
| `/login` | Public Only | `LoginPage` | User login form with validation, show/hide password, and friendly error states |
| `/signup` | Public Only | `SignupPage` | Developer registration with password criteria checklist and backend error mapping |
| `/dashboard` | Protected | `Dashboard` | Authenticated developer activity overview, heatmaps, and stats |
| `/practice` | Protected | `Practice` | Live code typing workspace with low-latency tokenizer and audio telemetry |
| `/templates` | Protected | `Templates` | Algorithmic and syntax challenge library |
| `/ai-generator`| Protected | `AiGenerator` | Custom challenge code generator |
| `/reports` | Protected | `Reports` | Typing analytics and historical reports |
| `/multiplayer`| Protected | `Multiplayer` | Real-time typing duels and team relays (roadmap) |
| `/leaderboard`| Protected | `Leaderboard` | Global and language-specific typing rankings |
| `/achievements`| Protected | `Achievements` | Milestones, badges, and progress tracking |
| `/profile` | Protected | `Profile` | Developer identity and public portfolio |
| `/settings` | Protected | `Settings` | Account credentials, timezone, and preference settings |

---

## Environment Configuration

Configure the backend REST API endpoint in `.env`:

```env
# URL of the Spring Boot backend
VITE_API_BASE_URL=http://localhost:8080
```

### Backend CORS Requirements
The Spring Boot backend should allow the frontend origin. In `application.yml`:
```yaml
devtype:
  cors:
    allowed-origins: "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    allowed-methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    allowed-headers: "*"
    allow-credentials: true
```

---

## Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run production build
npm run build

# Run linter
npm run lint
```
