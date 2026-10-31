package com.devtype.multiplayer;

import com.devtype.auth.service.JwtService;
import com.devtype.leaderboard.*;
import com.devtype.leaderboard.service.LeaderboardService;
import com.devtype.template.*;
import com.devtype.user.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={"spring.datasource.url=jdbc:h2:mem:multiplayer_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;INIT=CREATE DOMAIN IF NOT EXISTS TIMESTAMPTZ AS TIMESTAMP WITH TIME ZONE"})
@ActiveProfiles("test")
class MultiplayerIntegrationTest {
    @Autowired MultiplayerService service;
    @Autowired UserRepository users;
    @Autowired PracticeTemplateRepository templates;
    @Autowired RankedSeasonRepository seasons;
    @Autowired UserSeasonRatingRepository ratings;
    @Autowired LeaderboardService leaderboard;
    @Autowired JdbcTemplate db;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @LocalServerPort int port;
    long template;
    @BeforeEach void setup() {
        db.update("DELETE FROM multiplayer_results"); db.update("DELETE FROM multiplayer_members"); db.update("DELETE FROM multiplayer_rooms");
        var season=seasons.findByStatus("ACTIVE").orElseThrow(); season.setEndsAt(Instant.now().plusSeconds(86400)); seasons.save(season);
        template=templates.save(new PracticeTemplate("Race test",UUID.randomUUID().toString(),"Java",DifficultyLevel.BEGINNER,"Test","int a = 1; // ignored",60)).getId();
    }
    User player() { String name="race"+UUID.randomUUID().toString().replace("-","").substring(0,12); return users.save(new User(name,name+"@test.local","not-a-password",name)); }
    RaceRoom ready(List<User> group,String mode) {
        RaceRoom r=null;
        for(User u:group) r=service.enter(u.getId(),mode,template,4);
        for(User u:group) r=service.event(u.getId(),r.id,"READY",0,null,null);
        return r;
    }
    void advanceClock(RaceRoom r) throws Exception {
        r.startsAt=System.currentTimeMillis()-1000; r.deadline=System.currentTimeMillis()+30000;
        db.update("UPDATE multiplayer_rooms SET snapshot=? WHERE id=?",json.writeValueAsString(r),r.id);
        service.tick();
    }
    @Test void fourPlayersFinishOnlyOnceAndLeaderboardUsesUniquePositions() throws Exception {
        var group=List.of(player(),player(),player(),player());
        RaceRoom r=ready(group,"classic"); assertThat(r.state).isEqualTo("COUNTDOWN"); assertThat(r.players).hasSize(4);
        advanceClock(r);
        for(User u:group) { r=service.event(u.getId(),r.id,"INPUT",1,r.target,null); Thread.sleep(2); }
        assertThat(r.state).isEqualTo("COMPLETED");
        assertThat(service.history(group.getFirst().getId())).hasSize(1);
        assertThatThrownBy(()->service.event(group.getFirst().getId(),service.current(group.getFirst().getId()).id,"INPUT",1,"int a = 1;",null)).hasMessageContaining("state");
        assertThat(db.queryForObject("SELECT COUNT(*) FROM multiplayer_results",Integer.class)).isEqualTo(4);
        var entries=leaderboard.getLeaderboard("all");
        assertThat(entries.stream().map(e->e.rank()).distinct().count()).isEqualTo(entries.size());
        assertThat(r.players.get(0).delta).isBetween(20,32);
    }
    @Test void concurrentDuplicateQueueRequestsClaimEachUserOnce() throws Exception {
        User a=player(),b=player();
        try(var pool=Executors.newFixedThreadPool(8)) {
            var tasks=new ArrayList<Callable<RaceRoom>>();
            for(int i=0;i<12;i++) { long id=i%2==0?a.getId():b.getId(); tasks.add(()->service.enter(id,"duel",template,2)); }
            var results=pool.invokeAll(tasks);
            Set<String> ids=new HashSet<>(); for(var f:results) ids.add(f.get().id);
            assertThat(ids).hasSize(1);
        }
        assertThat(service.current(a.getId()).players).hasSize(2);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM multiplayer_members",Integer.class)).isEqualTo(2);
    }
    @Test void privateCapacityAuthorizationAndUnrankedRatings() throws Exception {
        User a=player(),b=player(),outsider=player(); RaceRoom r=service.enter(a.getId(),"private-room",template,2);
        assertThat(r.id).hasSize(8); service.join(b.getId(),r.id.toLowerCase());
        assertThatThrownBy(()->service.join(outsider.getId(),r.id)).hasMessageContaining("full");
        assertThatThrownBy(()->service.event(outsider.getId(),r.id,"CHAT",0,"hello","id")).hasMessageContaining("membership");
        service.event(a.getId(),r.id,"CHAT",0,"hello","one");
        assertThat(service.event(a.getId(),r.id,"CHAT",0,"hello","one").chat).hasSize(1);
        service.event(a.getId(),r.id,"READY",0,null,null); RaceRoom running=service.event(b.getId(),r.id,"READY",0,null,null); advanceClock(running);
        service.event(a.getId(),r.id,"INPUT",1,r.target,null); service.event(b.getId(),r.id,"INPUT",1,r.target,null);
        assertThat(service.current(a.getId()).state).isEqualTo("COMPLETED");
        assertThat(ratings.findByUserIdAndSeasonId(a.getId(),seasons.findByStatus("ACTIVE").orElseThrow().getId())).isEmpty();
    }
    @Test void expiredQueuesAndSeasonsCancelWithoutRatingChanges() throws Exception {
        User a=player(); RaceRoom r=service.enter(a.getId(),"duel",template,2); r.createdAt-=180000;
        db.update("UPDATE multiplayer_rooms SET snapshot=? WHERE id=?",json.writeValueAsString(r),r.id);
        assertThat(service.current(a.getId()).state).isEqualTo("CANCELLED");
        var season=seasons.findByStatus("ACTIVE").orElseThrow(); season.setEndsAt(Instant.now().minusSeconds(1)); seasons.save(season);
        int number=season.getSeasonNumber();
        try(var pool=Executors.newFixedThreadPool(2)) {
            for(var result:pool.invokeAll(List.<Callable<Object>>of(()->leaderboard.endSeasonAndResetTiers(),()->leaderboard.endSeasonAndResetTiers()))) result.get();
        }
        assertThat(seasons.findByStatus("ACTIVE").orElseThrow().getSeasonNumber()).isEqualTo(number+1);
        assertThat(seasons.findById(season.getId())).isPresent();
    }
    @Test void realAuthenticatedWebSocketsChatIsolationAndReconnect() throws Exception {
        User a=player(),b=player(),c=player(); RaceRoom room=service.enter(a.getId(),"private-room",template,2); service.join(b.getId(),room.id);
        RaceRoom other=service.enter(c.getId(),"private-room",template,2);
        try(SocketClient one=new SocketClient(a); SocketClient two=new SocketClient(b); SocketClient three=new SocketClient(c)) {
            one.await("AUTHENTICATED"); two.await("AUTHENTICATED"); three.await("AUTHENTICATED");
            one.send(Map.of("type","CHAT","roomId",room.id,"content","isolated hello","requestId","chat1"));
            assertThat(two.awaitChat("isolated hello").path("room").path("id").asText()).isEqualTo(room.id);
            three.send(Map.of("type","CHAT","roomId",room.id,"content","intrusion","requestId","bad"));
            assertThat(three.await("ERROR").path("message").asText()).contains("membership");
            assertThat(service.current(c.getId()).id).isEqualTo(other.id);
            assertThat(service.current(c.getId()).chat).isEmpty();
        }
        try(SocketClient restored=new SocketClient(a)) { assertThat(restored.awaitChat("isolated hello").path("room").path("id").asText()).isEqualTo(room.id); }
    }
    @Test void failedResultTransactionRollsBackEveryRatingAndCanRetry() throws Exception {
        User a=player(), b=player(); RaceRoom r=ready(List.of(a,b),"duel"); advanceClock(r);
        service.event(a.getId(),r.id,"INPUT",1,r.target,null);
        db.execute("ALTER TABLE multiplayer_results ADD CONSTRAINT test_reject_results CHECK (errors > 999)");
        try {
            assertThatThrownBy(()->service.event(b.getId(),r.id,"INPUT",1,r.target,null)).isInstanceOf(RuntimeException.class);
            assertThat(db.queryForObject("SELECT COUNT(*) FROM multiplayer_results",Integer.class)).isZero();
            assertThat(ratings.findByUserIdAndSeasonId(a.getId(),r.seasonId).orElseThrow().getRating()).isEqualTo(1200);
            assertThat(service.current(a.getId()).state).isEqualTo("RACING");
        } finally { db.execute("ALTER TABLE multiplayer_results DROP CONSTRAINT test_reject_results"); }
        assertThat(service.event(b.getId(),r.id,"INPUT",1,r.target,null).state).isEqualTo("COMPLETED");
    }
    @Test void onlyOneConcurrentJoinCanClaimLastSlot() throws Exception {
        User host=player(), a=player(), b=player(); RaceRoom r=service.enter(host.getId(),"private-room",template,2);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var results=pool.invokeAll(List.<Callable<Boolean>>of(
                ()->{try {service.join(a.getId(),r.id);return true;}catch(com.devtype.common.exception.ApiException e){return false;}},
                ()->{try {service.join(b.getId(),r.id);return true;}catch(com.devtype.common.exception.ApiException e){return false;}}));
            assertThat(results.get(0).get() ^ results.get(1).get()).isTrue();
        }
        assertThat(service.current(host.getId()).players).hasSize(2);
    }
    @Test void bugFixIsPlayableAndNeverCreatesRankedStatistics() throws Exception {
        User a=player(), b=player(); long task=templates.findBySlug("multiplayer-fix-addition").orElseThrow().getId();
        RaceRoom r=service.enter(a.getId(),"bug-fix",task,2); service.enter(b.getId(),"bug-fix",task,2);
        service.event(a.getId(),r.id,"READY",0,null,null); r=service.event(b.getId(),r.id,"READY",0,null,null); advanceClock(r);
        r=service.event(a.getId(),r.id,"INPUT",1,"def add(a,b): return a // 0",null);
        assertThat(r.players.getFirst().finishedAt).isZero();
        service.event(a.getId(),r.id,"INPUT",2,"def add(a,b): return a+b",null);
        assertThat(service.event(b.getId(),r.id,"INPUT",1,"def add(a,b): return b+a",null).state).isEqualTo("COMPLETED");
        assertThat(ratings.findByUserIdAndSeasonId(a.getId(),seasons.findByStatus("ACTIVE").orElseThrow().getId())).isEmpty();
    }
    @Test void disconnectGracePreventsImmediateForfeitThenExpires() throws Exception {
        User a=player(),b=player(); RaceRoom r=ready(List.of(a,b),"duel"); advanceClock(r);
        r=service.event(a.getId(),r.id,"INPUT",1,r.target,null);
        r.players.get(1).lastSeen=System.currentTimeMillis()-10000;
        db.update("UPDATE multiplayer_rooms SET snapshot=? WHERE id=?",json.writeValueAsString(r),r.id);
        assertThat(service.current(a.getId()).state).isEqualTo("RACING");
        r.players.get(1).lastSeen=System.currentTimeMillis()-31000;
        db.update("UPDATE multiplayer_rooms SET snapshot=? WHERE id=?",json.writeValueAsString(r),r.id);
        RaceRoom finished=service.current(a.getId()); assertThat(finished.state).isEqualTo("COMPLETED");
        assertThat(finished.players.get(1).forfeited).isTrue();
    }
    @Test void leavingAnActiveRaceKeepsReservationUntilResultCommits() throws Exception {
        User a=player(),b=player(); RaceRoom r=ready(List.of(a,b),"duel"); advanceClock(r);
        assertThat(service.event(a.getId(),r.id,"LEAVE",0,null,null).players.getFirst().forfeited).isTrue();
        assertThatThrownBy(()->service.enter(a.getId(),"classic",template,4)).hasMessageContaining("current");
        assertThat(service.event(b.getId(),r.id,"INPUT",1,r.target,null).state).isEqualTo("COMPLETED");
        assertThat(service.enter(a.getId(),"classic",template,4).id).isNotEqualTo(r.id);
    }
    @Test void equalRatingsUseTheSameOrdinalOnPersonalAndGlobalPages() {
        User a=player(),b=player(); Long season=seasons.findByStatus("ACTIVE").orElseThrow().getId();
        service.enter(a.getId(),"duel",template,2); service.enter(b.getId(),"duel",template,2);
        var ra=ratings.findByUserIdAndSeasonId(a.getId(),season).orElseThrow(); ra.setRating(4300); ra.setPeakRating(4300); ra.setMatchesPlayed(1); ratings.save(ra);
        var rb=ratings.findByUserIdAndSeasonId(b.getId(),season).orElseThrow(); rb.setRating(4300); rb.setPeakRating(4300); rb.setMatchesPlayed(1); ratings.save(rb);
        var entries=leaderboard.getLeaderboard("Conqueror");
        assertThat(entries.stream().filter(e->e.userId().equals(a.getId())).findFirst().orElseThrow().seasonTier()).isEqualTo("Conqueror");
        var auth=new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(b.getId().toString(),"",List.of());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        try { assertThat(leaderboard.getUserRank().rank()).isEqualTo(entries.stream().filter(e->e.userId().equals(b.getId())).findFirst().orElseThrow().rank()); }
        finally { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }
    }

    class SocketClient implements AutoCloseable,WebSocket.Listener {
        final BlockingQueue<JsonNode> frames=new LinkedBlockingQueue<>(); final StringBuilder buffer=new StringBuilder(); final WebSocket ws;
        SocketClient(User user) throws Exception {
            ws=HttpClient.newHttpClient().newWebSocketBuilder().header("Origin","http://localhost:5173").buildAsync(URI.create("ws://localhost:"+port+"/ws/multiplayer"),this).get(5,TimeUnit.SECONDS);
            send(Map.of("type","AUTH","token",jwt.generateToken(user)));
        }
        public void onOpen(WebSocket socket) { socket.request(1); }
        public CompletionStage<?> onText(WebSocket socket,CharSequence data,boolean last) {
            buffer.append(data); if(last) { try { frames.add(json.readTree(buffer.toString())); } catch(Exception e) { throw new RuntimeException(e); } buffer.setLength(0); } socket.request(1); return null;
        }
        void send(Object value) throws Exception { ws.sendText(json.writeValueAsString(value),true).get(5,TimeUnit.SECONDS); }
        JsonNode await(String type) throws Exception { long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(8); while(System.nanoTime()<end) { JsonNode n=frames.poll(1,TimeUnit.SECONDS); if(n!=null&&n.path("type").asText().equals(type)) return n; } throw new AssertionError("Missing frame: "+type); }
        JsonNode awaitChat(String text) throws Exception { long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(8); while(System.nanoTime()<end) { JsonNode n=frames.poll(1,TimeUnit.SECONDS); if(n!=null&&n.toString().contains(text)) return n; } throw new AssertionError("Missing chat"); }
        public void close() { ws.sendClose(WebSocket.NORMAL_CLOSURE,"done"); }
    }
}
