package com.placement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Tests for the hardened PDF resume upload validation in {@link FileStorageService}.
 *
 * <p>Key guarantees verified here:
 * <ul>
 *   <li>Only real PDFs (verifying the {@code %PDF-} magic bytes) are accepted.</li>
 *   <li>Fake PDFs claiming {@code application/pdf} Content-Type are rejected.</li>
 *   <li>Oversized files are rejected.</li>
 *   <li>Path traversal in the original filename cannot escape the upload directory.</li>
 *   <li>Stored files always use a server-generated UUID name.</li>
 * </ul>
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService newService() {
        return new FileStorageService(tempDir.toString());
    }

    private byte[] validPdfBytes() {
        // Minimal valid PDF header. Magic-bytes check only requires the %PDF- prefix.
        return ("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n").getBytes();
    }

    @Test
    void validPdf_isAcceptedAndStoredUnderUuid() {
        FileStorageService service = newService();
        byte[] content = validPdfBytes();
        MultipartFile file = new MockMultipartFile(
                "resume", "my-resume.pdf", "application/pdf", content);

        String url = service.store(file);

        assertTrue(url.startsWith("/uploads/resumes/"), "URL should use the upload prefix");
        String filename = url.substring(url.lastIndexOf('/') + 1);
        // Server-generated UUID-based filename (no original name, no user input).
        assertTrue(filename.matches("[0-9a-f]{32}\\.pdf"), "filename must be a UUID-based .pdf");
    }

    @Test
    void fakePdfWithPdfContentType_isRejected() {
        FileStorageService service = newService();
        // Looks like a PDF Content-Type but is NOT a real PDF (magic bytes absent).
        byte[] content = "This is definitely not a pdf, plain text content".getBytes();
        MultipartFile file = new MockMultipartFile(
                "resume", "fake.pdf", "application/pdf", content);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("not a valid pdf"));
    }

    @Test
    void nonPdfContentType_isRejected() {
        FileStorageService service = newService();
        byte[] content = "<html>not a pdf</html>".getBytes();
        MultipartFile file = new MockMultipartFile(
                "resume", "resume.html", "text/html", content);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("must be a pdf"));
    }

    @Test
    void emptyFile_isRejected() {
        FileStorageService service = newService();
        MultipartFile file = new MockMultipartFile(
                "resume", "empty.pdf", "application/pdf", new byte[0]);

        assertThrows(IllegalArgumentException.class, () -> service.store(file));
    }

    @Test
    void pathTraversalFilename_cannotEscapeUploadDir() {
        FileStorageService service = newService();
        byte[] content = validPdfBytes();
        // Malicious original filename attempting path traversal.
        MultipartFile file = new MockMultipartFile(
                "resume", "../../evil.pdf", "application/pdf", content);

        String url = service.store(file);
        String filename = url.substring(url.lastIndexOf('/') + 1);

        // The stored file must live inside the temp root, never elegible to escape via traversal.
        Path stored = Paths.get(tempDir.toString(), filename);
        assertTrue(stored.normalize().toString().startsWith(tempDir.normalize().toString()));
        assertTrue(Files.exists(stored));
    }

@Test
    void oversizedFile_above5MB_isRejected() throws IOException {
        FileStorageService service = newService();
        // A >5MB file. Uses a valid PDF header so the magic-bytes check passes; this
        // isolates the server-side 5MB size guard (independent of the servlet limit).
        byte[] big = new byte[6 * 1024 * 1024];
        byte[] header = "%PDF-1.7\n".getBytes();
        System.arraycopy(header, 0, big, 0, header.length);
        MultipartFile file = new MockMultipartFile("resume", "huge.pdf", "application/pdf", big);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("5 mb"));
    }

@Test
    void delete_removesStoredFile() {
        FileStorageService service = newService();
        byte[] content = validPdfBytes();
        MultipartFile file = new MockMultipartFile("resume", "r.pdf", "application/pdf", content);
        String url = service.store(file);
        String filename = url.substring(url.lastIndexOf('/') + 1);
        Path stored = Paths.get(tempDir.toString(), filename);
        assertTrue(Files.exists(stored));

        service.delete(url);

        assertTrue(!Files.exists(stored), "stored file should be deleted");
    }

    @Test
    void delete_missingFile_isNoOp() {
        FileStorageService service = newService();
        // No file was ever stored; delete must not throw.
        assertDoesNotThrow(() -> service.delete("/uploads/resumes/does-not-exist.pdf"));
    }

    @Test
    void delete_nullOrBlankUrl_isNoOp() {
        FileStorageService service = newService();
        assertDoesNotThrow(() -> service.delete(null));
        assertDoesNotThrow(() -> service.delete(" "));
    }

    @Test
    void delete_pathTraversalUrl_isIgnored() throws IOException {
        FileStorageService service = newService();
        // A traversal attempt must not escape the upload dir or cause deletion elsewhere.
        assertDoesNotThrow(() -> service.delete("/uploads/resumes/../../outside.pdf"));
    }

@Test
    void nullMaterial_partiallyMatchingMagicBytes_isRejected() throws IOException {
        FileStorageService service = newService();
        // Header starts with %PDF- but is truncated -> not enough valid magic bytes.
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("application/pdf");
        InputStream truncated = new ByteArrayInputStream(new byte[]{'%', 'P', 'D'});
        when(file.getInputStream()).thenReturn(truncated);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.store(file));
        assertTrue(ex.getMessage().toLowerCase().contains("not a valid pdf"));
    }
}

