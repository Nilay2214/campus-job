package com.placement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    // Full name is optional for backward compatibility: existing clients that
    // register without a fullName must not be rejected. New registrants should
    // provide it (frontend collects it), but enforcement is lenient here.
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String role;
}
