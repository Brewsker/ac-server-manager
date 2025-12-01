# Dockerfile
FROM node:20-alpine

# Install git for updates and other dependencies
RUN apk add --no-cache git curl bash tar

# Create app directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy application files
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Create necessary directories
RUN mkdir -p /app/backend/data/presets && \
    mkdir -p /app/backend/data/cm-packs && \
    mkdir -p /app/backend/logs

# Expose ports
EXPOSE 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start backend
WORKDIR /app/backend
CMD ["node", "src/server.js"]
