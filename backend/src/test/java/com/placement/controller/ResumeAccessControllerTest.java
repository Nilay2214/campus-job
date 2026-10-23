package com.placement.controller;

import com.placement.entity.Application;
import com.placement.entity.Job;
import com.placement.entity.StudentProfile;
import com.placement.entity.User;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.StudentProfileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Authorization matrix tests for {@link ResumeAccessController}.
 *
 * <p>Verifies the exact access rules:
 * <ul>
 *   <li>STUDENT owner: allowed (their own resume).</li>
 *   <li>STUDENT non-owner: denied (403).</li>
 *   <li>RECRUITER with an application to their own job: allowed.</li>
 *   <li>RECRUITER unrelated (no application to their job): denied (403).</li>
 *   <li>ADMIN: allowed.</li>
 * </ul>
 */
class ResumeAccessControllerTest {

    @TempDir
    Path tempDir;

    private StudentProfileRepository studentRepo;
    private ApplicationRepository applicationRepo;
    private ResumeAccessController controller;

    private User ownerUser;
    private StudentProfile ownerProfile;

    @BeforeEach
    void setUp() throws Exception {
        studentRepo = mock(StudentProfileRepository.class);
        applicationRepo = mock(ApplicationRepository.class);
        controller = new ResumeAccessController(studentRepo, applicationRepo, tempDir.toString());

        ownerUser = User.builder().id(1L).email("student@example.com").build();
        ownerProfile = StudentProfile.builder().id(10L).user(ownerUser).build();

        // Write a real resume file so successful access can actually serve it.
        String filename = "a1b2c3d4e5f60718293a4b5c6d7e8f90.pdf";
        Files.write(tempDir.resolve(filename), new byte[]{ '%', 'P', 'D', 'F', '-', '1', '.', '7' });
        ownerProfile.setResumeUrl("/uploads/resumes/" + filename);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String username, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

@Test
    void ownerStudent_canDownloadOwnResume() throws Exception {
        // The authenticated STUDENT is the profile owner.
        authenticate("student@example.com", "STUDENT");
        when(studentRepo.findById(10L)).thenReturn(Optional.of(ownerProfile));

        ResponseEntity<Resource> resp = controller.getResume(10L);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
    }

    @Test
    void otherStudent_cannotDownloadResume_forbidden() throws Exception {
        // A different student tries to access the owner's resume.
        authenticate("other@example.com", "STUDENT");
        when(studentRepo.findById(10L)).thenReturn(Optional.of(ownerProfile));
        when(applicationRepo.findByStudent(ownerProfile)).thenReturn(List.of());

        ResponseEntity<Resource> resp = controller.getResume(10L);

        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
    }

    @Test
    void unrelatedRecruiter_cannotDownloadResume_forbidden() throws Exception {
        // A recruiter with no application to their own job for this student.
        authenticate("recruiter@example.com", "RECRUITER");
        when(studentRepo.findById(10L)).thenReturn(Optional.of(ownerProfile));
        when(applicationRepo.findByStudent(ownerProfile)).thenReturn(List.of());

        ResponseEntity<Resource> resp = controller.getResume(10L);

        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
    }

    @Test
    void authorizedRecruiter_canDownloadResume() throws Exception {
        // A recruiter who owns a job this student applied to.
        authenticate("recruiter@example.com", "RECRUITER");
        when(studentRepo.findById(10L)).thenReturn(Optional.of(ownerProfile));

        User recruiter = User.builder().id(2L).email("recruiter@example.com").build();
        Job job = Job.builder().id(5L).recruiter(recruiter).build();
        Application app = Application.builder().id(7L).student(ownerProfile).job(job).build();
        when(applicationRepo.findByStudent(ownerProfile)).thenReturn(List.of(app));

        ResponseEntity<Resource> resp = controller.getResume(10L);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
    }

    @Test
    void admin_canDownloadAnyResume() throws Exception {
        authenticate("admin@example.com", "ADMIN");
        when(studentRepo.findById(10L)).thenReturn(Optional.of(ownerProfile));

        ResponseEntity<Resource> resp = controller.getResume(10L);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertNotNull(resp.getBody());
    }

@Test
    void missingProfile_returnsNotFound() throws Exception {
        authenticate("admin@example.com", "ADMIN");
        when(studentRepo.findById(9999L)).thenReturn(Optional.empty());

        ResponseEntity<Resource> resp = controller.getResume(9999L);

        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void profileWithoutResume_returnsNotFound() throws Exception {
        authenticate("student@example.com", "STUDENT");
        StudentProfile noResume = StudentProfile.builder().id(11L).user(ownerUser).resumeUrl("").build();
        when(studentRepo.findById(11L)).thenReturn(Optional.of(noResume));

        ResponseEntity<Resource> resp = controller.getResume(11L);

        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void fakeConstructorParam_keepsRepoMockValid() {
        // Guards against accidental reliance on a non-injectable constructor.
        assertNotNull(controller);
        assertNotNull(studentRepo);
        assertNotNull(applicationRepo);
    }
}
