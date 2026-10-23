package com.placement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves files under the resume upload directory at the public
 * {@code /uploads/**} URL path so that saved resume URLs can be
 * downloaded by the browser.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final String resumeDir;

    public WebMvcConfig(@Value("${uploads.resume-dir:./uploads/resumes}") String resumeDir) {
        this.resumeDir = resumeDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(resumeDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/uploads/resumes/**")
                .addResourceLocations(location);
    }
}
