FROM node:24-slim AS build
WORKDIR /app
COPY lab4/package.json lab4/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY lab4/ .
RUN npx ng build --configuration production

FROM nginx:stable-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/lab4/browser /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8080
EXPOSE 80
