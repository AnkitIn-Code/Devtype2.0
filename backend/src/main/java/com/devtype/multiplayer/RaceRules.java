package com.devtype.multiplayer;

import java.util.*;

/** Deterministic race rules. No submitted code is ever executed. */
public final class RaceRules {
    private RaceRules() {}
    public static String roomId(String value) {
        String id = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!id.matches("[A-Z2-9]{8}")) throw new IllegalArgumentException("Enter an eight-character room ID.");
        return id;
    }
    public record Metrics(int correct, int errors, double progress) {}
    public static Metrics metrics(String target, String input) {
        int[] expected = target.codePoints().toArray(), actual = input.codePoints().toArray();
        int correct = 0;
        for (int i = 0; i < actual.length; i++) if (i < expected.length && actual[i] == expected[i]) correct++;
        return new Metrics(correct, actual.length - correct, expected.length == 0 ? 0 : 100.0 * correct / expected.length);
    }
    public static int newMistakes(String target, String before, String after) {
        int[] old=before.codePoints().toArray(), next=after.codePoints().toArray(), expected=target.codePoints().toArray();
        int prefix=0;
        while(prefix<old.length&&prefix<next.length&&old[prefix]==next[prefix]) prefix++;
        int suffix=0;
        while(suffix<old.length-prefix&&suffix<next.length-prefix&&old[old.length-1-suffix]==next[next.length-1-suffix]) suffix++;
        int mistakes=0;
        for(int i=prefix;i<next.length-suffix;i++) if(i>=expected.length||next[i]!=expected[i]) mistakes++;
        return mistakes;
    }
    public static int score(int correctCharacters, int mistakes) { return Math.max(0,correctCharacters-mistakes); }
    public static int elo(int rating, double opponentRating, double outcome) {
        double expected = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
        int delta = (int) Math.round(32 * (outcome - expected));
        if (outcome == 1) delta = Math.max(8, delta);
        if (outcome == 0) delta = Math.min(-6, delta);
        return delta;
    }
    /** Lexical scanner: comments are recognized only outside quoted literals. */
    public static String normalize(String source, String language) {
        if (source == null || source.length() > 30000) throw new IllegalArgumentException("Template is empty or too large.");
        String s = source.replace("\r\n", "\n").replace('\r', '\n');
        String lang = language != null ? language.trim().toLowerCase(Locale.ROOT) : "";
        if (lang.equals("cpp")) lang = "c++";
        if (lang.equals("js")) lang = "javascript";
        if (lang.equals("ts")) lang = "typescript";
        if (lang.equals("py")) lang = "python";
        if (lang.equals("golang")) lang = "go";
        if (lang.equals("rs")) lang = "rust";

        if (!Set.of("c", "c++", "java", "python", "go", "sql", "javascript", "typescript", "rust").contains(lang))
            throw new IllegalArgumentException("This language is not yet supported for multiplayer comment parsing.");
        boolean sql = lang.equals("sql");
        boolean python = lang.equals("python");
        if (s.indexOf(1) >= 0 || s.indexOf(2) >= 0) throw new IllegalArgumentException("Unsupported template control character.");
        List<String> literals = new ArrayList<>();
        StringBuilder out = new StringBuilder();
        if (sql && s.contains("$")) throw new IllegalArgumentException("SQL dollar-quoted templates require parser support.");
        for (int i = 0; i < s.length();) {
            char c = s.charAt(i);
            // C++ raw strings may contain quotes and comment markers.
            if (lang.equals("c++") && s.startsWith("R\"", i)) {
                int paren = s.indexOf('(', i + 2);
                if (paren < 0 || paren - i > 18) throw new IllegalArgumentException("Malformed raw string.");
                String end = ")" + s.substring(i + 2, paren) + "\"";
                int stop = s.indexOf(end, paren + 1);
                if (stop < 0) throw new IllegalArgumentException("Unterminated raw string.");
                out.append(literal(literals, s.substring(i, stop + end.length()))); i = stop + end.length(); continue;
            }
            if (c == '\'' || c == '"' || c == '`') {
                String delimiter = String.valueOf(c);
                if ((python || lang.equals("java")) && s.startsWith(delimiter.repeat(3), i)) delimiter = delimiter.repeat(3);
                int begin = i; i += delimiter.length(); boolean closed = false;
                while (i < s.length()) {
                    if (s.charAt(i) == '\\' && !(lang.equals("go") && c == '`')) { i += 2; continue; }
                    if (s.startsWith(delimiter, i)) {
                        i += delimiter.length();
                        if (sql && i < s.length() && s.charAt(i) == c) { i++; continue; }
                        closed = true; break;
                    }
                    i++;
                }
                if (!closed) throw new IllegalArgumentException("Unterminated template string.");
                String quoted = s.substring(begin, i);
                out.append(literal(literals, quoted)); continue;
            }
            boolean line = (python) ? c == '#' : (sql ? s.startsWith("--", i) : s.startsWith("//", i));
            if (line) { while (i < s.length() && s.charAt(i) != '\n') i++; continue; }
            if (!python && s.startsWith("/*", i)) {
                int end = s.indexOf("*/", i + 2);
                if (end < 0) throw new IllegalArgumentException("Unterminated template comment.");
                int nested = s.indexOf("/*", i + 2);
                if (sql && nested >= 0 && nested < end) throw new IllegalArgumentException("Nested SQL comments require parser support.");
                out.append(' ');
                for (int j = i; j < end; j++) if (s.charAt(j) == '\n') out.append('\n');
                i = end + 2; continue;
            }
            out.append(c); i++;
        }
        String result = out.toString().lines().map(String::stripTrailing).filter(line -> !line.isBlank()).reduce((a,b) -> a + "\n" + b).orElse("");
        if (result.isBlank()) throw new IllegalArgumentException("Template has no required code.");
        for (int i = 0; i < literals.size(); i++) result = result.replace("\u0001" + i + "\u0002", literals.get(i));
        return result;
    }
    private static String literal(List<String> literals, String value) {
        literals.add(value); return "\u0001" + (literals.size() - 1) + "\u0002";
    }
}
