package com.placement.service;

import com.placement.dto.AdminUserDTO;
import com.placement.entity.User;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
import com.placement.repository.JobRepository;
import com.placement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        // @InjectMocks constructs AdminService with the four mocked repositories.
    }

    @Test
    void updateUserStatus_whenDisable_persistsEnabledFalse_andReturnsUpdated() {
        Long userId = 7L;
        User user = User.builder().id(userId).email("student@example.com").role(User.Role.STUDENT).enabled(true).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDTO result = adminService.updateUserStatus(userId, false);

        assertNotNull(result);
        assertFalse(result.isEnabled());
        assertEquals(userId, result.getId());
        assertEquals("STUDENT", result.getRole());
        assertEquals("student@example.com", result.getEmail());

        verify(userRepository).save(user);
        verify(userRepository).findById(userId);
    }

    @Test
    void updateUserStatus_whenEnable_persistsEnabledTrue() {
        Long userId = 8L;
        User user = User.builder().id(userId).email("recruiter@example.com").role(User.Role.RECRUITER).enabled(false).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDTO result = adminService.updateUserStatus(userId, true);

        assertNotNull(result);
        assertTrue(result.isEnabled());
        assertEquals("RECRUITER", result.getRole());

        verify(userRepository).save(user);
    }

    @Test
    void updateUserStatus_whenUserNotFound_throwsResourceNotFound() {
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> adminService.updateUserStatus(userId, true));

        assertTrue(ex.getMessage().contains("User not found with id: 999"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUserStatus_doesNotChangeRole() {
        Long userId = 10L;
        User user = User.builder().id(userId).email("admin@example.com").role(User.Role.ADMIN).enabled(true).build();
        User otherAdmin = User.builder().id(11L).email("admin2@example.com").role(User.Role.ADMIN).enabled(true).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findAll()).thenReturn(java.util.List.of(user, otherAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserDTO result = adminService.updateUserStatus(userId, false);

        // Role must remain ADMIN - the endpoint can never be used to escalate/change roles.
        assertEquals("ADMIN", result.getRole());
        assertEquals(user.getRole(), User.Role.ADMIN);
    }

    @Test
    void updateUserStatus_whenLastAdminDisabled_throwsIllegalStateException() {
        Long userId = 10L;
        User user = User.builder().id(userId).email("admin@example.com").role(User.Role.ADMIN).enabled(true).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findAll()).thenReturn(java.util.List.of(user));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> adminService.updateUserStatus(userId, false));

        assertEquals("Cannot disable the last enabled ADMIN account", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }
}
