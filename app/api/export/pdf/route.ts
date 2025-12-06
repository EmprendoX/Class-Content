import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer, { type Browser } from 'puppeteer-core';

const MAX_HTML_LENGTH = 500 * 1024; // 500 KB aprox.

function resolveLocalChromeExecutable(): string | null {
  const candidates: string[] = [];

  const platform = process.platform;

  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    );
  } else if (platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] ?? 'C:/Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] ?? 'C:/Program Files (x86)';
    candidates.push(
      `${programFiles}/Google/Chrome/Application/chrome.exe`,
      `${programFilesX86}/Google/Chrome/Application/chrome.exe`
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let browser: Browser | null = null;

  try {
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud debe ser JSON válido.', code: 'invalid-json', requestId },
        { status: 400 }
      );
    }

    const { html } = (parsedBody ?? {}) as { html?: string };

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Debes enviar el contenido HTML a exportar.', code: 'missing-html', requestId },
        { status: 400 }
      );
    }

    if (html.length > MAX_HTML_LENGTH) {
      return NextResponse.json(
        {
          error: 'El documento es demasiado grande para exportar a PDF (máximo 500 KB).',
          code: 'payload-too-large',
          requestId,
        },
        { status: 413 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      const executablePath = process.env.CHROME_EXECUTABLE_PATH ?? resolveLocalChromeExecutable();
      if (!executablePath) {
        return NextResponse.json(
          {
            error:
              'No se encontró una instalación de Chrome para exportar PDF. Instala Google Chrome o configura CHROME_EXECUTABLE_PATH.',
            code: 'missing-executable',
            requestId,
          },
          { status: 500 }
        );
      }

      browser = await puppeteer.launch({
        headless: true,
        executablePath,
      });
    }

    const page = await browser.newPage();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              max-width: 720px;
              margin: 0 auto;
              padding: 24px 32px;
              color: #333;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            h1, h2, h3 {
              color: #00366D;
              margin-top: 1.6em;
              margin-bottom: 0.6em;
            }
            h1 {
              text-align: center;
              margin-top: 0;
            }
            h2 {
              text-align: center;
              margin-top: 2em;
            }
            p {
              margin-bottom: 1em;
            }
            ul, ol {
              padding-left: 1.4em;
              margin: 0 0 1em 0;
            }
            li {
              margin-bottom: 0.6em;
            }
            pre, code {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
              white-space: pre-wrap;
              word-break: break-word;
              background: #f6f8fa;
              border-radius: 6px;
            }
            pre {
              padding: 12px 16px;
              margin: 1em 0;
              border: 1px solid #e2e8f0;
            }
            code {
              padding: 0 4px;
            }
            blockquote {
              border-left: 4px solid #cbd5f5;
              padding-left: 16px;
              color: #4a5568;
              margin: 1em 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px 10px;
              text-align: left;
              vertical-align: top;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="linkedin-campaign.pdf"',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    console.error(`[PDF] ${requestId} error`, error);
    const payload: Record<string, unknown> = {
      error: 'Unable to generate PDF.',
      code: 'export-failed',
      requestId,
    };
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      payload.details = error.message;
    }
    return NextResponse.json(payload, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn(`[PDF] ${requestId} failed to close browser`, closeError);
      }
    }
    console.info(`[PDF] ${requestId} completed in ${Date.now() - startedAt}ms`);
  }
}


