package com.devtype.multiplayer;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import com.devtype.leaderboard.service.BgmiTierService;
import java.util.List;
class RaceRulesTest {
    @Test void commentsAndStrings() {
        assertThat(RaceRules.normalize("// header\r\nString url = \"https://example.com\"; // note\r\n  run(); /* hi */", "Java"))
            .isEqualTo("String url = \"https://example.com\";\n  run();");
        assertThat(RaceRules.normalize("x = '# not a comment' # comment\n# full\n\ty = 2", "Python")).isEqualTo("x = '# not a comment'\n\ty = 2");
        assertThat(RaceRules.normalize("auto x = R\"tag(/* text */ \"quote\")tag\"; // c", "C++")).contains("/* text */");
        assertThat(RaceRules.normalize("SELECT 'it''s -- literal'; -- comment", "SQL")).isEqualTo("SELECT 'it''s -- literal';");
        assertThatThrownBy(()->RaceRules.normalize("/* only */", "Java")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->RaceRules.normalize("/* missing", "Java")).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void progressHandlesUnicodeDeletionAndMistakes() {
        assertThat(RaceRules.metrics("a😀\nb", "a😀\nx").errors()).isEqualTo(1);
        assertThat(RaceRules.metrics("a😀\nb", "a😀\n").progress()).isEqualTo(75);
        assertThat(RaceRules.metrics("aaab", "aaab").progress()).isEqualTo(100);
        assertThat(RaceRules.metrics("aaab", "a").errors()).isZero();
    }
    @Test void mistakesAreCountedOnlyOnNewEdits() {
        assertThat(RaceRules.newMistakes("abcd", "ab", "abx")).isEqualTo(1);
        assertThat(RaceRules.newMistakes("abcd", "abx", "abx")).isZero();
        assertThat(RaceRules.newMistakes("abcd", "abx", "ab")).isZero();
        assertThat(RaceRules.newMistakes("abcd", "ab", "abc")).isZero();
        assertThat(RaceRules.score(4,1)).isEqualTo(3);
    }
    @Test void ratingsTiersAndResetsAreConsistent() {
        assertThat(RaceRules.elo(1200,1200,1)).isEqualTo(16);
        assertThat(RaceRules.elo(1200,1200,0)).isEqualTo(-16);
        var tiers=new BgmiTierService();
        for(var tier:BgmiTierService.TIERS) {
            assertThat(tiers.getTierForRating(tier.minRating()).name()).isEqualTo(tier.name());
            var reset=tiers.calculateSeasonReset(tier.name(),tier.minRating());
            assertThat(reset.startingTierNextSeason()).isEqualTo(tiers.getTierForRating(reset.startingRatingNextSeason()).name());
        }
        assertThat(tiers.getTierForRating(1200).name()).isEqualTo("Bronze III");
    }
    @Test void multilineLiteralsRetainWhitespaceAndCommentMarkers() {
        String source = "x = \"\"\"first  \n\n  # literal\n\"\"\" # remove";
        assertThat(RaceRules.normalize(source, "Python")).isEqualTo("x = \"\"\"first  \n\n  # literal\n\"\"\"");
    }
    @Test void roomIdsAndPatches() {
        assertThat(RaceRules.roomId(" abcd2345 ")).isEqualTo("ABCD2345");
        assertThatThrownBy(()->RaceRules.roomId("DEV-1234")).isInstanceOf(IllegalArgumentException.class);
        var tests=List.of(List.of(2,3,5),List.of(-3,2,-1),List.of(0,0,0));
        assertThat(BugFixRules.evaluate("def add(a, b):\n    return a + b",tests)).isTrue();
        assertThat(BugFixRules.evaluate("def add(a,b): return a - b",tests)).isFalse();
        assertThat(BugFixRules.evaluate("def add(a,b): return a // 0",tests)).isFalse();
        assertThat(BugFixRules.evaluate("import os",tests)).isFalse();
    }
}
