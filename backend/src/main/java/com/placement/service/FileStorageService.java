package com.placement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;

/**
 * Abstraction over file storage for resumes.
 *
 * Current implementation stores files on the local filesystem under
 * {@code uploads.resume-dir}. To migrate to AWS S3 or Cloudinary later,
 * replace the body of {@link #store(MultipartFile)} and keep the same
 * interface - business logic in {@link StudentService} will not change.
 */
@Service
public class FileStorageService {

private static final String UPLOAD_PREFIX = "/uploads/resumes/";

    // PDF magic bytes: a valid PDF must start with "%PDF-".
    private static final byte[] PDF_MAGIC = new byte[] {'%', 'P', 'D', 'F', '-'};

    // Allowed MIME types for resumes (Content-Type is not trusted alone; we also check magic bytes).
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("application/pdf");

    // Maximum resume size (5 MB). Enforced server-side in addition to the servlet multipart limit,
    // so a request can never slip through with an oversized file even if servlet config changes.
    private static final long MAX_RESUME_BYTES = 5L * 1024L * 1024L;

    private final Path rootLocation;

    public FileStorageService(@Value("${uploads.resume-dir:./uploads/resumes}") String resumeDir) {
        this.rootLocation = Paths.get(resumeDir).toAbsolutePath().normalize();
    }

    /**
     * Persist an uploaded resume and return the public URL path.
     *
     * <p>Validates that the file is:
     * <ul>
     *   <li>non-null and non-empty</li>
     *   <li>within the configured max size (enforced by the servlet too)</li>
     *   <li>a PDF by checking the actual {@code %PDF-} magic bytes (Content-Type is not trusted)</li>
     * </ul>
     * Files are stored under a random UUID filename to prevent path traversal and
     * filename injection. The original filename is never used for the filesystem path.</p>
     *
     * @param file uploaded resume (validated for size/type by the caller/controller)
     * @return public URL path (e.g. /uploads/resumes/<uuid>.pdf)
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }

        // Enforce max size server-side (independent of servlet multipart limits).
        if (file.getSize() > MAX_RESUME_BYTES) {
            throw new IllegalArgumentException("Resume file size must be <= 5 MB");
        }

        // Reject non-PDF based on actual content, not just the spoofable Content-Type header.
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Resume must be a PDF (application/pdf)");
        }

        if (!isPdfMagicBytes(file)) {
            throw new IllegalArgumentException("Resume is not a valid PDF file");
        }

        try {
            Files.createDirectories(rootLocation);

            // Generate a safe, random filename. Never use the original filename for the path.
            String filename = UUID.randomUUID().toString().replace("-", "") + ".pdf";
            Path target = rootLocation.resolve(filename).normalize();

            // Guard against path traversal (defense in depth; filename is generated so this is safe).
            if (!target.toString().startsWith(rootLocation.toString())) {
                throw new IllegalArgumentException("Invalid file path");
            }

            // Stream to disk (avoids relying on the servlet temp file max size).
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            return UPLOAD_PREFIX + filename;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store resume file", ex);
        }
    }

/**
     * Delete a stored resume file by its public URL path (e.g. /uploads/resumes/<uuid>.pdf).
     *
     * <p>Safe, guarded deletion:
     * <ul>
     *   <li>Only files under the configured resume root are eligible (no path traversal).</li>
     *   <li>If the file does not exist, this is a no-op (does not throw).</li>
     *   <li>Never exposes or accepts arbitrary absolute paths.</li>
     * </ul>
     *
     * @param resumeUrl public URL path returned by {@link #store(MultipartFile)}
     */
    public void delete(String resumeUrl) {
        if (resumeUrl == null || resumeUrl.isBlank()) {
            return;
        }

        String filename = resumeUrl.substring(resumeUrl.lastIndexOf('/') + 1);
        if (filename.isBlank() || filename.contains("..")) {
            return;
        }

        Path target = rootLocation.resolve(filename).normalize();
        // Guard against path traversal (defense in depth).
        if (!target.toString().startsWith(rootLocation.toString())) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            // Deleting a missing/unreadable file must not crash the request.
            // The DB reference is still cleared by the caller.
        }
    }

    /**
     * Reads the first bytes of the uploaded file and checks they match the PDF magic header.
     */
    private boolean isPdfMagicBytes(MultipartFile file) {
        byte[] header = new byte[PDF_MAGIC.length];
        int read = 0;
        try (InputStream in = file.getInputStream()) {
            int offset = 0;
            while (offset < header.length) {
                int n = in.read(header, offset, header.length - offset);
                if (n < 0) {
                    break;
                }
                offset += n;
            }
            read = offset;
        } catch (IOException ex) {
            return false;
        }
        return read == PDF_MAGIC.length && Arrays.equals(header, PDF_MAGIC);
    }
}
