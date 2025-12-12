package com.project.pjt_01.config;

import com.project.pjt_01.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ✅ 모든 Vercel 및 로컬 도메인 허용
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.vercel.app",
            "https://writeflow-ten.vercel.app"
        ));
        
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        ));
        
        // ✅ 모든 헤더 허용
        configuration.setAllowedHeaders(List.of("*"));
        
        // ✅ 중요: 프론트엔드에서 읽을 수 있는 헤더
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type",
            "X-Requested-With",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ✅ CSRF 비활성화
            .csrf(csrf -> csrf.disable())
            
            // ✅ CORS 설정 적용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // ✅ 세션 사용 안 함 (JWT 기반)
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // ✅ 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 1️⃣ Actuator 엔드포인트 (헬스체크 최우선)
                .requestMatchers("/actuator/**").permitAll()
                
                // 2️⃣ Swagger 문서
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                
                // 3️⃣ H2 Console (개발용)
                .requestMatchers("/h2-console/**").permitAll()
                
                // 4️⃣ OPTIONS 요청 (CORS preflight) - 매우 중요!
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 5️⃣ 루트 경로
                .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
                
                // 6️⃣ GET 요청 (글 조회)
                .requestMatchers(HttpMethod.GET, "/posts/**").permitAll()
                
                // 7️⃣ POST/PUT/DELETE (인증 필요)
                .requestMatchers(HttpMethod.POST, "/posts/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/posts/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/posts/**").authenticated()
                
                // 8️⃣ 나머지는 인증 필요
                .anyRequest().authenticated()
            );

        // ✅ H2 Console iframe 허용
        http.headers(headers -> 
            headers.frameOptions(frame -> frame.disable())
        );
        
        // ✅ JWT 필터 추가
        http.addFilterBefore(
            jwtAuthenticationFilter, 
            UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}