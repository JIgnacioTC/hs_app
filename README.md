# HS — Habit Tracker PWA

Aplicación minimalista de trackeo de hábitos y rutinas de gym. Estilo Grok/Starlink: fondo negro, acento cyan, mobile-first.

## Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS 4
- **BFF**: API Routes (`/api/*`) — el cliente nunca accede directo a Supabase para datos
- **Auth/DB**: Supabase (email + contraseña, sin 2FA)
- **PWA**: Serwist service worker + Web Push
- **Cron**: Endpoint protegido `/api/cron/reminders`

## Setup

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En **SQL Editor**, ejecuta `supabase/migrations/001_initial_schema.sql`
3. En **Authentication → Providers**, habilita Email (sin MFA)
4. Copia URL y keys

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Genera VAPID keys:
# npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tu@email.com

CRON_SECRET=un-secreto-largo-aleatorio
```

### 3. Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Producción / PWA

```bash
npm run build
npm start
```

El service worker solo se registra en producción. Para probar PWA:

1. Despliega con HTTPS (Vercel, etc.)
2. Instala desde el navegador móvil
3. Activa notificaciones en Ajustes o el wizard

### 5. Cron de recordatorios

Configura un cron externo que llame cada **5 minutos**:

```bash
curl -X POST https://tu-dominio.com/api/cron/reminders \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Opciones:
- **Vercel Cron** (`vercel.json`)
- **GitHub Actions** scheduled workflow
- **Supabase pg_cron** + `pg_net` HTTP call
- **cron-job.org**

Ejemplo `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "*/5 * * * *"
  }]
}
```

Añade el header `Authorization` vía middleware o usa un secret query param si prefieres.

## Estructura

```
src/
├── app/
│   ├── api/          # BFF endpoints
│   ├── auth/         # Login / registro
│   ├── wizard/       # Onboarding inicial
│   ├── habits/       # Gestión de hábitos
│   ├── gym/          # Rutinas de gym
│   └── settings/     # Notificaciones y recordatorios
├── components/
├── lib/
└── sw.ts             # Service worker (Serwist + push)
supabase/
└── migrations/       # Schema SQL
```

## Base de datos

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfil + wizard |
| `habits` | Hábitos configurables |
| `habit_logs` | Check diario |
| `gym_routines` | Rutinas de gym |
| `gym_exercises` | Ejercicios por rutina |
| `gym_sessions` | Entrenamientos completados |
| `reminders` | Recordatorios con cron |
| `push_subscriptions` | Suscripciones Web Push |

## Licencia

MIT
