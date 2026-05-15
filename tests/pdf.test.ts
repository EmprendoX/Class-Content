import { describe, it, expect } from 'vitest';
import { extractFromBuffer, SourceExtractionError } from '@/lib/pdf';

describe('extractFromBuffer', () => {
  it('extracts plain text from a TXT buffer', async () => {
    const text =
      'Este es un capítulo de prueba sobre fracciones equivalentes para 4° de primaria. ' +
      'Contiene definiciones, ejemplos y vocabulario. La fracción 1/2 es equivalente a 2/4 ' +
      'porque ambas representan la misma cantidad de pizza partida en distintos pedazos.';
    const buffer = Buffer.from(text, 'utf-8');
    const result = await extractFromBuffer(buffer, 'notes.txt', 'text/plain');
    expect(result.filename).toBe('notes.txt');
    expect(result.text).toContain('fracciones equivalentes');
    expect(result.pageCount).toBe(1);
    expect(result.wordCount).toBeGreaterThan(10);
    expect(result.truncated).toBe(false);
  });

  it('accepts Markdown files by extension when mimeType is empty', async () => {
    const text =
      '# Apuntes\n\nLa fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química usada para producir glucosa a partir de dióxido de carbono y agua.';
    const buffer = Buffer.from(text, 'utf-8');
    const result = await extractFromBuffer(buffer, 'apuntes.md', '');
    expect(result.text).toContain('fotosíntesis');
    expect(result.pageCount).toBe(1);
  });

  it('rejects content shorter than the minimum chars threshold as no-text', async () => {
    const buffer = Buffer.from('Hola.', 'utf-8');
    await expect(extractFromBuffer(buffer, 'tiny.txt', 'text/plain')).rejects.toMatchObject({
      code: 'no-text',
    });
  });

  it('rejects buffers larger than 10 MB as too-large', async () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024 + 1, 'a');
    await expect(extractFromBuffer(buffer, 'big.txt', 'text/plain')).rejects.toBeInstanceOf(
      SourceExtractionError
    );
    await expect(extractFromBuffer(buffer, 'big.txt', 'text/plain')).rejects.toMatchObject({
      code: 'too-large',
    });
  });

  it('rejects unsupported mime types and extensions as bad-type', async () => {
    const buffer = Buffer.from('fake image content', 'utf-8');
    await expect(extractFromBuffer(buffer, 'image.png', 'image/png')).rejects.toMatchObject({
      code: 'bad-type',
    });
  });

  it('truncates to 20.000 words and marks truncated true', async () => {
    const word = 'palabra ';
    const text = word.repeat(20_500); // 20.500 words
    const buffer = Buffer.from(text, 'utf-8');
    const result = await extractFromBuffer(buffer, 'long.txt', 'text/plain');
    expect(result.wordCount).toBe(20_000);
    expect(result.truncated).toBe(true);
    expect(result.text.split(/\s+/).filter(Boolean).length).toBe(20_000);
  });
});
