package com.placement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
@Slf4j
public class TwilioSmsService implements SmsService {

    @Value("${TWILIO_ACCOUNT_SID:${app.twilio.account-sid:}}")
    private String accountSid;

    @Value("${TWILIO_AUTH_TOKEN:${app.twilio.auth-token:}}")
    private String authToken;

    @Value("${TWILIO_PHONE_NUMBER:${app.twilio.phone-number:}}")
    private String fromPhoneNumber;

    private volatile HttpClient httpClient;

    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && fromPhoneNumber != null && !fromPhoneNumber.isBlank();
    }

    @Override
    public boolean sendOtp(String phoneNumber, String message) {
        if (!isConfigured()) {
            log.warn("Twilio credentials not configured. SMS delivery skipped.");
            return false;
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid.trim() + "/Messages.json";
            String formBody = "To=" + URLEncoder.encode(phoneNumber.trim(), StandardCharsets.UTF_8)
                    + "&From=" + URLEncoder.encode(fromPhoneNumber.trim(), StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            String auth = accountSid.trim() + ":" + authToken.trim();
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = getHttpClient().send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("SMS successfully dispatched via Twilio to {}", maskPhoneNumber(phoneNumber));
                return true;
            } else {
                log.error("Twilio SMS failed with HTTP status {}: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception ex) {
            log.error("Failed to dispatch SMS via Twilio to {}: {}", maskPhoneNumber(phoneNumber), ex.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "TWILIO";
    }

    private HttpClient getHttpClient() {
        if (httpClient == null) {
            synchronized (this) {
                if (httpClient == null) {
                    httpClient = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(5))
                            .build();
                }
            }
        }
        return httpClient;
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 6) return "***";
        return phone.substring(0, 3) + "*****" + phone.substring(phone.length() - 2);
    }
}
