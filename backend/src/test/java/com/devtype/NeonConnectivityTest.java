package com.devtype;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+", disabledReason = "Live Neon PostgreSQL connectivity test requires DB_PASSWORD environment variable to be set")
class NeonConnectivityTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Verify live Neon PostgreSQL database connectivity and query execution")
    void testLiveNeonDatabaseConnection() throws Exception {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery("SELECT current_database(), current_user, version()")) {
            assertThat(rs.next()).isTrue();
            String db = rs.getString(1);
            String user = rs.getString(2);
            String version = rs.getString(3);

            System.out.println("=================================================");
            System.out.println(">>> LIVE NEON POSTGRESQL CONNECTIVITY CONFIRMED! <<<");
            System.out.println("Current Database: " + db);
            System.out.println("Current User:     " + user);
            System.out.println("PostgreSQL Engine: " + version);
            
            try (ResultSet tables = statement.executeQuery(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")) {
                System.out.println("Existing Public Tables:");
                int count = 0;
                while (tables.next()) {
                    System.out.println(" - " + tables.getString(1));
                    count++;
                }
                if (count == 0) {
                    System.out.println(" (No tables found in public schema - clean database)");
                }
            }
            System.out.println("=================================================");

            assertThat(db).isEqualTo("neondb");
            assertThat(user).isEqualTo("neondb_owner");
        }
    }
}
