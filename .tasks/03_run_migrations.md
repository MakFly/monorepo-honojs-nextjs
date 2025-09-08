After starting the database, you need to apply the database schema migrations.

First, change into the `auth-service` directory:
```bash
cd apps/auth-service
```

Then, run the BetterAuth and Prisma migration commands:
```bash
pnpm ba:migrate
pnpm prisma:mig
```

Finally, return to the root directory:
```bash
cd ../..
```
