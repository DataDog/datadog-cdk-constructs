import { EnvVarManager } from "../../src/ecs/environment";

describe("EnvVarManager", () => {
  let envVarManager: EnvVarManager;

  beforeEach(() => {
    envVarManager = new EnvVarManager();
  });

  it("should add an environment variable", () => {
    envVarManager.add("KEY1", "value1");
    expect(envVarManager.retrieve("KEY1")).toBe("value1");
  });

  it("should not add an environment variable if the value is undefined", () => {
    envVarManager.add("KEY1", undefined);
    expect(envVarManager.retrieve("KEY1")).toBeUndefined();
  });

  it("should overwrite an existing environment variable and record the key", () => {
    envVarManager.add("KEY1", "value1");
    envVarManager.add("KEY1", "value2");
    expect(envVarManager.retrieve("KEY1")).toBe("value2");
    expect(envVarManager.retrieveOverwrittenKeys()).toContain("KEY1");
  });

  it("should add all environment variables from a record", () => {
    const envVars = { KEY1: "value1", KEY2: "value2" };
    envVarManager.addAll(envVars);
    expect(envVarManager.retrieve("KEY1")).toBe("value1");
    expect(envVarManager.retrieve("KEY2")).toBe("value2");
  });

  it("should return all stored environment variables", () => {
    const envVars = { KEY1: "value1", KEY2: "value2" };
    envVarManager.addAll(envVars);
    expect(envVarManager.retrieveAll()).toEqual(envVars);
  });

  it("should return a list of keys that have been overwritten", () => {
    envVarManager.add("KEY1", "value1");
    envVarManager.add("KEY1", "value2");
    envVarManager.add("KEY2", "value3");
    envVarManager.add("KEY2", "value4");
    expect(envVarManager.retrieveOverwrittenKeys()).toEqual(["KEY1", "KEY2"]);
  });

  it("should return a string representation of the environment variables", () => {
    const envVars = { KEY1: "value1", KEY2: "value2" };
    envVarManager.addAll(envVars);
    expect(envVarManager.toString()).toBe(JSON.stringify(envVars));
  });

  it("should initialize with default environment variables", () => {
    const defaultEnvVars = { KEY1: "value1", KEY2: "value2" };
    envVarManager = new EnvVarManager(defaultEnvVars);
    expect(envVarManager.retrieveAll()).toEqual(defaultEnvVars);
  });
});
