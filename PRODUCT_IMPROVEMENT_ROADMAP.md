# DevType: senior engineering review and product roadmap

Reviewed on 24 October 2026. Recommendations are based on the current working tree, not production usage research. The admin redesign described below is implemented; the remaining items are proposed work.

## Product direction

DevType should help a developer answer three questions: What should I practice today? What am I getting better at? What should I work on next? A useful next release should connect practice sessions, error analysis, and the AI generator into a measurable learning loop.

The application already has practice, templates, challenges, reports, achievements, an AI generation endpoint, and administration APIs. The highest-value work is to make these features dependable and connected, then expand them.

## What I changed in the admin experience

The administrator now has a dedicated console at `/admin`, outside the learner shell. Its navigation is organized around work an administrator actually performs:

| Screen | Purpose |
|---|---|
| Overview | Account totals, practice usage, moderation workload, account composition, recent administrative activity, and current service health. |
| User management | Debounced search, status/role/account-type filters, pagination, account detail inspection, and access changes with a recorded reason. |
| Moderation | Report status filtering, category filtering, report details, review notes, and recorded decisions. |
| Audit log | Filterable administrative events with actor, target, before/after state, reason, time, and recorded IP. |
| System health | Actual API request counters, latency, JVM memory, database connections, and authentication activity. |

The design uses the learner workspace’s frosted iOS glass theme, shared light/dark appearance settings, consistent tables and status badges, clear hierarchy, and responsive navigation. Browser refresh and direct links keep the selected administrative section. Administrators land in the console after normal sign-in unless they were following an explicit destination.

Interaction improvements include:

- Correct `ADMIN` / `USER` values for filters and role mutations, matching the backend enum.
- Explicit loading, empty, and recoverable error states. Missing metrics display as unavailable instead of successful zeroes.
- Protection against stale responses overwriting newer searches or filters.
- User details and report details fetched when opened.
- Required reasons for access changes and required notes for moderation decisions.
- Additional confirmation before granting administrator access.
- No self-service changes to the current administrator's access in the console.
- Disabled submission while an update is being saved, and errors shown next to the action.
- Native modal focus handling, Escape dismissal, labelled controls, and keyboard focus indicators.
- Accurate measurement labels: operational counters are cumulative since process start; account status is not presented as daily active users; no invented historical graphs.

The backend still enforces authorization and its existing last-administrator protections. This redesign does not create an administrator account or establish production security readiness.

## Recommended additions, in order

| Priority | Addition | Why it is useful | Initial scope / acceptance condition |
|---|---|---|---|
| P0 | Account and session security | A learner must be able to trust their account; an administrator needs stronger protection. | Remove usable default signing secrets; rate-limit login and signup; add email verification, password reset, admin MFA and reauthentication for privilege changes; provide session listing/revocation. Verify invalid and expired tokens, role changes, suspension, recovery, and lockout behavior. |
| P0 | Real account settings and private persistence | Current settings include local defaults for identity/email, and profile customizations use browser storage. Users expect changes to survive another browser or device. | Persist profile/preferences through authenticated APIs; verify email changes; keep secrets out of browser storage where possible; fix report storage isolation; replace broad localStorage clearing with account-scoped cleanup. |
| P1 | Personalized practice plan | This creates a reason to return beyond a speed score. | Let users choose a language, skill level, weekly goal, and session length. Recommend the next drill from actual error patterns and accuracy. Show a short explanation: “Practice brackets because these caused 35% of your errors.” Exclude insufficient or unreliable data. |
| P1 | Evidence-based progress and review | Learners need to see whether practice is helping. | Add a baseline assessment, comparable repeat drills, goal progress, and a weekly summary. Show accuracy alongside speed; distinguish comparable snippets and difficulty. Make improvement measurable without rewarding meaningless volume. |
| P1 | Content management for administrators | A serious learning product needs maintained, reviewed exercises. | Add template search, draft/review/publish/archive states, version history, author attribution, tags, duplicate detection, and a preview. Preserve the content version used for an existing session. Existing template APIs need additional authorized management endpoints. |
| P1 | AI quality and cost controls | Generating a snippet is useful only if it is relevant, safe to display, and affordable. | Strict output schema validation; request budgets shared across instances; provider usage and cost accounting; timeout/error monitoring; user feedback and regeneration reasons; redact sensitive prompt/output logging. Show proposed drills as recommendations with explanations. |
| P2 | Real multiplayer, starting with one mode | The current multiplayer service is a simulation layer. Reliable competitive play requires server authority. | Ship a small private race: create/join room, ready state, synchronized start, server-owned race state, reconnect, result verification, and disconnect handling. Clearly label bot practice. Add ranked modes only after fairness and reliability are measured. |
| P2 | Teams and classrooms | This gives instructors and small engineering teams a practical shared workflow. | Organization membership and invitations, assignments, due dates, private leaderboards, and aggregate cohort progress. Establish tenant isolation and learner privacy before sharing individual results. |
| P2 | Privacy and accessibility controls | These improve trust and make the core typing workflow usable by more people. | Account export/deletion with clear retention behavior; accessible keyboard navigation; reduced motion; configurable editor size/contrast; screen-reader review; user-controlled reminders. Validate the typing interaction independently of the surrounding pages. |

## What I would add to administration next

1. **Role-specific permissions.** Separate content editors, support staff, moderators, and platform administrators. Grant the minimum actions needed. The current API has `USER` and `ADMIN`; adding a menu label alone would not implement permission separation.
2. **AI operations.** A screen for generation count, failure reasons, latency, provider spend, and budget thresholds. Add backend usage records first; do not display estimated spend as measured spend.
3. **Moderation workflow.** Assign a case to an administrator, record internal notes, link supporting evidence, support appeals, and track unresolved-case age. Review history should remain available when a decision changes.
4. **Operational alerts and incident history.** Configurable signals for server errors, unhealthy database connections, provider failures, and unusual authentication activity. Connect persistent metrics and an alert destination before showing an alert as active.
5. **Safer privileged changes.** Require recent authentication, add independent approval for the most sensitive privilege changes where appropriate, and preserve audit records independently of account deletion. The existing audit table has an administrator foreign key with `ON DELETE CASCADE`, so it should not be described as immutable without further work.
6. **Real product analytics.** Activation (first completed session), returning learners, cohort retention, drill completion, and measured improvement. The existing active-account count is an account status and should remain labelled that way.

## Engineering work that supports the roadmap

- Split large route bundles so learners do not download every admin/marketing screen on first load. The current production build reports a large JavaScript chunk.
- Define request/response contracts and verify frontend enum values, pagination, error envelopes, and optional metrics against the backend.
- Keep demo fixtures in isolated development/test environments. Do not inject synthetic “live” counts into production UI when the API fails.
- Add meaningful integration coverage for ownership boundaries, administrator privileges, moderation transitions, and concurrent access changes.
- Introduce CI for build, lint, targeted backend tests, dependency scanning, and secret scanning. Run database integration checks against an isolated test database.
- Monitor database queries and put bounds on exports and large listings before supporting substantial traffic.
- Treat generated code as data. If execution is ever added, design isolated execution with no application secrets or host access as its own project.

## Suggested release sequence

**Foundation:** repair the security and persistence gaps, adopt the redesigned console, and establish reliable build/test checks. Success means account changes work across browsers, access boundaries hold, and real failures are visible.

**Learning value:** connect goals, the baseline assessment, error-driven recommendations, and weekly progress. Measure completion, return rate, and accuracy/speed improvement on comparable exercises.

**Content and AI operations:** ship editorial workflows and model quality/budget telemetry. Measure accepted generations, regeneration rate, cost per accepted drill, and time to resolve content reports.

**Collaboration:** validate private multiplayer races and then teams/classrooms with a small user group. Expand only after reconnect behavior, fairness, privacy, and tenant isolation are proven.

Avoid adding billing, a large marketplace, or many more competitive modes until the core learning loop and real multi-user behavior are reliable.
