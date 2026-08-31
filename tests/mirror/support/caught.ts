/**
 * Captures the error a call throws, so the assertions about its message can be
 * written unconditionally.
 *
 * `try { … } catch { expect(…) }` reads fine and lies quietly: if the call
 * stops throwing, the `catch` never runs, no assertion runs, and the test
 * passes green while proving nothing. (It is also what oxlint's
 * `vitest/no-conditional-expect` is about.)
 */
export function caught(call: () => unknown): Error {
  try {
    call();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw, and it did not');
}

export async function caughtAsync(call: () => Promise<unknown>): Promise<Error> {
  try {
    await call();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to reject, and it did not');
}
