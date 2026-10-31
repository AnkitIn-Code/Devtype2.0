package com.devtype.multiplayer;

import java.util.List;
import java.util.regex.Pattern;

/** Bounded interpreter for curated arithmetic patches, never Python/OS execution. */
public final class BugFixRules {
    private BugFixRules() {}
    private static final Pattern FUNCTION = Pattern.compile("\\s*def\\s+add\\s*\\(\\s*a\\s*,\\s*b\\s*\\)\\s*:\\s*return\\s+([ab0-9+*/() \\-]+)\\s*");
    public static boolean evaluate(String source,List<List<Integer>> tests) {
        if(source==null||source.length()>1000||tests==null||tests.isEmpty()) return false;
        var match=FUNCTION.matcher(source);
        if(!match.matches()) return false;
        try {
            for(var test:tests) {
                Parser p=new Parser(match.group(1),test.get(0),test.get(1));
                long result=p.expression(); p.space();
                if(p.index!=p.text.length()||result!=test.get(2)) return false;
            }
            return true;
        } catch(IllegalArgumentException|ArithmeticException e) { return false; }
    }
    private static final class Parser {
        final String text; final long a,b; int index,depth;
        Parser(String text,long a,long b) { this.text=text; this.a=a; this.b=b; }
        void space() { while(index<text.length()&&text.charAt(index)==' ') index++; }
        boolean take(char c) { space(); if(index<text.length()&&text.charAt(index)==c) { index++; return true; } return false; }
        long expression() { long n=product(); while(true) { if(take('+')) n=Math.addExact(n,product()); else if(take('-')) n=Math.subtractExact(n,product()); else return n; } }
        long product() { long n=atom(); while(true) { if(take('*')) n=Math.multiplyExact(n,atom()); else if(take('/')) { if(!take('/')) throw new IllegalArgumentException(); n=Math.floorDiv(n,atom()); } else return n; } }
        long atom() {
            if(++depth>32) throw new IllegalArgumentException();
            try {
                if(take('(')) { long n=expression(); if(!take(')')) throw new IllegalArgumentException(); return n; }
                if(take('-')) return Math.negateExact(atom());
                if(take('a')) return a; if(take('b')) return b;
                space(); int start=index; while(index<text.length()&&Character.isDigit(text.charAt(index))) index++;
                if(start==index) throw new IllegalArgumentException();
                return Long.parseLong(text.substring(start,index));
            } finally { depth--; }
        }
    }
}
