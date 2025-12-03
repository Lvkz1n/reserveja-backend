# ReserveJá Backend

API REST multi-tenant (NestJS + Prisma + PostgreSQL) para o ReserveJá.

## Rodando localmente
1. Configure o `.env` baseado no `.env.example`.
2. Instale dependências: `npm install`.
3. Gere o client do Prisma: `npx prisma generate`.
4. Rode as migrações: `npx prisma migrate dev`.
5. Dev server: `npm run start:dev`.

Usuário seed: `admin@reserveja.local` / `admin123` (role_global: `super_admin`).

## Docker
```bash
docker-compose up --build
```

## Endpoints principais
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Admin (`role_global=super_admin`): `/admin/companies`, `/admin/plans`, `/admin/stats`, `/admin/dashboard`
- Empresa: `/companies/:companyId` (dados), `/users`, `/services`, `/clients`, `/appointments`, `/message-templates`, `/settings`, `/dashboard`
- WhatsApp: `/companies/:companyId/appointments/:id/send-confirmation`, `POST /webhooks/whatsapp`

Autenticação via `Authorization: Bearer <access_token>` e cabeçalho `X-Company-Id` opcional.
