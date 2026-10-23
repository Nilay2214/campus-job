package com.placement.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockSmsService implements SmsService {

    @Override
    public boolean sendOtp(String phoneNumber, String message) {
        log.info("[DEVELOPMENT SIMULATION] Mock SMS dispatched for {}. Verification message: {}", maskPhoneNumber(phoneNumber), message);
        return true;
    }

    @Override
    public String getProviderName() {
        return "MOCK";
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 6) return "***";
        return phone.substring(0, 3) + "*****" + phone.substring(phone.length() - 2);
    }
}
