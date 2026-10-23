package com.placement.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {
        log.error("OAuth2 authentication failure: {}", exception.getMessage());
        String errorUrl = UriComponentsBuilder.fromUriString(frontendUrl.replaceAll("/+$", "") + "/login")
                .queryParam("error", URLEncoder.encode("Google authentication failed: " + exception.getMessage(), StandardCharsets.UTF_8))
                .build().toUriString();
        getRedirectStrategy().sendRedirect(request, response, errorUrl);
    }
}
