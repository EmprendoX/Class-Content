# Lesson Plan Builder

An AI-assisted workflow built with Next.js 14 that generates five-class weekly lesson plans fully aligned with Montessori, constructivist, and critical-thinking principles. All outputs are in English and include objectives, hands-on activities, materials, and reflective questions, plus automated pedagogy validation and print/export tools.

## Features

- **English-only lesson generation**: System prompts enforce English output with Montessori/constructivist/critical-thinking checklists for every class.
- **Structured weekly template**: A reusable 5-lesson schema with objectives, materials, constructivist activity phases, critical questions, and assessment notes.
- **Pedagogy validation**: Automated checks for Montessori (choice, hands-on, self-paced, self-correction), constructivist (prior knowledge, guided discovery, social interaction), and critical-thinking (open questions, evidence-based claims, peer discussion) requirements.
- **Lesson Plan Builder UI**: Montessori-inspired palette with checklist badges, lesson cards, and inline compliance indicators.
- **Exports**: Download Markdown/PDF/EPUB or use the print-friendly layout for sharing.
- **Class package orchestrator**: Topic-level sub-agents (conceptual, examples, exercises/evaluation, resources, pedagogy review)
  generate leveled materials with Bloom alignment and publication-ready Markdown/HTML.

## Data model

```ts
interface LessonPlan {
  title: string;
  objectives: string[];
  materials: string[];
  activities: {
    prior_knowledge: string;
    exploration: string;
    concept_building: string;
    reflection: string;
  };
  critical_questions: string[];
  assessment: string;
  pedagogy_flags: {
    montessori: { choice: boolean; hands_on: boolean; self_paced: boolean; self_correction: boolean };
    constructivist: { link_to_prior_knowledge: boolean; guided_discovery: boolean; social_interaction: boolean };
    critical: { open_questions: boolean; evidence_based_claims: boolean; peer_discussion: boolean };
  };
}

interface WeeklyProgram {
  weeklyTheme: string;
  overview: string;
  template: { lesson: string };
  lessons: LessonPlan[]; // always 5 lessons
}
```

Validation attaches per-lesson and weekly summaries to flag English-only compliance and checklist completion before formatting for export.

## JSON/YAML templates

See `docs/templates/weekly_program.json` and `docs/templates/weekly_program.yaml` for a ready-to-fill 5-lesson weekly schema that mirrors the API contract and validator expectations.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for the Montessori-inspired UI
- **OpenAI SDK** (with OpenRouter fallback) for lesson generation
- **Zod** for schema validation
- **Puppeteer-core** + **@sparticuz/chromium** for PDF export
- **epub-gen** for EPUB export
- **marked** for Markdown → HTML rendering

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** – create `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here_optional
   CHROME_EXECUTABLE_PATH=/path/to/chrome   # dev PDF support (optional)
   ```

3. **Run dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Tests**
   ```bash
   npm run test
   ```

## API

### POST `/api/generate-teaching-guide`
Generates a validated weekly lesson program (5 lessons).

**Request body**
```json
{
  "weeklyTheme": "Exploring Ecosystems",
  "subjectArea": "Science",
  "gradeLevel": "Upper Elementary",
  "learnerProfile": "Hands-on learners who like field work",
  "constraints": "Low-cost, easily sourced materials"
}
```

**Response**
```json
{
  "weeklyTheme": "Exploring Ecosystems",
  "overview": "Concise English overview...",
  "template": { "lesson": "Objectives, materials, constructivist phases, critical questions, assessment" },
  "lessons": [
    {
      "title": "Lesson 1",
      "objectives": ["..."],
      "materials": ["..."],
      "activities": {
        "prior_knowledge": "...",
        "exploration": "...",
        "concept_building": "...",
        "reflection": "..."
      },
      "critical_questions": ["..."],
      "assessment": "...",
      "pedagogy_flags": {
        "montessori": { "choice": true, "hands_on": true, "self_paced": true, "self_correction": true },
        "constructivist": { "link_to_prior_knowledge": true, "guided_discovery": true, "social_interaction": true },
        "critical": { "open_questions": true, "evidence_based_claims": true, "peer_discussion": true }
      },
      "validation": { "issues": [], "englishOnly": true, "montessoriComplete": true, "constructivistComplete": true, "criticalThinkingComplete": true }
    }
  ],
  "validation": {
    "englishOnly": true,
    "lessonsPassed": 5,
    "totalLessons": 5,
    "blockingIssues": []
  },
  "markdown": "...",
  "html": "...",
  "meta": {
    "subjectArea": "Science",
    "gradeLevel": "Upper Elementary",
    "learnerProfile": "Hands-on learners who like field work",
    "constraints": "Low-cost, easily sourced materials",
  "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/generate-class-package`
Builds a publication-ready class package that launches topic-level sub-agents (conceptual explanation, examples, exercises/evaluation, complementary resources, pedagogy review) and validates minimum length, objective coverage, and Bloom alignment.

**Request body**
```json
{
  "classTitle": "Data Literacy for High School",
  "level": "Intermediate",
  "bloomLevel": "analyze",
  "overallObjectives": ["Interpret charts", "Critique misleading statistics"],
  "syllabus": [
    { "topic": "Data Types", "objectives": ["Differentiate categorical and numerical data"] },
    { "topic": "Visual Literacy", "objectives": ["Read line and bar charts", "Spot bias"] }
  ],
  "constraints": "Prefer low-cost datasets and browser-based tools"
}
```

**Response**
```json
{
  "classTitle": "Data Literacy for High School",
  "level": "Intermediate",
  "bloomLevel": "analyze",
  "overallObjectives": ["..."],
  "syllabus": [
    { "topic": "Data Types", "objectives": ["..."] }
  ],
  "topics": [
    {
      "topic": "Data Types",
      "levelTemplate": "How the template fits the intermediate level",
      "bloomTarget": "analyze",
      "objectives": ["..."],
      "sections": {
        "introduction": "...",
        "theory": "...",
        "examples": ["..."],
        "exercises_with_solutions": [
          { "prompt": "...", "solution": "...", "bloom_focus": "apply" }
        ],
        "self_assessment": ["..."],
        "resources": ["..."]
      },
      "coverage": {
        "objectivesAddressed": ["..."],
        "bloomAlignment": "...",
        "minimumLengthRationale": "..."
      },
      "subagentNotes": {
        "conceptual": "...",
        "examples": "...",
        "exercises": "...",
        "resources": "...",
        "review": "..."
      },
      "validation": {
        "minLengthOk": true,
        "objectivesCovered": true,
        "bloomAligned": true,
        "issues": []
      }
    }
  ],
  "consolidated": {
    "overview": "...",
    "publishingNotes": "...",
    "learnerJourney": "...",
    "qaChecklist": "..."
  },
  "validation": {
    "englishOnly": true,
    "topicsPassed": 2,
    "totalTopics": 2,
    "blockingIssues": []
  },
  "markdown": "...",
  "html": "...",
  "meta": {
    "level": "Intermediate",
    "bloomLevel": "analyze",
    "constraints": "Prefer low-cost datasets and browser-based tools",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/export/pdf`
Generate a PDF from the provided HTML payload.

### POST `/api/export/epub`
Generate an EPUB from Markdown content.

## Validation rules

- Rejects lessons missing objectives, materials, constructivist phases, critical questions, or pedagogy checklist items.
- Enforces English-only content (accents and non-ASCII Spanish characters are blocked).
- Blocks weekly plans unless all five lessons pass Montessori, constructivist, and critical-thinking checks.

## Testing

Run the Vitest suite:

```bash
npm run test
```

A coverage report is generated locally in `coverage/`.

## Monetización MVP (Mercado Pago + código de acceso por email)

El endpoint `POST /api/generate-lesson` está protegido por una suscripción Mercado Pago de **200 MXN/mes**. El flujo es:

1. El usuario hace click en el CTA del paywall y va al link de Mercado Pago (`NEXT_PUBLIC_MP_SUBSCRIPTION_URL`).
2. Cuando MP autoriza la suscripción, envía un webhook a `POST /api/mp/webhook`.
3. El backend verifica la firma `x-signature`, consulta el estado real con `GET /preapproval/{id}`, firma un JWT de 31 días y manda un email vía Resend con un link `/acceso?code=<JWT>`.
4. El usuario abre el link → `/api/access/verify` setea una cookie HttpOnly `aula_access`.
5. Las llamadas a `/api/generate-lesson` validan el JWT vía cookie; si falta o expiró devuelven `402 { code: 'no-subscription' | 'subscription-expired' }` y la UI abre el modal de "Ingresa tu código".

No hay base de datos: la verdad vive en el JWT firmado y en la API de Mercado Pago. Las renovaciones mensuales reciben un webhook `subscription_authorized_payment` que reemite un nuevo JWT.

### Variables de entorno

Copia `.env.example` a `.env.local` y completa:

| Variable | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Access token del vendedor (TEST-... o APP_USR-...). |
| `MP_WEBHOOK_SECRET` | Clave secreta del webhook configurada en panel MP. |
| `NEXT_PUBLIC_MP_SUBSCRIPTION_URL` | Link público del preapproval (lo creas manualmente en panel MP). |
| `ACCESS_JWT_SECRET` | ≥ 32 caracteres. Genera con `openssl rand -base64 48`. |
| `ACCESS_JWT_ISSUER` | Issuer fijo, ej. `aula.mx`. |
| `REVOKED_JTIS` | (Opcional) lista de `jti` revocados, separados por coma. Kill switch sin DB. |
| `RESEND_API_KEY` | API key de Resend. |
| `RESEND_FROM` | Remitente verificado, ej. `Aula <acceso@aula.mx>`. |
| `APP_BASE_URL` | URL canónica (usada en links del email). |

### Setup de Mercado Pago

1. Crea una aplicación en https://www.mercadopago.com.mx/developers.
2. **Crea el plan de suscripción** (Suscripciones → Plan) en 200 MXN MXN/mes y copia el **link público de checkout** a `NEXT_PUBLIC_MP_SUBSCRIPTION_URL`.
3. **Configura el webhook**: panel → Webhooks → Configurar notificaciones.
   - URL: `https://<tu-dominio>/api/mp/webhook` (en dev usa `ngrok http 3000`).
   - Eventos: `preapproval` y `subscription_authorized_payment`.
   - Copia la clave secreta a `MP_WEBHOOK_SECRET`.
4. Copia el access token a `MP_ACCESS_TOKEN` (TEST en dev, APP_USR en prod — el secret del webhook es distinto por modo).

### Probar en sandbox

Usa los **usuarios de prueba** de MP (panel → Cuentas de prueba) para crear un comprador TEST y pagar con una de las [tarjetas de prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/additional-content/test-cards) (ej. Mastercard `5031 7557 3453 0604`).

1. `npm run dev` y `ngrok http 3000` en otra terminal.
2. Configura el webhook del panel apuntando al túnel ngrok.
3. Inicia sesión como el comprador TEST en otra ventana, abre el link de checkout, paga.
4. Revisa logs del servidor: deberías ver `[MPWebhook] ... preapproval ... status=authorized`.
5. Llega un email de Resend con el código y el link `/acceso?code=...`.
6. Click → cookie seteada → puedes generar clases.

### Regenerar un código manualmente

Si un usuario pierde su email, puedes regenerar un JWT desde un script local:

```bash
node -e "
const { signAccessToken } = require('./lib/access/jwt');
require('dotenv').config({ path: '.env.local' });
signAccessToken({ email: 'docente@ejemplo.com', preapprovalId: 'pre_xxx' })
  .then(r => console.log(r.token));
"
```

### Lo que el MVP NO hace

- No persiste suscripciones en una base de datos (la fuente de verdad es la API de MP + JWT firmado).
- No enforza la cuota de 30 clases/mes server-side (se muestra como expectativa en la UI).
- No tiene panel admin: regeneración y revocación se hacen con scripts/env vars.
- No emite CFDI: MP genera comprobante MP estándar; factura fiscal se atiende manualmente.
