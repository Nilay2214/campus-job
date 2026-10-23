package com.placement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class SmsManagerService implements SmsService {

    private final TwilioSmsService twilioSmsService;
    private final MockSmsService mockSmsService;

    @Override
    public boolean sendOtp(String phoneNumber, String message) {
        if (twilioSmsService.isConfigured()) {
            return twilioSmsService.sendOtp(phoneNumber, message);
        } else {
            return mockSmsService.sendOtp(phoneNumber, message);
        }
    }

    @Override
    public String getProviderName() {
        return twilioSmsService.isConfigured() ? twilioSmsService.getProviderName() : mockSmsService.getProviderName();
    }
}
