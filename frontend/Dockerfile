# Multi-stage build for React frontend
FROM node:18-alpine as build

WORKDIR /app

# Accept API URL build args (injected at build time by docker-compose or CI)
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_ML_API_URL=http://localhost:8001/api
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ML_API_URL=$VITE_ML_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build for production
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
