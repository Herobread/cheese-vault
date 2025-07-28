# cheese-vault

A Telegram bot project for experimenting with deployment, CI/CD, and DevOps.  
Runs on Ubuntu (Intel NUC 5) and uses Docker, Drizzle ORM, and Bun.

Bot: [@cheese_vault_bot](https://t.me/cheese_vault_bot)  
*(Note: This is a personal project and not always be available.)*

<img width="1280" height="960" alt="intel nuc 5" src="https://github.com/user-attachments/assets/f4b51e65-3cc5-458b-a2a6-f943749d7b27" />

---

## Features

- Telegram bot written in TypeScript
- CI/CD pipeline
- Dockerized development & production
- Runs on low-power hardware
- Uses Drizzle ORM and Bun runtime

<img width="488" height="950" alt="image" src="https://github.com/user-attachments/assets/991b3440-70df-4d00-9193-39293dfc13d3" />


---

## Getting Started

1. Clone the repo:
    ```bash
    git clone https://github.com/Herobread/cheese-vault.git
    cd cheese-vault
    ```

2. Copy `.env.example` to `.env` and fill in your Telegram bot key.

3. Start the dev server:
    ```bash
    bun run dev
    ```

---

## Database

To update the DB schema:

```bash
bunx drizzle-kit generate --config src/drizzle.config.ts
bunx drizzle-kit push --config src/drizzle.config.ts
```

---

## License

MIT
