/**
 * CA-9 (disk half) and CA-10.4 — the contract battery against `DiskRawStore`,
 * plus the two things only a filesystem can be asked.
 */
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, describe, expect, test } from 'vitest';
import { DiskRawStore } from '@/raw/disk';
import { InvalidRawKeyError, RawKeyConflictError, rawKey } from '@/raw/store';
import type { RawObjectMeta } from '@/raw/store';
import { rawStoreContract } from './contract';

const created: string[] = [];

async function newParent(): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), 'marcador-raw-'));
  created.push(parent);
  return parent;
}

afterAll(async () => {
  await Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true })));
});

rawStoreContract('DiskRawStore', async () => {
  const parent = await newParent();
  return new DiskRawStore(join(parent, 'raw'));
});

async function treeOf(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.map((entry) => join(entry.parentPath, entry.name)).sort();
}

const META: RawObjectMeta = {
  source: 'test',
  competition_id: 'escape',
  fetched_at: '2026-03-21T17:00:00.000Z',
  ext: 'html',
};

describe('CA-10.4 — nothing is ever written outside the root', () => {
  test('the parent of the root is untouched after every escape attempt', async () => {
    const parent = await newParent();
    const root = join(parent, 'raw');
    const store = new DiskRawStore(root);

    // Seed one legitimate object so the root exists and the comparison is
    // about the escape attempts, not about the store's own first write.
    await store.put(META, new TextEncoder().encode('legitimate'));
    const before = await treeOf(parent);

    const escaping = [
      '../../escaped.html',
      '/etc/passwd',
      'test\\..\\..\\escaped.html',
      'test/../../escaped.html',
      'TEST/comp/2026-03-21/x.html',
    ];

    for (const key of escaping) {
      await expect(store.get(key)).rejects.toThrow(InvalidRawKeyError);
      await expect(store.list(key)).rejects.toThrow(InvalidRawKeyError);
    }

    expect(await treeOf(parent)).toEqual(before);
  });
});

describe('CA-9.6 — an archive edited from outside is not silently overwritten', () => {
  test('put throws RawKeyConflictError when the key already holds other bytes', async () => {
    const parent = await newParent();
    const root = join(parent, 'raw');
    const store = new DiskRawStore(root);
    const body = new TextEncoder().encode('the response we fetched');
    const key = rawKey(META, body);

    // Somebody put different bytes under that key by hand.
    const path = join(root, 'objects', key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, new TextEncoder().encode('something else entirely'));

    await expect(store.put(META, body)).rejects.toThrow(RawKeyConflictError);
  });
});
