# LinkedIn Content Architect

AI agentic workflow built with Next.js 14 that turns a single tema central into una campaña viral para LinkedIn. El pipeline ahora coordina: Ideation Strategist → Post Writers (×5) → Video Script Producer → Markdown Formatter.

## Features

- **Campaign Blueprint Ideation**: Divide el tema principal en cinco ángulos complementarios con promesa, tipo de post y razones estratégicas.
- **Copy Ready-To-Paste**: Cada ángulo produce un post completo en Markdown con gancho, storytelling, insight clave, CTA y hashtags accionables.
- **Video Script Layer**: Un productor creativo entrega guiones para video vertical (LinkedIn/Shorts/Reels) sincronizados con cada post.
- **Export Stack**: Descarga la campaña en `.md`, `.pdf` o `.epub`, o copia al portapapeles tanto el post como el guion.
- **Progress Tracking**: Indicadores en tiempo real para las etapas de ideation → posts → video → formato editorial.
- **Markdown + HTML Preview**: Visualiza el deliverable final o trabaja directamente desde el markdown generado.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI SDK** (with OpenRouter fallback)
- **Zod** (validation)
- **Puppeteer-core** + **@sparticuz/chromium** (PDF generation)
- **epub-gen** (EPUB generation)
- **marked** (Markdown to HTML conversion)

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- OpenAI API key (or OpenRouter API key as fallback)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here_optional
   ```

   For local PDF generation (development), you may also need:
   ```env
   CHROME_EXECUTABLE_PATH=/path/to/chrome
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Run the test suite (optional):**
   ```bash
   npm run test
   ```

## Usage

1. **Completa el brief:**
   - Tema central, perfil de audiencia y objetivo de la campaña (obligatorios)
   - Voz de marca, CTA, oferta a destacar y contexto adicional (opcionales)

2. **Genera campaña viral:**
   - Haz clic en “Generar campaña viral”
   - Sigue el progreso: ideación de ángulos → redacción de posts → guiones de video → formateo

3. **Revisa y exporta:**
   - Copia los posts y guiones listos para LinkedIn
   - Explora el Markdown/HTML o descarga en `.md`, `.pdf`, `.epub`

## Architecture

### Workflow Steps

- **Ideation Strategist**: Destila el tema en cinco ángulos poderosos con promesas claras y razones estratégicas.
- **Post Writers (×5)**: Redactan posts completos en tono LinkedIn listo para copiar y pegar.
- **Video Script Producer**: Genera guiones verticales sincronizados con cada post.
- **Formatter**: Entrega el Markdown editorial con resumen ejecutivo, posts y guiones.
 
 ### File Structure
 
 ```
linkedin-content-architect/
├── app/
│   ├── page.tsx                      # Main UI
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   └── api/
│       ├── generate-teaching-guide/
│       │   └── route.ts              # LinkedIn campaign endpoint
│       └── export/
│           ├── pdf/route.ts           # PDF export
│           └── epub/route.ts          # EPUB export
├── components/
│   ├── ChatForm.tsx                  # Campaign brief form
│   ├── Progress.tsx                  # Stage indicator
│   └── Preview.tsx                   # Campaign preview
├── lib/
│   ├── orchestrator.ts               # Campaign orchestration logic
│   ├── prompts.ts                    # Role prompts for cada agente
│   ├── llm.ts                        # OpenAI/OpenRouter wrapper
│   ├── schemas.ts                    # Zod validation schemas
│   └── markdown.ts                   # Markdown utilities
└── docs/
    └── n8n/
        └── ebook_creator.json        # Legacy reference
 ```
 
 ## API Endpoints
 
 ### POST `/api/generate-teaching-guide`
 Genera una campaña completa de LinkedIn (5 posts + 5 guiones de video).
 
 **Request Body:**
 ```json
 {
  "mainTheme": "Cómo liderar la adopción de IA en equipos comerciales",
  "audienceProfile": "CEOs de empresas SaaS Series A-B en Latam",
  "campaignGoal": "Agendar 30 demos calificadas en 30 días",
  "brandVoice": "Voz directa, basada en datos, cero humo corporativo",
  "callToAction": "Escríbeme \"IA\" por DM y te comparto el playbook",
  "offerDescription": "Programa 1:1 de aceleración comercial",
  "contextNotes": "Competimos contra consultoras tradicionales; incluir caso de éxito FinTech X"
 }
 ```
 
 **Response:**
 ```json
 {
  "campaignTitle": "Demo Campaign: Escalar ventas B2B con IA",
  "toneRecipe": "Confianza en primera persona, ritmo rápido, storytelling con datos verificados.",
  "hookPrinciples": ["Arranca con tensión", "Usa números concretos", "Cierra con comunidad"],
  "angles": [
    {
      "id": 1,
      "title": "Ángulo 1",
      "promise": "Promesa 1",
      "postType": "story",
      "keyPoints": ["Punto 1", "Punto 2", "Punto 3"],
      "whyItWorks": "Porque conecta con la urgencia de adopción."
    }
  ],
  "posts": [
    {
      "angleId": 1,
      "angleTitle": "Ángulo 1",
      "headline": "Headline 1",
      "hook": "Hook 1",
      "copyMarkdown": "...",
      "keyTakeaway": "Insight 1",
      "callToAction": "CTA",
      "hashtags": ["growth", "linkedin"],
      "videoScript": {
        "angleId": 1,
        "title": "Video 1",
        "hook": "Video hook",
        "duration": "0:55",
        "beats": [
          {
            "order": 1,
            "shot": "Shot",
            "voiceOver": "Texto",
            "onScreenText": "",
            "cameraDirection": "Plano medio"
          }
        ],
        "closing": "Cierre",
        "callToAction": "CTA video"
      }
    }
  ],
  "markdown": "...",
  "html": "...",
  "meta": {
    "mainTheme": "...",
    "audienceProfile": "...",
    "campaignGoal": "...",
    "brandVoice": "...",
    "generatedAt": "..."
  }
 }
 ```

### POST `/api/export/pdf`
Genera un PDF a partir del contenido HTML. En desarrollo, el API detecta automáticamente Google Chrome en macOS, Windows o Linux; si no se encuentra, configura `CHROME_EXECUTABLE_PATH` apuntando al binario correspondiente.

### POST `/api/export/epub`
Generates an EPUB from Markdown content.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (fallback) |
| `CHROME_EXECUTABLE_PATH` | No | Path to Chrome executable (dev only) |

## Troubleshooting

- **Export PDF en desarrollo:** si no tienes Chrome instalado, instala Google Chrome o especifica manualmente `CHROME_EXECUTABLE_PATH`. En producción (Vercel) se usa automáticamente `@sparticuz/chromium`.
- **Documento demasiado grande:** los exports de PDF/EPUB limitan el contenido a ~500 KB. Reduce extensiones o divide la secuencia si recibes un error `payload-too-large`.
- **Fallos en la guía generada:** revisa que `OPENAI_API_KEY` esté configurada y vuelve a intentar. Los mensajes incluyen `requestId` para depurar en los logs del servidor.
- **Pruebas unitarias:** ejecuta `npm run test`. Si Vitest no está instalado aún, ejecuta `npm install` para descargar las nuevas dependencias.

## Testing

La suite de pruebas se ejecuta con [Vitest](https://vitest.dev/) y cubre validaciones de los esquemas Zod y el flujo del orquestador con funciones LLM simuladas.

```bash
npm run test
```

Se generará un reporte de cobertura en la carpeta `coverage/` cuando ejecutes la suite localmente.

## License

MIT


