package com.devtype.multiplayer;

import com.devtype.common.exception.ApiException;
import com.devtype.leaderboard.*;
import com.devtype.leaderboard.service.BgmiTierService;
import com.devtype.template.*;
import com.devtype.user.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class MultiplayerService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MultiplayerService.class);
    private final JdbcTemplate db;
    private final ObjectMapper json;
    private final UserRepository users;
    private final PracticeTemplateRepository templates;
    private final RankedSeasonRepository seasons;
    private final UserSeasonRatingRepository ratings;
    private final BgmiTierService tiers;
    private final SecureRandom random = new SecureRandom();
    @Value("${devtype.multiplayer.queue-timeout-seconds:120}") private long queueTimeout = 120;
    @Value("${devtype.multiplayer.max-characters-per-second:40}") private int maxCharactersPerSecond = 40;
    @Value("${devtype.multiplayer.reconnect-seconds:120}") private long reconnect = 120;
    private final Map<String, RaceRoom> activeRooms = new ConcurrentHashMap<>();
    private final Map<Long, String> userRooms = new ConcurrentHashMap<>();
    private final java.util.concurrent.ExecutorService asyncDbExecutor = java.util.concurrent.Executors.newFixedThreadPool(4);
    private final Object lifecycleLock = new Object();

    public MultiplayerService(JdbcTemplate db, ObjectMapper json, UserRepository users, PracticeTemplateRepository templates,
                              RankedSeasonRepository seasons, UserSeasonRatingRepository ratings, BgmiTierService tiers) {
        this.db=db; this.json=json; this.users=users; this.templates=templates; this.seasons=seasons; this.ratings=ratings; this.tiers=tiers;
    }

    @jakarta.annotation.PostConstruct
    public void initTemplatesIfEmpty() {
        try {
            long count = templates.count();
            if (count < 40) {
                log.info("Populating predefined template catalog (current count: {})", count);
                List<PracticeTemplate> catalog = com.devtype.demo.PredefinedTemplateCatalog.getAllTemplates();
                for (PracticeTemplate pt : catalog) {
                    if (templates.findBySlug(pt.getSlug()).isEmpty()) {
                        templates.save(pt);
                    }
                }
                log.info("Predefined template catalog populated. Total templates: {}", templates.count());
            }
        } catch (Exception e) {
            log.warn("Auto-population of predefined templates skipped: {}", e.getMessage());
        }
    }

    public void lock() {
        // High-performance in-memory synchronization; zero remote DB round-trips!
    }
    public RaceRoom getCachedRoom(String id) {
        if (id == null) return null;
        return activeRooms.get(id);
    }
    private ApiException error(String message) { return new ApiException(message, HttpStatus.CONFLICT); }
    private User user(long id) { return users.findById(id).filter(u -> u.getStatus() == UserStatus.ACTIVE).orElseThrow(() -> new ApiException("Active account required.", HttpStatus.FORBIDDEN)); }
    private RaceRoom read(String id) {
        if (id == null) throw new ApiException("Room ID required.", HttpStatus.BAD_REQUEST);
        RaceRoom cached = activeRooms.get(id);
        if (cached != null) return cached;
        List<String> rows=db.queryForList("SELECT snapshot FROM multiplayer_rooms WHERE id=?", String.class, id);
        if(rows.isEmpty()) throw new ApiException("Room not found.", HttpStatus.NOT_FOUND);
        try {
            RaceRoom r = json.readValue(rows.getFirst(), RaceRoom.class);
            if (!terminal(r)) {
                activeRooms.put(r.id, r);
                for (RaceRoom.Player p : r.players) {
                    userRooms.put(p.id, r.id);
                }
            }
            return r;
        } catch(Exception e) { throw new IllegalStateException("Cannot read persisted race", e); }
    }
    private void save(RaceRoom room) {
        room.revision++;
        if (terminal(room)) {
            activeRooms.remove(room.id);
            for (RaceRoom.Player p : room.players) {
                userRooms.remove(p.id);
            }
            try {
                db.update("UPDATE multiplayer_rooms SET state=?, snapshot=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        room.state, json.writeValueAsString(room), room.id);
            } catch(Exception e) {
                log.error("Failed to commit completed room {}: {}", room.id, e.getMessage());
            }
        } else {
            activeRooms.put(room.id, room);
            for (RaceRoom.Player p : room.players) {
                userRooms.put(p.id, room.id);
            }
            final String snapshotState = room.state;
            final String roomId = room.id;
            try {
                final String snapshotJson = json.writeValueAsString(room);
                asyncDbExecutor.submit(() -> {
                    try {
                        db.update("UPDATE multiplayer_rooms SET state=?, snapshot=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                                snapshotState, snapshotJson, roomId);
                    } catch(Exception e) {
                        log.debug("Async room snapshot save: {}", e.getMessage());
                    }
                });
            } catch(Exception ignored) {}
        }
    }
    private RaceRoom.Player member(RaceRoom r,long id) { return r.players.stream().filter(p->p.id==id).findFirst().orElseThrow(()->new ApiException("Room membership required.",HttpStatus.FORBIDDEN)); }
    private boolean terminal(RaceRoom r) { return Set.of("COMPLETED","CANCELLED").contains(r.state); }
    private boolean ranked(RaceRoom r) { return r.mode.equals("classic") || r.mode.equals("duel"); }
    private UserSeasonRating rating(User u, RankedSeason season) {
        return ratings.findByUserIdAndSeasonId(u.getId(),season.getId()).orElseGet(()->ratings.saveAndFlush(new UserSeasonRating(u,season,1200,tiers.getTierForRating(1200).name())));
    }
    public RaceRoom current(long uid) {
        String roomId = userRooms.get(uid);
        RaceRoom r = null;
        if (roomId != null) {
            r = activeRooms.get(roomId);
        }
        if (r == null) {
            List<String> ids = db.queryForList("SELECT room_id FROM multiplayer_members WHERE user_id=?", String.class, uid);
            if (!ids.isEmpty()) {
                r = read(ids.getFirst());
            }
        }
        if (r != null) {
            long now = System.currentTimeMillis();
            for (RaceRoom.Player p : r.players) {
                if (p.id == uid && !p.forfeited) {
                    p.lastSeen = now;
                }
            }
            advance(r);
            if (terminal(r)) {
                activeRooms.remove(r.id);
                userRooms.remove(uid);
                save(r);
                return null;
            }
            activeRooms.put(r.id, r);
            userRooms.put(uid, r.id);
            return r;
        }
        return null;
    }
    public List<Map<String,Object>> catalog() {
        Set<Long> bugTaskIds = new HashSet<>(db.queryForList("SELECT DISTINCT template_id FROM multiplayer_bug_tasks", Long.class));
        return templates.findAll().stream().filter(PracticeTemplate::isPublished).map(t->Map.<String,Object>of(
            "id", t.getId(),
            "title", t.getTitle(),
            "language", t.getLanguage(),
            "difficulty", t.getDifficulty().name(),
            "content", t.getContent() != null ? t.getContent() : "",
            "bugFix", bugTaskIds.contains(t.getId())
        )).toList();
    }
    public RaceRoom enter(long uid, String mode, long templateId, int capacity) {
        return enter(uid, mode, templateId, null, capacity);
    }

    private static String normalizeLang(String l) {
        if (l == null) return "";
        String s = l.trim().toLowerCase(Locale.ROOT);
        if (s.equals("c++") || s.equals("cpp")) return "c++";
        if (s.equals("c")) return "c";
        if (s.equals("javascript") || s.equals("js")) return "javascript";
        if (s.equals("typescript") || s.equals("ts")) return "typescript";
        if (s.equals("python") || s.equals("py")) return "python";
        if (s.equals("java")) return "java";
        if (s.equals("go") || s.equals("golang")) return "go";
        if (s.equals("rust") || s.equals("rs")) return "rust";
        if (s.equals("sql")) return "sql";
        return s;
    }

    public RaceRoom enter(long uid, String mode, long templateId, String language, int capacity) {
        synchronized(lifecycleLock) {
            User u = user(uid);
            RaceRoom existing = current(uid);
            if (existing != null && !terminal(existing)) {
                // If user was alone in SEARCHING state, clean it up so a fresh random match search begins
                if (existing.players.size() <= 1 && (existing.state.equals("SEARCHING") || existing.state.equals("READY"))) {
                    cancel(existing, "Abandoned for new room.");
                    save(existing);
                    db.update("DELETE FROM multiplayer_members WHERE user_id=?", u.getId());
                    userRooms.remove(uid);
                } else if (existing.mode.equals(mode) && (templateId <= 0 || existing.templateId == templateId) && existing.players.size() > 1) {
                    return existing;
                } else if (existing.state.equals("RACING") && (existing.deadline < System.currentTimeMillis() || existing.players.stream().allMatch(p -> p.finishedAt > 0 || p.forfeited))) {
                    finish(existing, System.currentTimeMillis());
                    save(existing);
                    userRooms.remove(uid);
                } else {
                    // Force abandon current stale room to allow re-entry
                    cancel(existing, "Abandoned for new match.");
                    save(existing);
                    db.update("DELETE FROM multiplayer_members WHERE user_id=?", u.getId());
                    userRooms.remove(uid);
                }
            }
            if (!Set.of("classic", "duel", "private-room", "bug-fix").contains(mode)) throw error("Unknown mode.");

            boolean competitive = mode.equals("classic") || mode.equals("duel");
            RankedSeason season = null;
            int elo = 1200;
            if (competitive) {
                season = seasons.findByStatus("ACTIVE")
                        .filter(s -> s.getStartsAt().isBefore(Instant.now()) && s.getEndsAt().isAfter(Instant.now()))
                        .orElseThrow(() -> error("Ranked season is unavailable or has ended."));
                elo = rating(u, season).getRating();
            }

            RaceRoom room = null;
            long now = System.currentTimeMillis();

            if (competitive || mode.equals("bug-fix")) {
                for (String id : db.queryForList("SELECT id FROM multiplayer_rooms WHERE state='SEARCHING' ORDER BY updated_at, id", String.class)) {
                    RaceRoom candidate = read(id);
                    advance(candidate);
                    save(candidate);
                    int tolerance = (int) Math.min(600, 100 + (now - candidate.createdAt) / 1000 * 5);
                    final int ownRating = elo;
                    boolean matchesTemplateOrLanguage = (templateId > 0 && candidate.templateId == templateId)
                            || (templateId <= 0 && (language == null || normalizeLang(candidate.language).equals(normalizeLang(language))));
                    // Cannot match with oneself; must be another player's searching room
                    if (candidate.state.equals("SEARCHING") && candidate.mode.equals(mode)
                            && candidate.host != uid
                            && matchesTemplateOrLanguage
                            && Objects.equals(candidate.seasonId, season == null ? null : season.getId())
                            && candidate.players.size() < candidate.capacity
                            && candidate.players.stream().allMatch(p -> Math.abs(p.rating - ownRating) <= tolerance)) {
                        room = candidate;
                        break;
                    }
                }
            }

            if (room == null) {
                PracticeTemplate t = null;
                if (templateId > 0) {
                    t = templates.findByIdAndPublishedTrue(templateId).orElse(null);
                }
                if (t == null) {
                    Set<Long> bugTaskIds = new HashSet<>(db.queryForList("SELECT DISTINCT template_id FROM multiplayer_bug_tasks", Long.class));
                    List<PracticeTemplate> published = templates.findAll().stream()
                            .filter(PracticeTemplate::isPublished)
                            .filter(pt -> {
                                boolean hasBugTask = bugTaskIds.contains(pt.getId());
                                if (mode.equals("bug-fix") && !hasBugTask) return false;
                                if (!mode.equals("bug-fix") && hasBugTask) return false;
                                return true;
                            })
                            .toList();
                    List<PracticeTemplate> langMatches = published.stream()
                            .filter(pt -> language == null || normalizeLang(pt.getLanguage()).equals(normalizeLang(language)))
                            .toList();
                    List<PracticeTemplate> pool = !langMatches.isEmpty() ? langMatches : published;
                    if (pool.isEmpty()) throw error("No practice templates available for this language.");

                    // Truly random template selection avoiding repeating immediate previous template
                    long prevTplId = (existing != null) ? existing.templateId : 0;
                    List<PracticeTemplate> variedPool = pool.stream().filter(pt -> pt.getId() != prevTplId).toList();
                    List<PracticeTemplate> selectionPool = !variedPool.isEmpty() ? variedPool : pool;
                    t = selectionPool.get(random.nextInt(selectionPool.size()));
                }

                List<String> taskRows = db.queryForList("SELECT tests FROM multiplayer_bug_tasks WHERE template_id=?", String.class, t.getId());
                if (mode.equals("bug-fix") && taskRows.isEmpty()) throw error("Choose a validated Bug Fix template.");
                if (!mode.equals("bug-fix") && !taskRows.isEmpty()) throw error("Choose a typing template for this mode.");

                String target;
                try { target = RaceRules.normalize(t.getContent(), t.getLanguage()); } catch (IllegalArgumentException e) { throw error(e.getMessage()); }

                room = new RaceRoom();
                room.mode = mode;
                room.templateId = t.getId();
                room.title = t.getTitle();
                room.language = t.getLanguage();
                room.difficulty = t.getDifficulty().name();
                room.target = target;
                room.capacity = mode.equals("classic") ? 4 : (mode.equals("duel") || mode.equals("bug-fix")) ? 2 : Math.max(2, Math.min(8, capacity));
                room.host = uid;
                room.createdAt = now;
                room.seasonId = season == null ? null : season.getId();
                room.state = mode.equals("private-room") ? "READY" : "SEARCHING";

                if (mode.equals("bug-fix")) {
                    try { room.bugTests = json.readValue(taskRows.getFirst(), new com.fasterxml.jackson.core.type.TypeReference<List<List<Integer>>>() {}); }
                    catch (Exception e) { throw error("Bug Fix tests are invalid."); }
                }

                do {
                    StringBuilder code = new StringBuilder();
                    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                    for (int i = 0; i < 8; i++) code.append(alphabet.charAt(random.nextInt(alphabet.length())));
                    room.id = code.toString();
                } while (db.queryForObject("SELECT COUNT(*) FROM multiplayer_rooms WHERE id=?", Integer.class, room.id) > 0);

                db.update("INSERT INTO multiplayer_rooms(id,state,snapshot) VALUES(?,?,?)", room.id, room.state, "{}");
            }

            add(room, u, elo);
            save(room);
            activeRooms.put(room.id, room);
            userRooms.put(u.getId(), room.id);
            return room;
        }
    }
    private void add(RaceRoom room,User u,int elo) {
        db.update("DELETE FROM multiplayer_members WHERE user_id=?",u.getId());
        db.update("INSERT INTO multiplayer_members(user_id,room_id) VALUES(?,?)",u.getId(),room.id);
        RaceRoom.Player p=new RaceRoom.Player(); p.id=u.getId(); p.name=u.getDisplayName(); p.rating=elo; p.lastSeen=System.currentTimeMillis(); room.players.add(p);
        userRooms.put(u.getId(), room.id);
        if(room.players.size()==room.capacity) {
            if (ranked(room)) {
                for (RaceRoom.Player pl : room.players) {
                    pl.ready = true;
                }
                long now = System.currentTimeMillis();
                room.state = "COUNTDOWN";
                room.startsAt = now + 4000;
                room.deadline = room.startsAt + 180000;
            } else {
                room.state = "READY";
            }
        }
    }
    public RaceRoom join(long uid,String code) {
        synchronized(lifecycleLock) {
            User u=user(uid); String id;
            try { id=RaceRules.roomId(code); } catch(IllegalArgumentException e) { throw error(e.getMessage()); }
            RaceRoom r=read(id); advance(r);
            if(r.players.stream().anyMatch(p->p.id==uid)) {
                userRooms.put(uid, r.id);
                return r;
            }
            RaceRoom current=current(uid);
            if(current!=null&&!terminal(current)) throw error("Leave your current queue or room first.");
            if(!r.mode.equals("private-room")||!r.state.equals("READY")||r.players.size()>=r.capacity) throw error("Room is full, expired, or no longer accepting players.");
            add(r,u,1200);
            save(r);
            activeRooms.put(r.id, r);
            userRooms.put(u.getId(), r.id);
            return r;
        }
    }
    public RaceRoom event(long uid,String id,String type,long sequence,String content,String requestId) {
        if (id == null || id.isBlank()) throw error("Room ID required.");
        String cleanId = RaceRules.roomId(id);
        RaceRoom r = read(cleanId);
        RaceRoom.Player p = member(r, uid);
        advance(r);
        long now = System.currentTimeMillis();
        p.lastSeen = now;

        if (type.equals("SYNC")) {
            save(r);
            return r;
        }
        if (type.equals("CHAT")) {
            if (terminal(r)) throw error("Chat is closed for this room.");
            if (content == null || content.isBlank() || content.length() > 500) throw error("Messages must contain 1–500 characters.");
            String validReqId = (requestId != null && !requestId.isBlank()) ? requestId : UUID.randomUUID().toString();
            if (r.chat.stream().anyMatch(c -> c.senderId() == uid && c.requestId().equals(validReqId))) return r;
            if (now - p.lastChatAt < 100) throw error("Please wait before sending another message.");
            p.lastChatAt = now;
            r.chat.add(new RaceRoom.Chat(UUID.randomUUID().toString(), validReqId, uid, p.name, now, content.strip()));
            if (r.chat.size() > 100) r.chat.removeFirst();
        } else if (type.equals("LEAVE")) {
            if (!terminal(r)) {
                if (r.state.equals("RACING")) {
                    if (p.finishedAt == 0) p.forfeited = true;
                } else if (!r.mode.equals("private-room")) {
                    cancel(r, "A participant left before the race.");
                } else {
                    r.players.remove(p);
                    if (r.players.isEmpty()) {
                        cancel(r, "Room is empty.");
                    } else {
                        r.host = r.players.getFirst().id;
                        r.state = "READY";
                        r.startsAt = 0;
                        r.players.forEach(x -> x.ready = false);
                    }
                }
            }
            userRooms.remove(uid);
            if (!r.state.equals("RACING")) db.update("DELETE FROM multiplayer_members WHERE user_id=? AND room_id=?", uid, r.id);
        } else if (type.equals("CONFIG")) {
            if (!r.state.equals("READY")) throw error("Cannot change configuration while racing.");
            if (r.host != uid) throw error("Only the host can modify room settings.");
            if (content != null && !content.isBlank()) {
                try {
                    JsonNode cfg = json.readTree(content);
                    if (cfg.has("capacity")) {
                        int cap = cfg.get("capacity").asInt();
                        if (cap >= 2 && cap <= 8) r.capacity = cap;
                    }
                    if (cfg.has("templateId")) {
                        long tId = cfg.get("templateId").asLong();
                        if (tId > 0) {
                            templates.findByIdAndPublishedTrue(tId).ifPresent(t -> {
                                try {
                                    r.target = RaceRules.normalize(t.getContent(), t.getLanguage());
                                    r.templateId = t.getId();
                                    r.title = t.getTitle();
                                    r.language = t.getLanguage();
                                    r.difficulty = t.getDifficulty().name();
                                } catch (Exception ignored) {}
                            });
                        }
                    }
                } catch (Exception ignored) {}
            }
        } else if (type.equals("READY")) {
            if (!r.state.equals("READY")) throw error("The room is not ready.");
            p.ready = true;
            p.lastSeen = now;
            int minRequired = ranked(r) ? r.capacity : (r.mode.equals("private-room") ? 1 : 2);
            if (r.players.size() >= minRequired && r.players.stream().allMatch(x -> x.ready)) {
                r.state = "COUNTDOWN";
                r.startsAt = now + 5000;
                r.deadline = r.startsAt + 180000;
            }
        } else if (type.equals("INPUT")) {
            if (!r.state.equals("RACING") || p.forfeited) throw error("Race input is not accepted in this state.");
            if (sequence <= p.sequence || p.finishedAt > 0) return r;
            if (content == null || content.length() > r.target.length() + 1000) throw error("Invalid race input.");
            if (!r.mode.equals("bug-fix") && content.codePointCount(0, content.length()) > Math.max(1, (now - r.startsAt) * maxCharactersPerSecond / 1000))
                throw error("Submission exceeds the permitted typing rate.");
            if (!r.mode.equals("bug-fix")) p.mistakes += RaceRules.newMistakes(r.target, p.input, content.replace("\r\n", "\n").replace('\r', '\n'));
            p.sequence = sequence;
            p.input = content.replace("\r\n", "\n").replace('\r', '\n');
            p.lastSeen = now;
            RaceRules.Metrics m = RaceRules.metrics(r.target, p.input);
            p.errors = m.errors();
            p.progress = m.progress();
            p.score = RaceRules.score(m.correct(), p.mistakes);
            if (r.mode.equals("bug-fix")) {
                boolean passed = BugFixRules.evaluate(p.input, r.bugTests);
                p.progress = passed ? 100 : 0;
                p.errors = passed ? 0 : 1;
                p.score = passed ? r.bugTests.size() : 0;
                if (passed) p.finishedAt = now;
            } else if (p.input.equals(r.target)) p.finishedAt = now;
        } else throw error("Unknown room event.");
        advance(r);
        save(r);
        return r;
    }
    private void cancel(RaceRoom r,String reason) {
        r.state="CANCELLED";
        r.reason=reason;
        activeRooms.remove(r.id);
        for (RaceRoom.Player p : r.players) {
            userRooms.remove(p.id);
        }
        db.update("DELETE FROM multiplayer_members WHERE room_id=?", r.id);
        log.info("Race cancelled match={} reason={}",r.matchId,reason);
    }
    private void advance(RaceRoom r) {
        if(terminal(r)) return;
        long now=System.currentTimeMillis();
        if(ranked(r)) {
            RankedSeason season=seasons.findById(r.seasonId).orElse(null);
            if(season == null || !season.getStatus().equals("ACTIVE")||!season.getEndsAt().isAfter(Instant.ofEpochMilli(now))) {
                cancel(r,"Season ended; no ratings changed.");
                return;
            }
        }
        if(r.state.equals("SEARCHING")&&now-r.createdAt>queueTimeout*1000) { cancel(r,"Matchmaking timed out without enough compatible players."); return; }
        // Private rooms NEVER expire while in READY state!
        if(r.state.equals("READY") && !r.mode.equals("private-room") && now-r.createdAt>600000) { cancel(r,"Room expired before all players were ready."); return; }
        if(r.state.equals("COUNTDOWN")&&now>=r.startsAt) r.state="RACING";
        if(r.state.equals("RACING")) {
            for(RaceRoom.Player p:r.players) if(p.finishedAt==0&&now-p.lastSeen>reconnect*1000) p.forfeited=true;
            boolean allFinishedOrForfeited = r.players.stream().allMatch(p->p.finishedAt>0||p.forfeited);
            boolean duelOver = r.mode.equals("duel") && r.players.stream().anyMatch(p -> p.forfeited);
            if(now>=r.deadline||allFinishedOrForfeited||duelOver) finish(r,now);
        } else if(ranked(r) && r.state.equals("COUNTDOWN")) {
            if (r.players.stream().anyMatch(p -> now - p.lastSeen > reconnect * 1000)) {
                cancel(r,"A participant did not reconnect before the race started.");
            }
        }
    }
    private void finish(RaceRoom r,long now) {
        List<RaceRoom.Player> ordered=new ArrayList<>(r.players);
        ordered.sort(Comparator.comparing((RaceRoom.Player p)->p.forfeited).thenComparing(p->p.finishedAt==0)
                .thenComparing(Comparator.comparingInt((RaceRoom.Player p)->p.score).reversed()).thenComparingLong(p->p.finishedAt==0?Long.MAX_VALUE:p.finishedAt).thenComparing(Comparator.comparingDouble((RaceRoom.Player p)->p.progress).reversed()).thenComparingInt(p->p.errors).thenComparingLong(p->p.id));
        boolean noContest=ordered.stream().allMatch(p->p.finishedAt==0);
        for(int i=0;i<ordered.size();i++) {
            RaceRoom.Player p=ordered.get(i); p.placement=i+1;
            if(i>0 && sameResult(p,ordered.get(i-1))) p.placement=ordered.get(i-1).placement;
            int next=p.rating;
            if(ranked(r)&&!noContest) {
                double opponent=r.players.stream().filter(x->x.id!=p.id).mapToInt(x->x.rating).average().orElse(p.rating);
                boolean tied=ordered.stream().anyMatch(x->x.id!=p.id&&sameResult(x,p));
                double avgPlacement = (r.players.size() + 1.0) / 2.0;
                boolean belowAverage = p.forfeited || p.finishedAt == 0 || (r.players.size() > 1 && p.placement > avgPlacement);
                boolean win = !belowAverage && !p.forfeited && p.finishedAt > 0 && p.placement <= (r.mode.equals("classic") ? 2 : 1);
                int delta = tied ? 0 : RaceRules.elo(p.rating, opponent, win ? 1 : 0);
                if (r.mode.equals("classic") && win && !tied) {
                    delta = Math.max(20, Math.min(32, delta));
                } else if (belowAverage && !tied) {
                    delta = Math.min(-10, delta);
                }
                UserSeasonRating rating=rating(users.findById(p.id).orElseThrow(),seasons.findById(r.seasonId).orElseThrow());
                next=Math.max(300,rating.getRating()+delta); p.delta=next-rating.getRating();
                rating.setRating(next); rating.setPeakRating(Math.max(next,rating.getPeakRating())); rating.setTier(tiers.getTierForRating(next).name());
                rating.setMatchesPlayed(rating.getMatchesPlayed()+1);
                if(!tied) { if(win) rating.setWins(rating.getWins()+1); else rating.setLosses(rating.getLosses()+1); }
                ratings.saveAndFlush(rating);
            }
            db.update("INSERT INTO multiplayer_results(room_id,user_id,season_id,placement,old_rating,new_rating,errors,score,mistakes,elapsed_ms,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                    r.id,p.id,r.seasonId,p.placement,p.rating,next,p.errors,p.score,p.mistakes,p.finishedAt==0?null:p.finishedAt-r.startsAt,java.sql.Timestamp.from(Instant.ofEpochMilli(now)));
        }
        if (ranked(r)) {
            var standings=ratings.findLeaderboardBySeasonId(r.seasonId);
            for(int i=0;i<standings.size();i++) {
                var standing=standings.get(i);
                standing.setTier(tiers.competitiveTier(standing.getRating(),i+1,standing.getMatchesPlayed()));
            }
            ratings.saveAllAndFlush(standings);
        }
        log.info("Race finalization prepared match={} mode={} participants={}",r.matchId,r.mode,r.players.size());
        r.state="COMPLETED"; if(noContest) r.reason="No completed submissions; no ratings changed.";
        db.update("DELETE FROM multiplayer_members WHERE room_id=?", r.id);
    }
    private boolean sameResult(RaceRoom.Player a,RaceRoom.Player b) { return a.forfeited==b.forfeited&&a.finishedAt==b.finishedAt&&a.progress==b.progress&&a.errors==b.errors&&a.score==b.score; }
    public void tick() {
        for (RaceRoom r : new ArrayList<>(activeRooms.values())) {
            if (!terminal(r)) {
                advance(r);
                if (terminal(r)) {
                    save(r);
                }
            }
        }
    }
    public List<Map<String,Object>> history(long uid) {
        user(uid);
        return db.queryForList("SELECT room_id, season_id, placement, old_rating, new_rating, errors, elapsed_ms, completed_at, (season_id IS NOT NULL) as is_ranked, CASE WHEN season_id IS NOT NULL THEN 'Ranked' ELSE 'Unranked' END as match_type FROM multiplayer_results WHERE user_id=? ORDER BY completed_at DESC, room_id LIMIT 30",uid);
    }

    public Map<String, Object> history(long uid, int page, int size) {
        user(uid);
        int validPage = Math.max(0, page);
        int validSize = Math.max(1, Math.min(50, size));
        int offset = validPage * validSize;
        int total = db.queryForObject("SELECT COUNT(*) FROM multiplayer_results WHERE user_id=?", Integer.class, uid);
        List<Map<String, Object>> items = db.queryForList("SELECT room_id, season_id, placement, old_rating, new_rating, errors, elapsed_ms, completed_at, (season_id IS NOT NULL) as is_ranked, CASE WHEN season_id IS NOT NULL THEN 'Ranked' ELSE 'Unranked' END as match_type FROM multiplayer_results WHERE user_id=? ORDER BY completed_at DESC, room_id LIMIT ? OFFSET ?", uid, validSize, offset);
        return Map.of(
            "content", items,
            "page", validPage,
            "size", validSize,
            "total", total,
            "hasMore", offset + items.size() < total
        );
    }

    public void closeRoom(long uid, String roomId) {
        synchronized(lifecycleLock) {
            user(uid);
            RaceRoom r = read(RaceRules.roomId(roomId));
            if (!r.mode.equals("private-room")) throw error("Only private rooms can be closed manually.");
            if (r.host != uid) throw error("Only the room host can close the room.");
            if (r.state.equals("RACING")) {
                boolean hasIncomplete = r.players.stream().anyMatch(p -> p.finishedAt == 0 && !p.forfeited);
                if (hasIncomplete) {
                    throw error("Cannot close room: players are still completing the challenge.");
                }
            }
            cancel(r, "Room closed by host.");
            activeRooms.remove(r.id);
            for (RaceRoom.Player p : r.players) {
                userRooms.remove(p.id);
            }
            db.update("DELETE FROM multiplayer_members WHERE room_id=?", r.id);
            db.update("DELETE FROM multiplayer_rooms WHERE id=?", r.id);
        }
    }

    public RaceRoom leave(long uid) {
        synchronized(lifecycleLock) {
            user(uid);
            RaceRoom r = current(uid);
            if (r == null) return null;
            RaceRoom res = event(uid, r.id, "LEAVE", 0, null, UUID.randomUUID().toString());
            userRooms.remove(uid);
            return res;
        }
    }
}
