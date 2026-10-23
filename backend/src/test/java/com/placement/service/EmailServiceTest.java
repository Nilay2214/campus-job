package com.placement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendPasswordResetEmail_whenEmailEnabled_sendsFormattedMessage() {
        EmailService service = new EmailService("smtp.example.com", "user@example.com", "noreply@campusjob.com", true, mailSender);
        assertTrue(service.isEmailEnabled());

        service.sendPasswordResetEmail("student@example.com", "http://localhost:3000/reset-password?token=abc123xyz", 30);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("noreply@campusjob.com", sent.getFrom());
        assertArrayEquals(new String[]{"student@example.com"}, sent.getTo());
        assertEquals("Campus Job — Password Reset Request", sent.getSubject());
        assertTrue(Objects.requireNonNull(sent.getText()).contains("http://localhost:3000/reset-password?token=abc123xyz"));
        assertTrue(sent.getText().contains("30 minutes"));
    }

    @Test
    void sendPasswordResetEmail_whenEmailDisabled_doesNotInvokeMailSender() {
        EmailService service = new EmailService("", "", "noreply@campusjob.com", false, mailSender);
        assertFalse(service.isEmailEnabled());

        service.sendPasswordResetEmail("student@example.com", "http://localhost:3000/reset-password?token=abc123xyz", 30);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPlainText_whenMailExceptionThrown_handlesGracefullyWithoutCrashing() {
        EmailService service = new EmailService("smtp.example.com", "user@example.com", "noreply@campusjob.com", true, mailSender);
        doThrow(new MailSendException("SMTP server unreachable")).when(mailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> service.sendPlainText("student@example.com", "Test Subject", "Test Body"));
    }
}
