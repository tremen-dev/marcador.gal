/**
 * `ffmpeg` on the LAPTOP, never inside the function (SPEC-019 CA-2.1): the
 * native chunk (MPEG-TS/AAC, ADTS, fMP4) → mono 16 kHz PCM WAV, which every
 * engine accepts. What it costs (ms) is reported so ADR-029 §7's third step
 * has a number next to it.
 */
import { spawn } from 'node:child_process';

export interface Transcoded {
  readonly wav: Uint8Array;
  readonly ms: number;
}

export const FFMPEG_ARGS = ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', '-ac', '1', '-ar', '16000', '-f', 'wav', 'pipe:1'] as const;

export function transcodeToWav(input: Uint8Array, ffmpeg = 'ffmpeg'): Promise<Transcoded> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn(ffmpeg, [...FFMPEG_ARGS], { stdio: ['pipe', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', (d: Buffer) => out.push(d));
    child.stderr.on('data', (d: Buffer) => err.push(d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(err).toString()}`));
      else resolve({ wav: new Uint8Array(Buffer.concat(out)), ms: Date.now() - started });
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(Buffer.from(input));
  });
}
