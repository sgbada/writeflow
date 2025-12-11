# 1) 프론트엔드 빌드 단계
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build



# 2) nginx에서 정적 파일 서빙
FROM nginx:1.27-alpine

# nginx 기본 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# 프론트엔드 build 결과 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 이 컨테이너용 nginx 설정 복사 (web 전용)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
