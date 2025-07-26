# --- Base stage: includes Bun and dependencies
FROM node:20 AS base

WORKDIR /usr/src/app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# Install TypeScript globally (needed for build)
RUN bun add -g typescript

# Copy source code
COPY . .

# Make scripts executable
RUN chmod +x ./db_setup.sh

# --- Dev stage ---
FROM base AS dev

# Entrypoint for development, with Bun watch mode
CMD [ "bun", "--watch", "src", "src/index.ts" ]

# --- Prod stage ---
FROM base AS prod

# Build the application
RUN bun run build

# Run migrations, then start the app (no watch, no dev tools)
CMD [ "sh", "-c", "./db_setup.sh && bun run start" ]