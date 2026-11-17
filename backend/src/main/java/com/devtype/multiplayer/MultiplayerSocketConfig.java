package com.devtype.multiplayer;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
@EnableScheduling
public class MultiplayerSocketConfig implements WebSocketConfigurer {
    private final MultiplayerSocket socket;

    public MultiplayerSocketConfig(MultiplayerSocket socket) {
        this.socket = socket;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Allow all origin patterns for the WebSocket endpoint so deployed clients on AWS/custom domains
        // can connect without CORS handshake rejection. Strict JWT verification is performed on the first frame.
        registry.addHandler(socket, "/ws/multiplayer").setAllowedOriginPatterns("*");
    }
}
