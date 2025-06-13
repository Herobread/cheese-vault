FROM node:20

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# Copy the rest of the application code
COPY . .

# Ensure the SQLite database file exists
RUN touch local.db

# Apply Drizzle migrations to set up the database schema
RUN bun drizzle-kit migrate --config src/drizzle.config.ts

# Build the application
RUN bun run build

# Start the application
CMD [ "bun", "run", "start" ]