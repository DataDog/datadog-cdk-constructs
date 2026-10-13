import { mergeManagedInstancesProps, validateECSManagedInstancesProps } from "../../../src/ecs/managed-instances/utils";

describe("mergeManagedInstancesProps", () => {
  it("returns the lower-precedence props unchanged when higher-precedence props are undefined", () => {
    const lower = { family: "test-family", taskCpu: "256" };
    expect(mergeManagedInstancesProps(lower, undefined)).toBe(lower);
  });

  it("lets higher-precedence top-level scalar props win", () => {
    const lower = { family: "test-family", taskCpu: "256", taskMemory: "512" };
    const higher = { family: "test-family", taskCpu: "1024" };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.taskCpu).toBe("1024");
    expect(merged.taskMemory).toBe("512");
  });

  it("merges the apm feature config field-by-field, letting higher-precedence fields win", () => {
    const lower = { family: "f", apm: { isEnabled: true, isSocketEnabled: true, isProfilingEnabled: false } };
    const higher = { family: "f", apm: { isSocketEnabled: false } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.apm).toEqual({ isEnabled: true, isSocketEnabled: false, isProfilingEnabled: false });
  });

  it("merges the dogstatsd feature config field-by-field", () => {
    const lower = { family: "f", dogstatsd: { isEnabled: true, isSocketEnabled: true, dogstatsdCardinality: "low" } };
    const higher = { family: "f", dogstatsd: { isSocketEnabled: false } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.dogstatsd).toEqual({ isEnabled: true, isSocketEnabled: false, dogstatsdCardinality: "low" });
  });

  it("merges the orchestratorExplorer feature config field-by-field", () => {
    const lower = { family: "f", orchestratorExplorer: { isEnabled: true, url: "https://lower.example.com" } };
    const higher = { family: "f", orchestratorExplorer: { isEnabled: false } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.orchestratorExplorer).toEqual({ isEnabled: false, url: "https://lower.example.com" });
  });

  it("merges the logCollection feature config field-by-field", () => {
    const lower = { family: "f", logCollection: { isEnabled: false } };
    const higher = { family: "f", logCollection: { isEnabled: true } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.logCollection).toEqual({ isEnabled: true });
  });

  it("merges the networkMonitoring feature config field-by-field", () => {
    const lower = { family: "f", networkMonitoring: { isEnabled: false } };
    const higher = { family: "f", networkMonitoring: { isEnabled: true } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.networkMonitoring).toEqual({ isEnabled: true });
  });

  it("merges the processCollection feature config field-by-field", () => {
    const lower = { family: "f", processCollection: { isEnabled: false } };
    const higher = { family: "f", processCollection: { isEnabled: true } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.processCollection).toEqual({ isEnabled: true });
  });

  it("merges deploymentConfiguration field-by-field, including a nested alarms merge", () => {
    const lower = {
      family: "f",
      deploymentConfiguration: {
        drainPercent: 25,
        bakeTimeInMinutes: 0,
        alarms: { alarmNames: ["lower-alarm"], enable: false },
      },
    };
    const higher = {
      family: "f",
      deploymentConfiguration: {
        drainPercent: 50,
        alarms: { enable: true },
      },
    };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.deploymentConfiguration).toEqual({
      drainPercent: 50,
      bakeTimeInMinutes: 0,
      alarms: { alarmNames: ["lower-alarm"], enable: true },
    });
  });

  it("uses only the higher-precedence alarms when the lower has no deploymentConfiguration", () => {
    const lower = { family: "f" };
    const higher = { family: "f", deploymentConfiguration: { alarms: { alarmNames: ["a"], enable: true } } };
    const merged = mergeManagedInstancesProps(lower, higher);

    expect(merged.deploymentConfiguration).toEqual({ alarms: { alarmNames: ["a"], enable: true } });
  });
});

describe("validateECSManagedInstancesProps", () => {
  // no-dd-sa:typescript-best-practices/no-explicit-any
  let props: any;

  beforeEach(() => {
    props = {
      family: "test-family",
      createDaemon: true,
      clusterArn: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
      capacityProviderArns: ["arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp"],
      logCollection: { isEnabled: false },
    };
  });

  it("does not throw when all required fields are valid", () => {
    expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
  });

  it("throws when family is undefined", () => {
    delete props.family;
    expect(() => validateECSManagedInstancesProps(props)).toThrow("The `family` property must be defined.");
  });

  it("throws when family is an empty string", () => {
    props.family = "";
    expect(() => validateECSManagedInstancesProps(props)).toThrow("The `family` property must be defined.");
  });

  it("throws when logCollection.isEnabled is true", () => {
    props.logCollection.isEnabled = true;
    expect(() => validateECSManagedInstancesProps(props)).toThrow(/log collection/i);
  });

  describe("volumes", () => {
    it("does not throw for valid volumes", () => {
      props.volumes = [
        { name: "extra-certs", hostPath: "/etc/extra-certs" },
        { name: "scratch", hostPath: "/var/lib/scratch", containerPath: "/scratch", readOnly: false },
      ];
      expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
    });

    it.each(["containerd_sock", "proc", "cgroup", "dd-sockets", "debug"])(
      "throws when a volume reuses the managed volume name %s",
      (name) => {
        props.volumes = [{ name, hostPath: "/some/path" }];
        expect(() => validateECSManagedInstancesProps(props)).toThrow(/used by a volume this construct manages/);
      },
    );

    it("throws when a volume name is used more than once", () => {
      props.volumes = [
        { name: "dup", hostPath: "/a" },
        { name: "dup", hostPath: "/b" },
      ];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/used more than once/);
    });

    it("throws for an invalid volume name", () => {
      props.volumes = [{ name: "bad name!", hostPath: "/a" }];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/Invalid volume name/);
    });

    it("throws when hostPath is not absolute", () => {
      props.volumes = [{ name: "rel", hostPath: "relative/path" }];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/hostPath.*absolute/);
    });

    it("throws when containerPath is not absolute", () => {
      props.volumes = [{ name: "rel", hostPath: "/a", containerPath: "relative" }];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/containerPath.*absolute/);
    });

    it.each(["/host/proc", "/var/run/datadog", "/var/run/containerd/containerd.sock"])(
      "throws when a volume mounts at the managed container path %s",
      (containerPath) => {
        props.volumes = [{ name: "clash", hostPath: "/a", containerPath }];
        expect(() => validateECSManagedInstancesProps(props)).toThrow(/already mounted in the Datadog Agent container/);
      },
    );

    it("throws when a volume's default container path (its hostPath) clashes with a managed path", () => {
      props.volumes = [{ name: "clash", hostPath: "/host/proc" }];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/already mounted/);
    });

    it("throws when two volumes mount at the same container path", () => {
      props.volumes = [
        { name: "one", hostPath: "/a", containerPath: "/same" },
        { name: "two", hostPath: "/b", containerPath: "/same" },
      ];
      expect(() => validateECSManagedInstancesProps(props)).toThrow(/already mounted/);
    });
  });

  it("throws when readOnlyRootFilesystem is true", () => {
    props.readOnlyRootFilesystem = true;
    expect(() => validateECSManagedInstancesProps(props)).toThrow(/readOnlyRootFilesystem.*not supported/);
  });

  it("does not throw when readOnlyRootFilesystem is false", () => {
    props.readOnlyRootFilesystem = false;
    expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
  });

  it("throws when isDatadogDependencyEnabled is true", () => {
    props.isDatadogDependencyEnabled = true;
    expect(() => validateECSManagedInstancesProps(props)).toThrow(/isDatadogDependencyEnabled.*not supported/);
  });

  it("does not throw when isDatadogDependencyEnabled is false", () => {
    props.isDatadogDependencyEnabled = false;
    expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
  });

  it("does not throw when logCollection is undefined", () => {
    delete props.logCollection;
    expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
  });

  it("throws when createDaemon is true and clusterArn is undefined", () => {
    delete props.clusterArn;
    expect(() => validateECSManagedInstancesProps(props)).toThrow(
      "The `clusterArn` property must be provided when `createDaemon` is true.",
    );
  });

  it("throws when createDaemon is true and capacityProviderArns is undefined", () => {
    delete props.capacityProviderArns;
    expect(() => validateECSManagedInstancesProps(props)).toThrow(/capacityProviderArns/);
  });

  it("throws when createDaemon is true and capacityProviderArns is an empty array", () => {
    props.capacityProviderArns = [];
    expect(() => validateECSManagedInstancesProps(props)).toThrow(/capacityProviderArns/);
  });

  it("does not throw when createDaemon is false, even without clusterArn or capacityProviderArns", () => {
    props.createDaemon = false;
    delete props.clusterArn;
    delete props.capacityProviderArns;
    expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
  });

  it("bypasses all validation when DD_CDK_BYPASS_VALIDATION is set", () => {
    delete props.family;
    props.logCollection.isEnabled = true;
    process.env.DD_CDK_BYPASS_VALIDATION = "true";
    try {
      expect(() => validateECSManagedInstancesProps(props)).not.toThrow();
    } finally {
      delete process.env.DD_CDK_BYPASS_VALIDATION;
    }
  });
});
