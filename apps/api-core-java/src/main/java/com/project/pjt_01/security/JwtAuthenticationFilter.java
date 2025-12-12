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

        String requestURI = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        // ✅ 디버그 로그 (필요시 주석 처리)
        System.out.println("=== JWT Filter ===");
        System.out.println("URI: " + requestURI);
        System.out.println("Authorization: " + (authHeader != null ? "Present" : "Absent"));

        // OPTIONS 요청은 바로 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            System.out.println("OPTIONS request - skipping authentication");
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                String subject = jwtTokenProvider.getSubject(token);
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
                    System.out.println("✅ Authentication set for user: " + userId);
                }
            } catch (Exception e) {
                // ✅ 토큰 파싱 실패는 로그만 남기고 계속 진행
                // (인증이 필요한 엔드포인트는 Spring Security가 차단)
                System.out.println("⚠️ JWT validation failed: " + e.getMessage());
            }
        } else {
            System.out.println("⚠️ No Authorization header");
        }

        filterChain.doFilter(request, response);
    }
}