# Multiplayer implementation and verification

## Root causes

- `multiplayerService.js` was an in-browser mock. The page generated opponents, room IDs, timing, placement and ranked submissions locally. The backend multiplayer package had no service or WebSocket implementation.
- `/leaderboard/record-match` trusted client wins, opponent ratings and performance; it had no match identity or idempotency constraint. Match history fabricated opponents, wins and ELO from ordinary practice sessions.
- Personal rank counted only strictly higher ratings, so every equally rated new user received rank 1. Leaderboard sorting lacked a final identity tie-breaker; tier filtering also renumbered global positions.
- Stored tier labels, frontend tier ranges and season-reset baselines disagreed. The progress bar assumed every subtier was 100 points wide.
- Rollover was manual, deleted older seasons, and lacked coordination with match finalization. Migration startup silently repaired historical checksums.

## Implementation

Existing Spring Boot/JPA/PostgreSQL/Flyway and React/Vite architecture is retained. Spring WebSocket is the sole added dependency; there was no existing socket library to reuse.

- `backend/.../multiplayer/`: authenticated first-frame JWT WebSockets, validated room events, heartbeat, expiry, reconnect state, bounded persisted chat, server timestamps, persisted template snapshots, queue/room lifecycle and result transactions. Native WebSockets are used by the existing frontend multiplayer service.
- `frontend/src/pages/Multiplayer.jsx` and `services/multiplayerService.js`: real queues and participants replace simulations. Template selection uses the backend catalog, without local fallback. Includes readiness, server countdown, progress/errors/score, chat acknowledgement/retry, cancellation, results and history.
- `leaderboard/service/LeaderboardService.java`, repositories and controller: deterministic ordinal ranks, actual multiplayer history, rejection of client-authored results, season rollover, preserved history and audit events.
- `BgmiTierService`: authoritative threshold/reset configuration and Conqueror eligibility. `SeasonScheduler` runs rollover independently of browsers.
- `frontend/src/pages/Leaderboard.jsx`: backend reset configuration, correct subtier progress, refresh after results and every 30 seconds, season-ending/new-season notifications through the existing notification context, and unavailable states instead of invented champions.
- `frontend/src/utils/eloRatingStore.js`: removes unused client-side result awards and conflicting tier/reset tables; retains backend-data caching and visual tokens.
- `SecurityConfig`, `MultiplayerSocketConfig`, `pom.xml`: socket handshake and authenticated event transport. `frontend/nginx.conf` permits WS/WSS in CSP. `FlywayConfig` no longer automatically repairs checksums.

### Explicit policies

- Lifecycle: SEARCHING → READY → COUNTDOWN → RACING → COMPLETED, with CANCELLED for pre-start failure or season expiry.
- Classic needs four distinct accounts; duel needs two. Searches match the exact template (therefore language/difficulty), use a 100-point initial rating window growing 5 points/second to 600, and cancel after 120 seconds. No synthetic players or partial-fill fallback.
- Private rooms accept 2–8 players, transfer the host on pre-race departure, and expire after 10 minutes. Everyone present must be ready. Countdown is five seconds; race deadline is three minutes.
- Disconnect grace is 30 seconds. Explicit unfinished departure during a race forfeits; the account remains reserved until the result commits. Finished participants can leave without losing their finish. If nobody completes, no rating changes are applied.
- A database singleton row lock serializes claims, room changes, result/rating commits and season rollover across instances. Membership has a unique user key; results have a unique `(room_id,user_id)` key. This prioritizes correctness over throughput.
- Typing score is `max(0, correct code points - accumulated incorrect inserted code points)`. Backspace/retries do not charge a mistake again. Standings prioritize non-forfeit, completion, score, server finish time, then current progress/errors; user ID provides stable ordering. Exact result ties share placement and receive no ELO change.
- Duel retains the existing K=32 expected-rating formula and minimum win/loss changes (+8/-6). Classic completed top-two winners receive +20…+32; others use the existing loss formula. Rating floor remains 300. All deltas use pre-match opponent snapshots. Score and ELO remain separate.
- Input length is bounded, server receipt times are authoritative, and typing is capped at 40 characters/second. This is basic abuse resistance, not proof that a human typed the code.
- Bug Fix currently supports one curated Python addition task. A bounded arithmetic interpreter accepts a single `return` expression with a/b, integers, parentheses, +, -, *, and //. Six cases cover positive, negative and zero operands. It rejects arbitrary code, malformed patches, incorrect results and arithmetic failures; it never launches a Python runtime. Score is passed cases (all six required). It never updates ranked statistics.
- Chat retains the last 100 messages in each persisted room, checks membership, limits content to 500 characters, throttles sends and deduplicates request IDs within that bounded history. Chat closes with the room. Room records/history have no automatic destructive retention job.
- Conqueror: configurable top 500 active-season ordinal positions, rating >=4200, at least one ranked match. It resets to Platinum III/2700. Numeric reset baselines from the existing backend are retained; labels are derived consistently (1200 means Bronze III, not Bronze V).
- Seasons roll into the existing 30-day successor policy. Expired-season races cancel without rating changes. Old rating rows remain historical; `ranked_season_events` records each committed rollover once. Notification deduplication is per account/browser through the existing local notification system.

## Database and setup

New migration: `backend/src/main/resources/db/migration/V10__authoritative_multiplayer.sql`.
It adds room snapshots, membership reservations, result audit rows, the coordination lock, curated bug-task metadata, a published bug task, and season audit events. Existing user/rating data is not deleted.

Run the backend with the existing PostgreSQL configuration; Flyway applies V10 on startup. Back up production before normal migration deployment. Historical migrations were already modified in the user's workspace; if an existing database reports a checksum mismatch, review/reconcile that mismatch explicitly. Startup no longer silently repairs it. No live database was migrated during this task.

Configure frontend `VITE_API_BASE_URL`, backend allowed origins, HTTPS/WSS and WebSocket upgrade forwarding at the deployment proxy. No Redis is required. Optional environment settings are documented in `backend/.env.example`:

- `DEVTYPE_MULTIPLAYER_QUEUE_TIMEOUT_SECONDS` (120)
- `DEVTYPE_MULTIPLAYER_RECONNECT_SECONDS` (30)
- `DEVTYPE_RANKED_CONQUEROR_POSITIONS` (500)
- `DEVTYPE_MULTIPLAYER_MAX_CHARACTERS_PER_SECOND` (40)

## Verification

Commands use the installed Java 21 and Node 24 runtime. Maven's dependency cache was placed in `/tmp/devtype-m2` because the home cache is read-only in this session.

- `./backend/mvnw -B -ntp -f backend/pom.xml -Dmaven.repo.local=/tmp/devtype-m2 -Dtest=RaceRulesTest,MultiplayerIntegrationTest test`: **17 passed**. Covers comment/string/Unicode parsing, edit/error accounting, ratings/tiers/reset consistency, room IDs, bug patches, four-player completion, duplicate matchmaking, last-slot concurrency, private rooms, chat isolation, real authenticated WebSocket connections/reconnect, forced result-write failure and rollback, disconnect grace, season rollover concurrency, personal/global rank agreement and active-race reservations.
- Full backend suite: **116 tests, 1 failure, 1 skipped** on the full run before the final two targeted regressions were added. Failure: existing `CriticalUserJourneysIntegrationTest.testJourneyC_SpacedRepetitionAndRewards` expects `intervalDays=6`, but the current SRS response has no such field. The external Neon connectivity test is skipped. Unrelated SRS work was left intact.
- Existing frontend checks: typing metrics **23 passed**; practice simulation **55 passed**.
- Vite production build passed, with the existing large-bundle warning.
- ESLint passed for the multiplayer page/service and ELO cache utility.

## Remaining verification and limitations

This is not a claim of production certification. Integration tests use H2 in PostgreSQL mode; PostgreSQL-specific multi-instance/load/failover behavior and deployment proxy behavior need staging verification. Real WebSocket connections were tested, but no browser automation runtime was installed, so visual/browser end-to-end flows have not been exercised.

The lexical scanner supports a bounded subset of C/C++/Java/Python/Go/SQL/JavaScript/TypeScript, preserves quoted literals, and rejects known ambiguous constructs such as JS regex/division/interpolated templates, SQL dollar quotes/nested comments, and unsupported languages. It is not a complete compiler parser for every language construct. The Bug Fix evaluator is intentionally limited to the documented arithmetic task, not a general execution sandbox.

The global database mutex and full room snapshots are correctness-oriented and will limit throughput. This needs load testing before a high-traffic launch. Anti-bot proof, generalized bug-fix execution, cross-device notification deduplication, season awards (no award rules existed), and historical chat/result retention require further product/infrastructure work. Existing legacy seeded champion/demo data in prior migrations was not rewritten or deleted.
