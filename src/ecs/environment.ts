/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

export class EnvVarManager {
  private envVars: Record<string, string> = {};
  private overwrittenKeys: Set<string> = new Set();

  constructor(defaultEnvVars: Record<string, string> = {}) {
    this.addAll(defaultEnvVars);
  }

  /**
   * Adds an environment variable if the value is not undefined.
   * If the key already exists, it records that it has been overwritten.
   */
  add(key: string, value: string | undefined): void {
    if (value === undefined) {
      return;
    }
    if (this.envVars.hasOwnProperty(key)) {
      this.overwrittenKeys.add(key);
    }
    this.envVars[key] = value;
  }

  /**
   * Adds all environment variables from a record.
   */
  addAll(envVars: Record<string, string> | undefined): void {
    if (envVars === undefined) {
      return;
    }
    for (const [key, value] of Object.entries(envVars)) {
      this.add(key, value);
    }
  }

  /**
   * Retrieves an environment variable by key.
   */
  retrieve(key: string): string | undefined {
    return this.envVars[key];
  }

  /**
   * Returns all stored environment variables.
   */
  retrieveAll(): Record<string, string> {
    return { ...this.envVars };
  }

  /**
   * Returns a list of keys that have been overwritten.
   */
  retrieveOverwrittenKeys(): string[] {
    return Array.from(this.overwrittenKeys);
  }

  /**
   * Returns a string representation of the environment variables.
   */
  toString(): string {
    return JSON.stringify(this.envVars);
  }
}
