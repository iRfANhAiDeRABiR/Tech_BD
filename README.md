This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Database

This project uses Prisma with PostgreSQL, so Supabase can be used as the hosted database.

1. Create a free Supabase project.
2. Open **Project Settings > Database** and copy the PostgreSQL connection string.
3. Set `DATABASE_URL` in [`.env`](.env) to the Supabase Postgres URL.
4. Keep `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` set in your local environment.
5. Run the Prisma setup commands again:

```bash
npm run db:generate
npm run db:migrate
npm run admin:create
```

For Prisma, use the direct PostgreSQL connection string from Supabase. If you later move to a pooled URL, confirm it works with your migration workflow first.

## Order confirmation emails

Checkout orders automatically send a confirmation email after the order is saved. Configure SMTP credentials in `.env`:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Tech Solutions BD <your-email@gmail.com>"
```

If SMTP settings are missing or invalid, the order will still be saved and the server will log the email error.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
