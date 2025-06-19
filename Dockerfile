FROM node:20

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Run migrations, then start the app
CMD [ "sh", "-c", "bun run drizzle-kit db push && bun run start" ]