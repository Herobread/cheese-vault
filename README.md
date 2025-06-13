Simple telegram bot that will be hosted on mini pc to explore CI/CD pipelines and to have some fun.

## Setup

1. create .env file with fields that are in .env.example; add your telegram bot key
2. Set up db using ./db_setup.sh
3. run dev server:

```
bun run dev
```

## DB

update changes from schema to db file:

```bash
npx drizzle-kit migrate
```

```bash
npx drizzle-kit generate
```