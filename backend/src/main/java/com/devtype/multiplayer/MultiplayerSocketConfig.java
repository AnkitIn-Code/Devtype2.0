package com.devtype.multiplayer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.*;
@Configuration
@EnableWebSocket
@EnableScheduling
public class MultiplayerSocketConfig implements WebSocketConfigurer {
    private final MultiplayerSocket socket;
    private final String[] origins;
    public MultiplayerSocketConfig(MultiplayerSocket socket,@Value("${devtype.cors.allowed-origins:http://localhost:5173}") String origins) {
        this.socket=socket; this.origins=origins.split(",");
    }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) { registry.addHandler(socket,"/ws/multiplayer").setAllowedOriginPatterns(origins); }
}
