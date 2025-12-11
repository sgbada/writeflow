package com.writeflow.auth.controller;

import com.writeflow.auth.dto.AuthDtos.*;
import com.writeflow.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("")  // ✅ 빈 문자열로 변경 (Gateway에서 /api/auth/ 제거하므로)
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")  // ✅ /signup
    public ResponseEntity<UserResponse> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")  // ✅ /login
    public ResponseEntity<TokenPair> login(@Valid @RequestBody LoginRequest request) {
        TokenPair tokens = authService.login(request);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/refresh")  // ✅ /refresh
    public ResponseEntity<TokenPair> refresh(@Valid @RequestBody RefreshRequest request) {
        TokenPair tokens = authService.refresh(request);
        return ResponseEntity.ok(tokens);
    }
}