package com.devtype.multiplayer;

import com.devtype.common.exception.ApiException;
import com.fasterxml.jackson.databind.*;
import org.slf4j.*;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MultiplayerSocket extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(MultiplayerSocket.class);
    private final MultiplayerService service;
    private final JwtDecoder decoder;
    private final ObjectMapper json;
    private final Map<String, Client> clients = new ConcurrentHashMap<>();

    private static class Client {
        final WebSocketSession socket;
        Long user;
        Instant expires;
        String room;
        long opened = System.currentTimeMillis();
        long last = opened;
        long window = opened;
        int messages = 0;
        Client(WebSocketSession socket) { this.socket = socket; }
    }

    public MultiplayerSocket(MultiplayerService service, JwtDecoder decoder, ObjectMapper json) {
        this.service = service;
        this.decoder = decoder;
        this.json = json;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        session.setTextMessageSizeLimit(65536);
        clients.put(session.getId(), new Client(session));
    }

    private void send(Client c, Object payload) throws Exception {
        synchronized (c.socket) {
            if (c.socket.isOpen()) {
                c.socket.sendMessage(new TextMessage(json.writeValueAsString(payload)));
            }
        }
    }

    private void sendDirect(Client c, TextMessage msg) {
        try {
            synchronized (c.socket) {
                if (c.socket.isOpen()) {
                    c.socket.sendMessage(msg);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send socket frame to user {}: {}", c.user, e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Client c = clients.get(session.getId());
        if (c == null) return;
        try {
            long now = System.currentTimeMillis();
            if (now - c.window >= 1000) {
                c.window = now;
                c.messages = 0;
            }
            if (++c.messages > 60) {
                send(c, Map.of("type", "ERROR", "message", "Too many messages. Slow down."));
                return;
            }
            JsonNode frame = json.readTree(message.getPayload());
            String type = frame.path("type").asText();

            if (c.user == null) {
                if (!type.equals("AUTH")) {
                    session.close(CloseStatus.POLICY_VIOLATION);
                    return;
                }
                Jwt jwt = decoder.decode(frame.path("token").asText());
                c.user = Long.parseLong(jwt.getSubject());
                c.expires = jwt.getExpiresAt();
                RaceRoom room = service.current(c.user);
                c.room = room == null ? null : room.id;
                send(c, Map.of("type", "AUTHENTICATED", "serverTime", now));
                if (room != null) {
                    send(c, Map.of("type", "STATE", "room", room, "serverTime", now));
                }
                return;
            }

            if (c.expires == null || !c.expires.isAfter(Instant.now())) {
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }
            c.last = now;

            if (type.equals("PING")) {
                send(c, Map.of("type", "PONG", "serverTime", now));
                return;
            }

            String roomId = frame.path("roomId").asText(null);
            if (roomId != null && !roomId.isBlank() && !roomId.equals("null")) {
                c.room = roomId;
            }

            String targetRoom = (c.room != null && !c.room.isBlank()) ? c.room : roomId;
            RaceRoom room = service.event(
                c.user,
                targetRoom,
                type,
                frame.path("sequence").asLong(),
                frame.path("content").asText(null),
                frame.path("requestId").asText(null)
            );
            c.last = now;

            if (type.equals("LEAVE")) {
                c.room = null;
                try { send(c, Map.of("type", "LEFT")); } catch (Exception ignored) {}
            } else if (room != null) {
                c.room = room.id;
            }

            if (room != null) {
                broadcastToRoom(room, now);
            }
        } catch (ApiException | IllegalArgumentException e) {
            send(c, Map.of("type", "ERROR", "message", e.getMessage()));
        } catch (JwtException e) {
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (Exception e) {
            log.error("Multiplayer event failed: {}", e.getMessage());
            send(c, Map.of("type", "ERROR", "message", "Unable to process event. Reconnect to restore room state."));
        }
    }

    public void broadcastToRoom(RaceRoom room, long serverTime) {
        if (room == null || room.id == null) return;
        try {
            Map<String, Object> payload = Map.of("type", "STATE", "room", room, "serverTime", serverTime);
            TextMessage stateMsg = new TextMessage(json.writeValueAsString(payload));
            for (Client client : clients.values()) {
                if (client.user != null) {
                    boolean isMatchingRoom = room.id.equals(client.room);
                    boolean isPlayerInRoom = room.players.stream().anyMatch(p -> p.id == client.user);
                    if (isMatchingRoom || isPlayerInRoom) {
                        if (client.room == null) client.room = room.id;
                        sendDirect(client, stateMsg);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to serialize broadcast payload: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Socket closed (e.g. Page reload, tab closed, or temporary network drop).
        // NEVER leave or disband the room on socket disconnect!
        // The room stays active until the user explicitly clicks Leave or closes the room.
        clients.remove(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        clients.remove(session.getId());
        session.close(CloseStatus.SERVER_ERROR);
    }

    @Scheduled(fixedDelay = 1000)
    public void publish() {
        try {
            service.tick();
        } catch (Exception e) {
            log.error("Race lifecycle tick failed: {}", e.getMessage());
        }
        long now = System.currentTimeMillis();
        for (Client c : clients.values()) {
            try {
                if ((c.user == null && now - c.opened > 10000) ||
                    (c.user != null && (c.expires == null || !c.expires.isAfter(Instant.now()) || now - c.last > 120000))) {
                    c.socket.close(CloseStatus.POLICY_VIOLATION);
                    continue;
                }
                if (c.user != null && c.room != null) {
                    RaceRoom room = service.getCachedRoom(c.room);
                    if (room != null && (room.id.equals(c.room) || room.players.stream().anyMatch(p -> p.id == c.user))) {
                        send(c, Map.of("type", "STATE", "room", room, "serverTime", now));
                    }
                }
            } catch (Exception e) {
                try { c.socket.close(CloseStatus.SERVER_ERROR); } catch (Exception ignored) { clients.remove(c.socket.getId()); }
            }
        }
    }
}
