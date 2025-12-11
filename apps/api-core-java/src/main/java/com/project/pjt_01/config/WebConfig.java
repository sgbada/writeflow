package com.project.pjt_01.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // 모든 경로에 대해
                        .allowedOrigins(
                            "http://localhost:5173",      // Vite 개발 서버
                            "http://127.0.0.1:5173",      // Vite 개발 서버 (IP)
                            "http://localhost:3000",      // ✅ Docker web 컨테이너
                            "http://127.0.0.1:3000",      // ✅ Docker web 컨테이너 (IP)
                            "http://localhost",           // ✅ Gateway
                            "http://localhost:80"         // ✅ Gateway (포트 명시)
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // ✅ OPTIONS 추가
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600); // ✅ 프리플라이트 캐시 시간 (1시간)
            }
        };
    }
}