package com.devtype.multiplayer;

import java.util.*;

/** Persisted immutable template snapshot and recoverable lifecycle state. */
public class RaceRoom {
    public String matchId = UUID.randomUUID().toString();
    public String id, mode, state = "SEARCHING", title, language, difficulty, target, reason;
    public long templateId, host, createdAt, startsAt, deadline, revision;
    public Long seasonId;
    public int capacity;
    public List<List<Integer>> bugTests;
    public List<Player> players = new ArrayList<>();
    // Bounded persisted room history, available only to members.
    public List<Chat> chat = new ArrayList<>();
    public static class Player {
        public long id, lastSeen, sequence, finishedAt, lastChatAt;
        public String name, input = "";
        public boolean ready, forfeited;
        public int rating, errors, mistakes, score, placement, delta;
        public double progress;
    }
    public record Chat(String id, String requestId, long senderId, String sender, long timestamp, String content) {}
}
