# Aula — Estado actual del proyecto

> Snapshot al 17 de mayo de 2026. Cambia rápido — verificar fechas de commits en `git log` para confirmar vigencia.

---

## Qué es Aula

**Aula** es un generador de clases con IA para docentes, educadores y padres de familia, en español (con soporte inglés). El usuario describe el tema, materia, grado y duración, y la app produce una **clase completa lista para impartir** en 60–90 segundos:

- **Guión del docente minuto a minuto** (por fases: activación, exploración, construcción, cierre)
- **Mini-clase** con explicaciones, vocabulario y analogías
- **Ejemplos resueltos** y errores conceptuales comunes
- **Hoja de trabajo con clave de respuestas**
- **Ticket de salida** (exit ticket)
- **Diferenciación** para alumnos con dificultades y avanzados
- **Recado para padres**
- **Alineación pedagógica**: Montessori, constructivista, pensamiento crítico

El output viene en pantalla (UI estructurada), markdown descargable, PDF (con caveats — ver abajo) y EPUB.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **UI** | React 18 + Tailwind CSS |
| **LLM** | OpenAI (con fallback a OpenRouter si está configurado) |
| **Validación** | Zod |
| **Markdown** | `marked` |
| **PDF (descarga)** | `puppeteer-core` + `@sparticuz/chromium` (server-side) — **roto en Vercel** |
| **PDF (parsing de uploads)** | `pdf-parse@1.1.1` (downgrade desde v2 para estabilidad serverless) |
| **EPUB** | `epub-gen` |
| **Auth de acceso** | JWT con `jose` (HS256, 31 días, kill-switch via `REVOKED_JTIS`) |
| **Pagos** | Mercado Pago — suscripción mensual 200 MXN con `back_url` redirect |
| **Email (opcional)** | Resend (configurable; webhook funciona sin él) |
| **Hosting** | Vercel (plan Hobby gratis) |
| **Repo** | https://github.com/EmprendoX/Class-Content |
| **Producción** | https://class-content-phi.vercel.app |

---

## Lo que funciona ✅

### Generación de clases
- POST `/api/generate-lesson` — toma tema, materia, grado, duración, tono → devuelve clase completa con streaming SSE en vivo (status: outline → validate → format).
- Validación con Zod para todos los inputs.
- Soporta material fuente: el usuario puede pegar un PDF/TXT/MD y la IA lo usa como base.
- Protegido con paywall — solo accesible con JWT válido en cookie.

### Subida de material fuente
- POST `/api/extract-source` — acepta PDF, TXT, Markdown.
- Límites: 10 MB, 50 páginas, 20.000 palabras (trunca si excede).

### Generación de paquetes adicionales (legacy, públicos)
- `/api/generate-class-package` — paquete completo de clase con sub-agentes.
- `/api/generate-teaching-guide` — guía semanal de 5 lecciones (formato anterior).

### Exportación
- **Markdown**: descarga directa client-side, funciona 100%.
- **Copiar**: al portapapeles, funciona.
- **EPUB**: server-side, no probado recientemente pero teóricamente funcional.

### Monetización (Mercado Pago)
- **Paywall** activo en la home — bloquea el formulario hasta que el usuario tenga cookie de acceso.
- **Suscripción 200 MXN/mes** vía MP (plan `aa6821d5ff5d4f08915fedf4075e32e1`).
- **Flujo back_url** (commit `8255064`): el usuario paga en MP → MP redirige a `/acceso?preapproval_id=...` → backend valida con MP API → setea cookie → entra automáticamente.
- **JWT de acceso** firmado HS256, expira en 31 días, contiene email del comprador y `jti` único.
- **Cookie HttpOnly** `aula_access` (Secure + SameSite=Lax en prod).
- **Webhook** `/api/mp/webhook` configurado en MP con eventos `Planes y suscripciones`, verifica firma `x-signature` (HMAC-SHA256), idempotente.
- **Sin base de datos** — toda la verdad vive en el JWT firmado + API de MP.
- **Resend opcional** — si `RESEND_API_KEY` está vacío el webhook salta el envío de email y registra el token en Vercel logs (rescatable manualmente).

### Acceso manual (para soporte / acceso sin pago)
- Página `/acceso` acepta también `?code=<JWT>` para activación manual.
- Script local puede firmar JWTs con el `ACCESS_JWT_SECRET` para entregar acceso a beta testers, founding members o casos de soporte.

### Calidad técnica
- 45 tests Vitest pasando (orchestrator, schemas, JWT, MP signature, PDF extract).
- Build limpio sin warnings críticos.
- Ciclo CI/CD: push a `main` → Vercel auto-deploya en ~90 segundos.

---

## Lo que NO funciona / pendiente ⚠️

### Descarga de PDF
**Estado**: roto en producción. El endpoint `/api/export/pdf` con `@sparticuz/chromium` falla con `"The input directory '/var/task/.next/server/app/api/export/bin' does not exist."` porque Next.js no incluye los binarios de Chromium en el deploy.

**Fix identificado pero NO aplicado**: agregar `outputFileTracingIncludes` en `next.config.js` para que Next.js copie los `.br` files del paquete (63 MB total, cabe en límite de 250 MB de Vercel).

**Mientras tanto**: el botón "PDF" llama a `window.print()` — funciona en desktop pero la UX es mala (sub-menú escondido en Safari). En móvil produce PDF de calidad baja (captura del DOM).

### Diagnóstico expuesto temporalmente
El endpoint `/api/export/pdf` actualmente expone `error.message` en producción (commit `bb40954`) para diagnosticar. **Debe revertirse** después del fix de PDF.

### Resend no configurado en Vercel
- `RESEND_API_KEY` y `RESEND_FROM` están vacíos en Vercel.
- Como ahora usamos back_urls, no es bloqueante.
- Si se quiere email automático para cross-device, hace falta crear cuenta en Resend, verificar dominio y agregar vars en Vercel.

### Cuota de 30 clases/mes no enforced
- La UI muestra "Hasta 30 clases / mes" como expectativa.
- **No hay enforcement server-side**. Un usuario podría generar 100 clases. Riesgo de costo asumido para MVP (el costo en tokens de OpenAI por usuario activo se estima en USD 1.5–4/mes, margen sigue sano).
- Cuando haya tracción: agregar contador en `lib/access` + tabla en Supabase.

### Recuperación de acceso cross-device
- Como no usamos email, si el usuario paga en móvil y luego quiere entrar desde laptop, **no puede automáticamente**.
- Workaround: tú generas código manual con script y se lo mandas por WhatsApp.
- Fix permanente futuro: habilitar Resend y mandar el token también por email como backup.

### Otros endpoints sin paywall
- `/api/extract-source`, `/api/generate-class-package`, `/api/generate-teaching-guide`, `/api/export/*` son **públicos** (sin gate).
- Decisión consciente del MVP: el costoso es `generate-lesson`, los otros son baratos o trabajan con datos ya generados.

### Facturación CFDI
- No implementado. MP genera comprobante MP estándar; si alguien necesita factura fiscal, se atiende manualmente.

### Panel de administración
- No existe. Para regenerar códigos, ver suscriptores, revocar: scripts locales con `ACCESS_JWT_SECRET` o queries directas a la API de MP.

---

## Mapa de archivos clave

```
app/
  page.tsx                        — Landing + paywall + form (PaywallGate wrapper)
  acceso/page.tsx                 — Landing post-checkout (back_url destino, también acepta ?code=)
  api/
    generate-lesson/route.ts      — Endpoint principal (protegido por requireAccess)
    extract-source/route.ts       — Upload de PDF/TXT/MD
    export/
      pdf/route.ts                — Roto en prod, diagnóstico temporal expuesto
      epub/route.ts               — Server-side EPUB
    access/
      verify/route.ts             — POST: redime un código JWT
      confirm-mp/route.ts         — POST: valida preapproval_id de MP, setea cookie
      status/route.ts             — GET: cookie activa? expira cuándo?
      logout/route.ts             — POST: limpia la cookie
    mp/
      webhook/route.ts            — Webhook de MP (firma + idempotencia + JWT + email opcional)

components/
  ChatForm.tsx                    — Formulario principal de inputs
  Preview.tsx                     — Render de la clase generada + botones de export
  FileDropZone.tsx                — Drag-and-drop de material fuente
  PaywallGate.tsx                 — Wrapper que muestra paywall si no hay cookie
  AccessCodeModal.tsx             — Modal para pegar JWT manualmente

lib/
  llm.ts                          — Cliente OpenAI/OpenRouter + sanitization
  orchestrator.ts                 — Lógica de generación (sub-agentes)
  schemas.ts                      — Zod schemas
  markdown.ts                     — Markdown → HTML
  pdf.ts                          — Extracción de texto de PDF/TXT/MD
  access/
    jwt.ts                        — Firma y verifica JWT con jose
    cookie.ts                     — Helpers de cookie HttpOnly
    guard.ts                      — requireAccess() para proteger endpoints
  mp/
    client.ts                     — fetch wrappers a MP API
    verify-signature.ts           — HMAC-SHA256 del webhook
    idempotency.ts                — Map en memoria
  email/
    resend.ts                     — Template y envío del email de acceso

tests/                            — 45 tests Vitest (8 archivos)
```

---

## Variables de entorno

| Variable | Para qué | Local | Vercel prod |
|---|---|---|---|
| `OPENAI_API_KEY` | Generación de clases | ✅ | ✅ |
| `MP_ACCESS_TOKEN` | API de Mercado Pago | ✅ | ✅ |
| `MP_WEBHOOK_SECRET` | Verificar firma de webhooks | ✅ | ⚠️ Falta agregar |
| `NEXT_PUBLIC_MP_SUBSCRIPTION_URL` | Link de checkout (frontend) | ✅ | ✅ |
| `ACCESS_JWT_SECRET` | Firma de JWTs de acceso | ✅ | ✅ |
| `ACCESS_JWT_ISSUER` | Issuer del JWT | ✅ (`aula.mx`) | ✅ |
| `REVOKED_JTIS` | Kill switch (lista de `jti` revocados) | (vacío) | (vacío) |
| `RESEND_API_KEY` | Email automático del token | (vacío) | (vacío) |
| `RESEND_FROM` | Remitente del email | ✅ default | ✅ default |
| `APP_BASE_URL` | Para links en emails | `http://localhost:3004` | (falta verificar) |

---

## Flujo de monetización end-to-end (estado actual)

```
1. Usuario llega a https://class-content-phi.vercel.app
   ↓
2. PaywallGate ve que no hay cookie → muestra CTA "Suscribirme con Mercado Pago"
   ↓
3. Click → redirige a https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=aa6821d5ff5d4f08915fedf4075e32e1
   ↓
4. Usuario paga 200 MXN con tarjeta/OXXO/SPEI
   ↓
5. MP autoriza → redirige a https://class-content-phi.vercel.app/acceso?preapproval_id=xxx&status=authorized
   ↓
6. /acceso detecta preapproval_id → POST a /api/access/confirm-mp
   ↓
7. /api/access/confirm-mp:
   - GET https://api.mercadopago.com/preapproval/{id} (con MP_ACCESS_TOKEN)
   - Si status === 'authorized', firma JWT (31 días)
   - Setea cookie HttpOnly aula_access
   - Devuelve { ok: true }
   ↓
8. /acceso muestra "¡Acceso activado!" → redirige a /
   ↓
9. PaywallGate ahora ve cookie activa (GET /api/access/status devuelve { active: true })
   ↓
10. Renderiza el formulario → usuario puede generar clases

EN PARALELO (independiente):
   MP manda webhook a /api/mp/webhook → verifica firma → log el token en Vercel logs
   (Sirve para renovaciones mensuales y como auditoría)
```

---

## Decisiones de arquitectura clave

1. **Sin base de datos en el MVP** — la verdad vive en (a) la firma del JWT, (b) la API de MP. Cuando haya tracción real, agregar Supabase.
2. **JWT auto-contenido** — no requiere DB ni Redis ni session store. Trivial de escalar.
3. **back_url + webhook como redundancia** — el back_url da UX instantánea (90% del caso); el webhook captura el 10% restante (usuario cierra el browser antes del redirect, renovación mensual).
4. **No reinventar pagos** — confiar en MP para CFDI, reembolsos, disputas, métodos de pago, OXXO/SPEI.
5. **Acceso manual como red de seguridad** — para founders, beta testers, soporte: script local firma un JWT y se lo mandas por WhatsApp.

---

## Próximos pasos sugeridos (no comprometidos)

| Prioridad | Tarea | Esfuerzo |
|---|---|---|
| 🔥 Alta | Arreglar `/api/export/pdf` con `outputFileTracingIncludes` en next.config.js | 30 min |
| 🔥 Alta | Revertir diagnóstico de error en `/api/export/pdf` | 5 min |
| 🔥 Alta | Agregar `MP_WEBHOOK_SECRET` en Vercel + redeploy | 5 min |
| Media | Configurar Resend para email automático del token (cross-device) | 1 hora |
| Media | Verificar `APP_BASE_URL` en Vercel apunta a `https://class-content-phi.vercel.app` | 2 min |
| Media | Cobrarte 200 MXN como smoke test end-to-end, validar flujo completo, reembolsar | 15 min |
| Baja | Enforcement de cuota 30 clases/mes (necesita DB ligera) | 2-4 horas |
| Baja | Panel admin minimalista (lista de suscriptores, revocar JTIs) | 1 día |
| Baja | Dominio propio (aula.mx u otro) y email transaccional verificado | 1-2 horas |
| Futuro | Plan escuelas (B2B): cobrar 1500–3000 MXN/mes/institución con N maestros | 1 semana |

---

## Cómo correr en local

```bash
git clone https://github.com/EmprendoX/Class-Content.git
cd Class-Content
npm install
# Crear .env.local con las variables listadas arriba
npm run dev          # http://localhost:3000 (o 3001-3004 si están ocupados)
npm run test         # Vitest
npm run build        # Verificar build
```

Para generar un JWT manual (acceso sin pago, para soporte):

```bash
node --input-type=module -e "
import('jose').then(async ({ SignJWT }) => {
  const fs = await import('node:fs');
  const env = Object.fromEntries(
    fs.readFileSync('.env.local','utf8')
      .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
  );
  const { randomUUID } = await import('node:crypto');
  const token = await new SignJWT({ preapprovalId: 'manual-grant', plan: 'pro' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject('email@usuario.com')
    .setIssuer(env.ACCESS_JWT_ISSUER || 'aula.mx')
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now()/1000) + 31*24*60*60)
    .sign(new TextEncoder().encode(env.ACCESS_JWT_SECRET));
  console.log('https://class-content-phi.vercel.app/acceso?code=' + encodeURIComponent(token));
});
"
```
