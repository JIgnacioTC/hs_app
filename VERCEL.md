# Despliegue en Vercel — HS

Guía para publicar HS en Vercel y activar **Web Push** + recordatorios automáticos.

## 1. Conectar el repo

1. [vercel.com/new](https://vercel.com/new) → importa `JIgnacioTC/hs_app`
2. Framework: **Next.js** (detectado automáticamente)
3. Build: `npm run build` · Output: default

El archivo `vercel.json` ya incluye el cron de recordatorios:

```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "*/5 * * * *"
  }]
}
```

## 2. Variables de entorno (obligatorias)

En **Vercel → Project → Settings → Environment Variables**, añade estas para **Production** (y Preview si quieres probar ahí):

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo servidor, cron y admin) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública Web Push |
| `VAPID_PRIVATE_KEY` | Clave privada Web Push |
| `VAPID_SUBJECT` | `mailto:tu@email.com` (contacto del emisor push) |
| `CRON_SECRET` | Secreto aleatorio ≥16 caracteres |

### GIFs de ejercicios (Cloudflare R2, opcional)

Para servir los GIFs del catálogo desde tu bucket R2 en lugar del CDN público:

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `R2_ENDPOINT` | Solo servidor | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Solo servidor | Access Key ID de la API token de R2 |
| `R2_SECRET_ACCESS_KEY` | Solo servidor | Secret Access Key de R2 |
| `R2_BUCKET_NAME` | Solo servidor | Nombre del bucket (por defecto `hs-gifs`) |
| `NEXT_PUBLIC_R2_GIF_PUBLIC_URL` | Cliente + servidor | URL pública del bucket (dominio r2.dev o custom domain, sin `/` final) |

Opcional: `NEXT_PUBLIC_EXERCISE_GIF_PROVIDER=r2` fuerza R2 aunque no detecte la URL pública.

Sube los GIFs desde **Ajustes → Admin** en la app (subida masiva con URLs prefirmadas).

### Auth (registro sin verificación de correo)

El signup usa `SUPABASE_SERVICE_ROLE_KEY` para crear usuarios con `email_confirm: true` y entrar al instante.

Si no tienes service role en Preview, desactiva **Confirm email** en Supabase → Authentication → Providers → Email.

### Generar claves VAPID

En local:

```bash
npx web-push generate-vapid-keys
```

Copia **public key** → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  
Copia **private key** → `VAPID_PRIVATE_KEY`

### Generar CRON_SECRET

```bash
openssl rand -base64 32
```

Vercel envía automáticamente `Authorization: Bearer <CRON_SECRET>` cuando invoca el cron (si la variable existe). El endpoint `/api/cron/reminders` ya lo valida.

Tras añadir variables: **Redeploy** (Deployments → ⋯ → Redeploy).

## 3. Supabase en producción

1. Ejecuta todas las migraciones en `supabase/migrations/` (001 → 005)
2. **Authentication → URL Configuration**: añade tu dominio Vercel si usas confirmación por email (login por API BFF no requiere redirect extra)

## 4. Activar notificaciones (usuario final)

Las push **solo funcionan con HTTPS** y con el **service worker en producción** (Vercel cumple ambos).

1. Abre la app desplegada en el móvil (Chrome/Android o Safari iOS 16.4+)
2. **Opcional iOS**: instala la PWA en pantalla de inicio
3. Ve a **Ajustes → Push en celular → Activar**
4. Acepta el permiso del navegador
5. Crea **Recordatorios** en la misma pantalla (título, mensaje, horario)

Sin suscripción push + recordatorio activo, el cron no tiene nada que enviar.

## 5. Cron en Vercel (plan Hobby vs Pro)

| Plan | Frecuencia del cron integrado |
|------|------------------------------|
| **Hobby** | Máx. **1 vez al día** por job |
| **Pro** | Cada minuto (incl. `*/5 * * * *`) |

En **Hobby**, el schedule `*/5 * * * *` de `vercel.json` **no se ejecutará cada 5 minutos**. Opciones:

- **Subir a Pro** para usar el cron de Vercel tal cual, o
- **Cron externo** (cron-job.org, GitHub Actions, etc.) que llame cada 5 min:

```bash
curl -X POST "https://TU-DOMINIO.vercel.app/api/cron/reminders" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

También funciona con `?secret=TU_CRON_SECRET` en la URL si el servicio no permite headers.

## 6. Comprobar que todo funciona

### Push (suscripción)

1. Ajustes → Activar push → debe quedar en "Activadas"
2. En Supabase, tabla `push_subscriptions` debe tener una fila con tu `user_id`

### Cron (envío)

```bash
curl -X POST "https://TU-DOMINIO.vercel.app/api/cron/reminders" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Respuesta esperada: `{ "sent": N, "errors": 0, ... }`

Si `sent: 0`: no hay recordatorios que toque enviar ahora (revisa timezone y expresión cron), o no hay suscripción push.

### Logs

Vercel → **Deployments → Functions → `/api/cron/reminders`** para ver errores de envío.

## 7. Checklist rápido

- [ ] Repo conectado a Vercel
- [ ] 7 variables de entorno configuradas
- [ ] Redeploy tras env vars
- [ ] Migraciones Supabase aplicadas
- [ ] Push activado en Ajustes (producción, HTTPS)
- [ ] Al menos un recordatorio creado y habilitado
- [ ] Cron configurado (Vercel Pro o servicio externo)
- [ ] Prueba manual del endpoint cron

## Enlaces

- Repo: https://github.com/JIgnacioTC/hs_app
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Web Push (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
