/**
 * The window configuration of phase A.
 *
 * A file and not flags, because the operator has to be able to show the gate
 * exactly what was asked of each site during the hour — which URLs, at what
 * rhythm, and against which robots.txt. It is validated strictly for the same
 * reason the report is: a typo in a key would otherwise become a target that
 * was never captured.
 *
 * `robotsFiles` holds PATHS to robots.txt saved before the window, not URLs to
 * fetch during it. Fetching robots.txt inside the tick loop would be a request
 * the RN-11 budget does not account for, and the policy of a site does not
 * change during one hour (F-SPEC-002-2).
 */
import { z } from 'zod';

export const CaptureTargetSchema = z.strictObject({
  source: z.string().min(1),
  competition_id: z.string().min(1),
  url: z.url(),
  ext: z.string().regex(/^[a-z0-9]+$/),
});

export const WindowConfigSchema = z.strictObject({
  /** Human label, for the report and the runbook. */
  window: z.string().min(1),
  duration_minutes: z.int().min(1).max(600),
  /**
   * How often the loop wakes up. Smaller than a minute on purpose: the limiter
   * of CA-1 is what enforces RN-11, and a tighter loop only means each target
   * is captured closer to its due minute.
   */
  tick_seconds: z.int().min(1).max(60),
  targets: z.array(CaptureTargetSchema).min(1),
  /** Origin → path of the robots.txt saved before the window. */
  robots_files: z.record(z.url(), z.string().min(1)),
});

export type WindowConfig = z.infer<typeof WindowConfigSchema>;
