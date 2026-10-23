package com.placement.controller;

import com.placement.dto.AuthResponse;
import com.placement.dto.ForgotPasswordRequest;
import com.placement.dto.LoginRequest;
import com.placement.dto.RegisterRequest;
import com.placement.dto.ResetPasswordRequest;
import com.placement.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Public endpoints for user registration and login. No JWT token required.")
public class AuthController {

    private final AuthService authService;
    private final com.placement.service.FirebaseTokenVerifier firebaseTokenVerifier;

    @PostMapping("/register")
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account and returns a JWT token, role, and success message. " +
                          "This endpoint is public (no authentication required)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(value = "{\"token\":\"eyJhbGciOiJIUzI1NiJ9...\",\"role\":\"STUDENT\",\"message\":\"Registration successful\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid input or email already exists",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Email already exists\"}"))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - not applicable for registration",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}")))
    })
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(
            summary = "Login a user",
            description = "Authenticates a user with email and password and returns a JWT token, role, and success message. " +
                          "This endpoint is public (no authentication required)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(value = "{\"token\":\"eyJhbGciOiJIUzI1NiJ9...\",\"role\":\"STUDENT\",\"message\":\"Login successful\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"email\":\"must not be blank\"}"))),
            @ApiResponse(responseCode = "401", description = "Invalid email or password",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid email or password\"}")))
    })
public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    @Operation(
            summary = "Google OAuth / OIDC authentication",
            description = "Authenticates or registers a user via Google verified identity and returns a standard JWT token, role, and success message."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Google authentication successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body or missing email",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Email is required for OAuth login\"}"))),
            @ApiResponse(responseCode = "401", description = "Account is disabled",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Account is disabled. Please contact administrator.\"}")))
    })
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody com.placement.dto.GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.processOAuthPostLogin(
                request.getEmail(),
                request.getFullName(),
                request.getGoogleId(),
                "GOOGLE"
        ));
    }

    @PostMapping("/firebase")
    @Operation(
            summary = "Firebase Google authentication",
            description = "Cryptographically verifies a Firebase ID token, resolves or registers user (as STUDENT if new, or preserves existing role), checks disabled status, and returns a standard Campus Job JWT."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Firebase authentication successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body or invalid/expired Firebase ID token",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid or expired Firebase ID token\"}"))),
            @ApiResponse(responseCode = "401", description = "Account is disabled or unauthenticated",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Account is disabled. Please contact administrator.\"}")))
    })
    public ResponseEntity<AuthResponse> firebaseLogin(@Valid @RequestBody com.placement.dto.FirebaseLoginRequest request) {
        com.placement.service.FirebaseTokenVerifier.FirebaseUserData userData =
                firebaseTokenVerifier.verifyToken(request.getIdToken());
        return ResponseEntity.ok(authService.processOAuthPostLogin(
                userData.email(),
                userData.name(),
                userData.uid(),
                "FIREBASE_GOOGLE"
        ));
    }

    @PostMapping("/mobile/request-otp")
    @Operation(
            summary = "Request Mobile OTP",
            description = "Sends a 6-digit OTP code to the given international phone number. Includes rate limiting and resend cooldown."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OTP request dispatched successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"message\":\"OTP has been sent to your mobile number.\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid phone number format",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid phone number format\"}"))),
            @ApiResponse(responseCode = "409", description = "Cooldown active or rate limit reached",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Please wait 45 seconds before requesting another OTP.\"}")))
    })
    public ResponseEntity<Object> requestMobileOtp(@Valid @RequestBody com.placement.dto.MobileOtpRequest request) {
        String message = authService.requestMobileOtp(request.getPhoneNumber());
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }

    @PostMapping("/mobile/verify-otp")
    @Operation(
            summary = "Verify Mobile OTP & Authenticate",
            description = "Verifies the 6-digit OTP code, registers new user as STUDENT or preserves existing role, and returns standard JWT."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OTP verified and authenticated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request format",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid phone number or OTP format\"}"))),
            @ApiResponse(responseCode = "401", description = "Invalid OTP, expired OTP, or account disabled",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid OTP code. 2 attempts remaining.\"}")))
    })
    public ResponseEntity<AuthResponse> verifyMobileOtp(@Valid @RequestBody com.placement.dto.MobileOtpVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyMobileOtp(request.getPhoneNumber(), request.getOtp()));
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request a password reset",
            description = "Sends a password reset token to the given email if it exists. " +
                          "Always returns a generic response to prevent user enumeration. " +
                          "This endpoint is public (no authentication required)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Generic success message (whether or not the email exists)",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"message\":\"If that email address is registered, a password reset link has been sent.\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid request body",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"email\":\"must not be blank\"}")))
    })
    public ResponseEntity<Object> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset password with a token",
            description = "Applies a new password using a previously issued, non-expired, single-use reset token. " +
                          "This endpoint is public (no authentication required)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successful",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"message\":\"Password reset successful. You can now log in with your new password.\"}"))),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, or already-used token; or weak password",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(example = "{\"error\":\"Invalid or expired reset token\"}")))
    })
    public ResponseEntity<Object> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(java.util.Map.of("message", message));
    }
}
