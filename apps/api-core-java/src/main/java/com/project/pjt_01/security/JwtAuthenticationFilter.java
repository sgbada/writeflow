package com.project.pjt_01.security;

import com.project.pjt_01.domain.User;
import com.project.pjt_01.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                   UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)
        throws ServletException, IOException {

    // ✅ 디버깅 로그 추가
    System.out.println("=== JWT Filter Debug ===");
    System.out.println("Request URI: " + request.getRequestURI());
    System.out.println("Authorization Header: " + request.getHeader("Authorization"));
    System.out.println("All Headers:");
    java.util.Enumeration<String> headerNames = request.getHeaderNames();
    while (headerNames.hasMoreElements()) {
        String headerName = headerNames.nextElement();
        System.out.println("  " + headerName + ": " + request.getHeader(headerName));
    }
    System.out.println("=======================");

    String header = request.getHeader("Authorization");

    if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7);

        try {
            String subject = jwtTokenProvider.getSubject(token);
            System.out.println("✅ JWT Token Valid - User ID: " + subject);

            Long userId = Long.parseLong(subject);

            Optional<User> optionalUser = userRepository.findById(userId);
            if (optionalUser.isPresent()
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                User user = optionalUser.get();

                UserPrincipal principal = UserPrincipal.from(user);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                principal.getAuthorities()
                        );
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ Authentication Set Successfully");
            }
        } catch (Exception e) {
            System.out.println("❌ JWT Token Error: " + e.getMessage());
            e.printStackTrace();
        }
    } else {
        System.out.println("⚠️ No Authorization header or invalid format");
    }

    filterChain.doFilter(request, response);
}
}

