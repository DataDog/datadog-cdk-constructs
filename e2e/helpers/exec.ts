/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import child_process from "node:child_process";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export const execPromise = async (command: string, env?: Record<string, string | undefined>): Promise<ExecResult> => {
  return new Promise((resolve) => {
    child_process.exec(
      command,
      { env: { ...process.env, ...env }, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error && typeof error.code === "number" ? error.code : error ? 1 : 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      },
    );
  });
};

// Transient cloud/provider errors that are safe to retry. We retry the cloud, not
// the assertions: a real config mismatch surfaces immediately, never masked by a retry.
const RETRYABLE_PATTERNS = [
  "RequestTimeout",
  "Throttling",
  "TooManyRequests",
  "Rate exceeded",
  "ServiceUnavailable",
  "InternalFailure",
  "ResourceConflictException",
  "OperationAbortedException",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "Connection reset",
  "timed out",
  "UPDATE_IN_PROGRESS",
];

const isRetryable = (result: ExecResult): boolean => {
  const output = `${result.stdout} ${result.stderr}`;

  return RETRYABLE_PATTERNS.some((pattern) => output.includes(pattern));
};

export const execPromiseWithRetries = async (
  command: string,
  env?: Record<string, string | undefined>,
  { maxAttempts = 3, delaySeconds = 10 }: { maxAttempts?: number; delaySeconds?: number } = {},
): Promise<ExecResult> => {
  let result: ExecResult = { exitCode: 1, stdout: "", stderr: "" };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result = await execPromise(command, env);
    if (result.exitCode === 0) {
      return result;
    }
    if (attempt < maxAttempts && isRetryable(result)) {
      console.log(
        `Command failed with retryable error (attempt ${attempt}/${maxAttempts}), retrying in ${delaySeconds}s...`,
      );
      console.log(`stdout: ${result.stdout}`);
      console.log(`stderr: ${result.stderr}`);
      await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
    } else {
      return result;
    }
  }

  return result;
};

export const execSync = (command: string, env?: Record<string, string | undefined>): string => {
  return child_process.execSync(command, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, ...env },
  });
};
