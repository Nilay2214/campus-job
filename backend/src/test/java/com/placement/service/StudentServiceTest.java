package com.placement.service;

import com.placement.dto.StudentProfileRequest;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.repository.StudentProfileRepository;
import com.placement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

@Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    private StudentService studentService;

    private final String email = "student@example.com";

    @BeforeEach
    void setUp() {
        studentService = new StudentService(studentProfileRepository, userRepository, fileStorageService);

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        // lenient: the uploadResume test does not use the SecurityContext,
        // so strict Mockito would flag these stubs as unnecessary.
        lenient().when(authentication.getName()).thenReturn(email);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void getStudentProfile_whenProfileExists_returnsProfile() {
        User user = User.builder()
                .email(email)
                .build();

        StudentProfile expected = StudentProfile.builder().user(user).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(expected));

        StudentProfile actual = studentService.getProfile();

        assertSame(expected, actual);
        verify(userRepository).findByEmail(email);
        verify(studentProfileRepository).findByUser(user);
    }

    @Test
    void getProfile_whenProfileDoesNotExist_autoCreatesAndSavesEmptyProfile() {
        User user = User.builder()
                .email(email)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        // Return the same instance passed to save so assertions can verify it.
        when(studentProfileRepository.save(any(StudentProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StudentProfile actual = studentService.getProfile();

        assertSame(user, actual.getUser());
        assertEquals(null, actual.getFullName());

        // Confirm the auto-created profile was persisted exactly once.
        ArgumentCaptor<StudentProfile> profileCaptor = ArgumentCaptor.forClass(StudentProfile.class);
        verify(studentProfileRepository).save(profileCaptor.capture());
        assertSame(user, profileCaptor.getValue().getUser());

        verify(userRepository).findByEmail(email);
        verify(studentProfileRepository).findByUser(user);
    }

    @Test
    void saveOrUpdateProfile_whenProfileExists_updatesAndSavesProfile() {
        User user = User.builder()
                .email(email)
                .build();

        StudentProfile existing = StudentProfile.builder().user(user).build();

        StudentProfileRequest request = new StudentProfileRequest();
        request.setFullName("Alice");
        request.setPhone("1234567890");

        request.setDepartment("CSE");
        request.setBranch("AI");
        request.setCgpa("8.7");
request.setResumeUrl("http://example.com/resume.pdf");
        request.setSkills("Java,SQL");
        request.setGraduationYear("2025");
        request.setLinkedInUrl("https://linkedin.com/in/alice");
        request.setGithubUrl("https://github.com/alice");
        request.setPortfolioUrl("https://alice.dev");
        request.setAddress("Bangalore");
        request.setAboutMe("I love building software");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(studentProfileRepository.save(existing)).thenReturn(existing);

        StudentProfile result = studentService.saveOrUpdateProfile(request);

        assertSame(existing, result);

        ArgumentCaptor<StudentProfile> profileCaptor = ArgumentCaptor.forClass(StudentProfile.class);
        verify(studentProfileRepository).save(profileCaptor.capture());

        StudentProfile saved = profileCaptor.getValue();
        assertEquals("Alice", saved.getFullName());
        assertEquals("1234567890", saved.getPhone());
        assertEquals("CSE", saved.getDepartment());
        assertEquals("AI", saved.getBranch());
        assertEquals("8.7", saved.getCgpa());
assertEquals("http://example.com/resume.pdf", saved.getResumeUrl());
        assertEquals("Java,SQL", saved.getSkills());
        assertEquals("2025", saved.getGraduationYear());
        assertEquals("https://linkedin.com/in/alice", saved.getLinkedInUrl());
        assertEquals("https://github.com/alice", saved.getGithubUrl());
        assertEquals("https://alice.dev", saved.getPortfolioUrl());
        assertEquals("Bangalore", saved.getAddress());
        assertEquals("I love building software", saved.getAboutMe());
    }

    @Test
    void saveOrUpdateProfile_whenProfileDoesNotExist_createsAndSavesProfile() {
        User user = User.builder()
                .email(email)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        // Capture the newly created profile instance
        when(studentProfileRepository.save(any(StudentProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentProfileRequest request = new StudentProfileRequest();
        request.setFullName("Bob");
        request.setPhone("456");
        request.setDepartment("IT");
        request.setBranch("Networking");
        request.setCgpa("7.1");

        request.setResumeUrl("http://example.com/resume2.pdf");
        request.setSkills("AWS");
        request.setGraduationYear("2026");

        StudentProfile result = studentService.saveOrUpdateProfile(request);

        ArgumentCaptor<StudentProfile> profileCaptor = ArgumentCaptor.forClass(StudentProfile.class);
        verify(studentProfileRepository).save(profileCaptor.capture());

        StudentProfile saved = profileCaptor.getValue();
        assertSame(saved, result);
        assertEquals(user, saved.getUser());
        assertEquals("Bob", saved.getFullName());
        assertEquals("456", saved.getPhone());
        assertEquals("IT", saved.getDepartment());
        assertEquals("Networking", saved.getBranch());
        assertEquals("7.1", saved.getCgpa());
        assertEquals("http://example.com/resume2.pdf", saved.getResumeUrl());
        assertEquals("AWS", saved.getSkills());
        assertEquals("2026", saved.getGraduationYear());
    }

@Test
    void deleteResume_whenProfileHasResume_clearsDbReferenceAndDeletesFile() {
        User user = User.builder().email(email).build();
        StudentProfile existing = StudentProfile.builder()
                .user(user)
                .resumeUrl("/uploads/resumes/abc.pdf")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(studentProfileRepository.save(existing)).thenReturn(existing);

        studentService.deleteResume();

        assertNull(existing.getResumeUrl());
        verify(studentProfileRepository).save(existing);
        verify(fileStorageService).delete("/uploads/resumes/abc.pdf");
    }

    @Test
    void deleteResume_whenNoResume_doesNothing() {
        User user = User.builder().email(email).build();
        StudentProfile existing = StudentProfile.builder().user(user).resumeUrl(null).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.of(existing));

        studentService.deleteResume();

        verify(studentProfileRepository, never()).save(any());
        verify(fileStorageService, never()).delete(anyString());
    }

    @Test
    void deleteResume_whenProfileMissing_doesNothing() {
        User user = User.builder().email(email).build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.empty());

        studentService.deleteResume();

        verify(studentProfileRepository, never()).save(any());
        verify(fileStorageService, never()).delete(anyString());
    }

@Test
    void uploadResume_persistsFileAndUpdatesProfile() {
        User user = User.builder().email(email).build();
        MultipartFile multipartFile = mock(MultipartFile.class);

        when(multipartFile.isEmpty()).thenReturn(false);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(fileStorageService.store(multipartFile)).thenReturn("/uploads/resumes/abc.pdf");
        when(studentProfileRepository.findByUser(user)).thenReturn(Optional.empty());
        when(studentProfileRepository.save(any(StudentProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String url = studentService.uploadResume(multipartFile);

        assertEquals("/uploads/resumes/abc.pdf", url);
        ArgumentCaptor<StudentProfile> profileCaptor = ArgumentCaptor.forClass(StudentProfile.class);
        verify(studentProfileRepository).save(profileCaptor.capture());
        assertEquals("/uploads/resumes/abc.pdf", profileCaptor.getValue().getResumeUrl());
        assertEquals(user, profileCaptor.getValue().getUser());
        verify(fileStorageService).store(multipartFile);
        verify(userRepository).findByEmail(email);
    }
}
