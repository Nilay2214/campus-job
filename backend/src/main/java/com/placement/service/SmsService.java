package com.placement.service;

public interface SmsService {
    boolean sendOtp(String phoneNumber, String message);
    String getProviderName();
}
