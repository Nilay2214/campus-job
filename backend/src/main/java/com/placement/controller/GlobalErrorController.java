package com.placement.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Controller
public class GlobalErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        Map<String, Object> errorResponse = new HashMap<>();
        
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object exception = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        
        int statusCode = status != null ? Integer.parseInt(status.toString()) : 500;
        String errorMessage = message != null ? message.toString() : "An unexpected error occurred";
        
        errorResponse.put("status", statusCode);
        errorResponse.put("message", errorMessage);
        errorResponse.put("error", HttpStatus.valueOf(statusCode).getReasonPhrase());
        
        if (statusCode == 405) {
            errorResponse.put("details", "The HTTP method used is not allowed for this endpoint. Check your request method.");
        }
        
        return ResponseEntity.status(statusCode).body(errorResponse);
    }
}
