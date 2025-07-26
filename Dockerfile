# --- Base stage: includes Bun and dependencies
FROM node:20 AS base

WORKDIR /usr/src/app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# Copy source code
COPY . .

# --- Dev stage ---
FROM base AS dev

# Entrypoint for development, with Bun watch mode
# This will watch all files in src/ and restart src/index.ts on changes
CMD [ "bun", "--watch", "src", "src/index.ts" ]

# --- Prod stage ---
FROM base AS prod

# Build the application
RUN bun run build

# Run migrations, then start the app (no watch, no dev tools)
CMD [ "sh", "-c", "./db_setup.sh && bun run start" ]