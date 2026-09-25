import * as cdk from "aws-cdk-lib";
import { Annotations, Match, Template } from "aws-cdk-lib/assertions";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ecsDatadog from "../../../src/ecs";
import { EnvFragment, hasEnvFragment, mergeEnvFragment } from "../../../src/ecs/fargate/apm-instrumentation";
import { TracerLanguage, TracerLibc } from "../../../src/ecs/fargate/interfaces";

interface SynthesizedContainer {
  readonly Name: string;
  readonly Image: unknown;
  readonly Essential?: boolean;
  readonly User?: string;
  readonly EntryPoint?: string[];
  readonly Command?: string[];
  readonly Environment?: { Name: string; Value: unknown }[];
  readonly MountPoints?: { ContainerPath: string; SourceVolume: string; ReadOnly: boolean }[];
  readonly DependsOn?: { ContainerName: string; Condition: string }[];
  readonly LogConfiguration?: { LogDriver: string; Options?: Record<string, unknown> };
}

const TracerMount = { ContainerPath: "/datadog-lib", SourceVolume: "datadog-tracer", ReadOnly: false };
const TracerDependency = { ContainerName: "datadog-tracer", Condition: "SUCCESS" };
const InjectionModeTag = "_dd.injection.mode:serverless-single-lang";
const NodeRequire = "--require /datadog-lib/node_modules/dd-trace/init.js";
const TracerLogsWarning = Match.stringLikeRegexp("datadog-tracer container has no log configuration");
const InjectionModeTagWarning = Match.stringLikeRegexp("DD_TAGS on container app changed after `addContainer`");

function environmentOf(container: SynthesizedContainer | undefined): Record<string, unknown> {
  return Object.fromEntries((container?.Environment ?? []).map(({ Name, Value }) => [Name, Value]));
}

describe("DatadogECSFargateTaskDefinition automatic APM instrumentation", () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack(new cdk.App(), "TestStack");
  });

  function createTask(
    datadogProps: ecsDatadog.DatadogECSFargateProps = {},
    taskProps: ecs.FargateTaskDefinitionProps = {},
  ): ecsDatadog.DatadogECSFargateTaskDefinition {
    return new ecsDatadog.DatadogECSFargateTaskDefinition(
      stack,
      "TestTaskDefinition",
      { family: "test-family", cpu: 256, memoryLimitMiB: 512, ...taskProps },
      { apiKey: "test-api-key", apmInstrumentation: { language: TracerLanguage.NODEJS }, ...datadogProps },
    );
  }

  function addApp(
    task: ecsDatadog.DatadogECSFargateTaskDefinition,
    id = "app",
    props: Partial<ecs.ContainerDefinitionOptions> = {},
  ): ecs.ContainerDefinition {
    return task.addContainer(id, { image: ecs.ContainerImage.fromRegistry("my-app"), ...props });
  }

  function synthesizeTask() {
    const [taskDefinition] = Object.values(Template.fromStack(stack).findResources("AWS::ECS::TaskDefinition"));
    const properties = taskDefinition.Properties;
    const containers = new Map<string, SynthesizedContainer>(
      properties.ContainerDefinitions.map((container: SynthesizedContainer) => [container.Name, container]),
    );
    return { containers, volumes: properties.Volumes ?? [], tags: properties.Tags ?? [] };
  }

  describe("tracer container", () => {
    it("copies the tracer into a shared volume before the application container starts", () => {
      const task = createTask();
      addApp(task);
      const { containers, volumes, tags } = synthesizeTask();

      expect(task.tracerContainer).toBeDefined();
      expect(containers.get("datadog-tracer")).toMatchObject({
        Image: "public.ecr.aws/datadog/dd-lib-js-init:latest",
        Essential: false,
        User: "0",
        EntryPoint: ["/datadog-init/copy-lib.sh"],
        Command: ["/datadog-lib"],
        MountPoints: [TracerMount],
      });
      expect(containers.get("app")).toMatchObject({
        MountPoints: expect.arrayContaining([TracerMount]),
        DependsOn: expect.arrayContaining([TracerDependency]),
      });
      expect(volumes).toContainEqual({ Name: "datadog-tracer" });
      expect(tags).toContainEqual({ Key: "dd_sls_injection_mode", Value: "single_language" });
    });

    it("leaves the Datadog Agent container unchanged", () => {
      addApp(createTask());
      const agent = synthesizeTask().containers.get("datadog-agent");

      expect(environmentOf(agent)).not.toHaveProperty("NODE_OPTIONS");
      expect(agent?.MountPoints ?? []).not.toContainEqual(TracerMount);
      expect(agent?.DependsOn).toBeUndefined();
    });

    it("adds nothing when automatic APM instrumentation is not configured", () => {
      const task = createTask({ apmInstrumentation: undefined });
      addApp(task);
      const { containers, volumes, tags } = synthesizeTask();

      expect(task.tracerContainer).toBeUndefined();
      expect(containers.has("datadog-tracer")).toBe(false);
      expect(environmentOf(containers.get("app"))).not.toHaveProperty("NODE_OPTIONS");
      expect(volumes).not.toContainEqual({ Name: "datadog-tracer" });
      expect(tags).not.toContainEqual(expect.objectContaining({ Key: "dd_sls_injection_mode" }));
    });

    it("sends the tracer container's logs through the log router when log collection is enabled", () => {
      addApp(createTask({ logCollection: { isEnabled: true } }));

      expect(synthesizeTask().containers.get("datadog-tracer")?.LogConfiguration).toMatchObject({
        LogDriver: "awsfirelens",
        Options: expect.objectContaining({ dd_service: "datadog-tracer" }),
      });
      Annotations.fromStack(stack).hasNoWarning("*", TracerLogsWarning);
    });

    it("warns that the tracer container's logs aren't collected when log collection is disabled", () => {
      addApp(createTask());

      expect(synthesizeTask().containers.get("datadog-tracer")?.LogConfiguration).toBeUndefined();
      Annotations.fromStack(stack).hasWarning("*", TracerLogsWarning);
    });
  });

  describe("language configuration", () => {
    it.each([
      [
        TracerLanguage.JAVA,
        TracerLibc.GLIBC,
        "dd-lib-java-init",
        { JAVA_TOOL_OPTIONS: "-javaagent:/datadog-lib/dd-java-agent.jar -XX:+IgnoreUnrecognizedVMOptions" },
      ],
      [TracerLanguage.NODEJS, TracerLibc.GLIBC, "dd-lib-js-init", { NODE_OPTIONS: NodeRequire }],
      [
        TracerLanguage.DOTNET,
        TracerLibc.GLIBC,
        "dd-lib-dotnet-init",
        {
          CORECLR_ENABLE_PROFILING: "1",
          CORECLR_PROFILER: "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}",
          CORECLR_PROFILER_PATH: "/datadog-lib/Datadog.Trace.ClrProfiler.Native.so",
          DD_DOTNET_TRACER_HOME: "/datadog-lib",
          LD_PRELOAD: "/datadog-lib/continuousprofiler/Datadog.Linux.ApiWrapper.x64.so",
        },
      ],
      [TracerLanguage.PYTHON, TracerLibc.GLIBC, "dd-lib-python-init", { PYTHONPATH: "/datadog-lib" }],
      [TracerLanguage.RUBY, TracerLibc.GLIBC, "dd-lib-ruby-init", { RUBYOPT: "-r/datadog-lib/auto_inject" }],
      [
        TracerLanguage.PHP,
        TracerLibc.GLIBC,
        "dd-lib-php-init",
        { PHP_INI_SCAN_DIR: ":/datadog-lib/linux-gnu/loader", DD_LOADER_PACKAGE_PATH: "/datadog-lib" },
      ],
      [
        TracerLanguage.PHP,
        TracerLibc.MUSL,
        "dd-lib-php-init",
        { PHP_INI_SCAN_DIR: ":/datadog-lib/linux-musl/loader", DD_LOADER_PACKAGE_PATH: "/datadog-lib" },
      ],
    ])("loads the %s tracer on %s", (language, tracerLibc, imageName, expectedEnvironment) => {
      addApp(createTask({ apmInstrumentation: { language, tracerLibc } }));
      const { containers } = synthesizeTask();

      expect(containers.get("datadog-tracer")?.Image).toBe(`public.ecr.aws/datadog/${imageName}:latest`);
      expect(environmentOf(containers.get("app"))).toMatchObject({
        ...expectedEnvironment,
        DD_TAGS: InjectionModeTag,
      });
    });

    it("uses the configured tracer version", () => {
      addApp(createTask({ apmInstrumentation: { language: TracerLanguage.PYTHON, tracerVersion: "v3.1.0" } }));

      expect(synthesizeTask().containers.get("datadog-tracer")?.Image).toBe(
        "public.ecr.aws/datadog/dd-lib-python-init:v3.1.0",
      );
    });

    it("adds to the values the application container already sets", () => {
      addApp(createTask(), "app", {
        environment: { NODE_OPTIONS: "--max-old-space-size=4096", DD_TAGS: "team:apm", LOG_LEVEL: "debug" },
      });

      expect(environmentOf(synthesizeTask().containers.get("app"))).toMatchObject({
        NODE_OPTIONS: `--max-old-space-size=4096 ${NodeRequire}`,
        DD_TAGS: `${InjectionModeTag},team:apm`,
        LOG_LEVEL: "debug",
      });
    });

    it("adds to a value that is only known at deployment", () => {
      const nodeOptions = new cdk.CfnParameter(stack, "NodeOptions").valueAsString;
      addApp(createTask(), "app", { environment: { NODE_OPTIONS: nodeOptions } });

      expect(environmentOf(synthesizeTask().containers.get("app")).NODE_OPTIONS).toEqual({
        "Fn::Join": ["", [{ Ref: "NodeOptions" }, ` ${NodeRequire}`]],
      });
    });

    it.each(["NODE_OPTIONS", "DD_TAGS"])("rejects %s from a secret", (name) => {
      const secret = ecs.Secret.fromSecretsManager(secretsmanager.Secret.fromSecretNameV2(stack, "Secret", "value"));

      expect(() => addApp(createTask(), "app", { secrets: { [name]: secret } })).toThrow(
        `Cannot add the tracer to container app because ${name} comes from a secret.`,
      );
    });

    it("rejects a .NET profiler variable set to another value", () => {
      const task = createTask({ apmInstrumentation: { language: TracerLanguage.DOTNET } });

      expect(() =>
        addApp(task, "app", { environment: { CORECLR_PROFILER: "{00000000-0000-0000-0000-000000000000}" } }),
      ).toThrow(/CORECLR_PROFILER is set to "\{00000000-0000-0000-0000-000000000000\}"/);
    });

    it("rejects an LD_PRELOAD that would exceed 1024 bytes", () => {
      const task = createTask({ apmInstrumentation: { language: TracerLanguage.DOTNET } });

      expect(() => addApp(task, "app", { environment: { LD_PRELOAD: `/lib/${"a".repeat(1000)}.so` } })).toThrow(
        /LD_PRELOAD would exceed 1024 bytes/,
      );
    });
  });

  describe("application container selection", () => {
    it.each(["worker", " worker "])("loads the tracer only into the container named %p", (containerName) => {
      const task = createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName } });
      addApp(task, "app");
      addApp(task, "worker");
      const { containers } = synthesizeTask();

      expect(environmentOf(containers.get("worker"))).toHaveProperty("NODE_OPTIONS", NodeRequire);
      expect(containers.get("worker")?.DependsOn).toContainEqual(TracerDependency);
      expect(environmentOf(containers.get("app"))).not.toHaveProperty("NODE_OPTIONS");
      expect(containers.get("app")?.MountPoints ?? []).not.toContainEqual(TracerMount);
      expect(containers.get("app")?.DependsOn ?? []).not.toContainEqual(TracerDependency);
    });

    it("matches the container name rather than the construct ID", () => {
      const task = createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName: "web" } });
      addApp(task, "App", { containerName: "web" });
      addApp(task, "Sidecar");

      expect(environmentOf(synthesizeTask().containers.get("web"))).toHaveProperty("NODE_OPTIONS", NodeRequire);
    });

    it("treats a blank container name as omitted", () => {
      addApp(createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName: "  " } }));

      expect(environmentOf(synthesizeTask().containers.get("app"))).toHaveProperty("NODE_OPTIONS", NodeRequire);
    });

    it("rejects a second application container when no container name is set", () => {
      const task = createTask();
      addApp(task, "app");

      expect(() => addApp(task, "worker")).toThrow(/several: app, worker\. Set `apmInstrumentation.containerName`/);
    });

    it("rejects two containers that share the selected name", () => {
      const task = createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName: "web" } });
      addApp(task, "First", { containerName: "web" });

      expect(() => addApp(task, "Second", { containerName: "web" })).toThrow(/More than one container is named web/);
    });

    it("reports a selected container that was never added", () => {
      addApp(createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName: "worker" } }));

      expect(() => synthesizeTask()).toThrow(
        /Container worker was not found\. Set `apmInstrumentation.containerName` to one of: app\./,
      );
    });

    it("reports a task definition without an application container", () => {
      createTask();

      expect(() => synthesizeTask()).toThrow(/requires an application container\. Add one with `addContainer`/);
    });

    it.each(["datadog-agent", "datadog-log-router", "datadog-tracer"])(
      "rejects the Datadog-managed %s container",
      (containerName) => {
        expect(() => createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, containerName } })).toThrow(
          /which the construct manages/,
        );
      },
    );
  });

  describe("tracer settings changed after addContainer", () => {
    it("reports a tracer variable replaced with addEnvironment", () => {
      addApp(createTask()).addEnvironment("NODE_OPTIONS", "--inspect");

      expect(() => synthesizeTask()).toThrow(/NODE_OPTIONS on container app changed after `addContainer`/);
    });

    it("reports a tracer variable added as a secret", () => {
      const secret = secretsmanager.Secret.fromSecretNameV2(stack, "Secret", "node-options");
      addApp(createTask()).addSecret("NODE_OPTIONS", ecs.Secret.fromSecretsManager(secret));

      expect(() => synthesizeTask()).toThrow(/NODE_OPTIONS on container app comes from a secret/);
    });

    it("accepts other variables added with addEnvironment", () => {
      addApp(createTask()).addEnvironment("LOG_LEVEL", "debug");

      expect(() => synthesizeTask()).not.toThrow();
      Annotations.fromStack(stack).hasNoWarning("*", InjectionModeTagWarning);
    });

    it("warns when DD_TAGS replaced with addEnvironment drops the injection mode tag", () => {
      addApp(createTask()).addEnvironment("DD_TAGS", "team:apm");

      expect(() => synthesizeTask()).not.toThrow();
      Annotations.fromStack(stack).hasWarning("*", InjectionModeTagWarning);
    });

    it("reports a second volume mounted at the tracer path", () => {
      const task = createTask();
      task.addVolume({ name: "shared" });
      addApp(task).addMountPoints({ sourceVolume: "shared", containerPath: "/datadog-lib", readOnly: true });

      expect(() => synthesizeTask()).toThrow(/mounts more than one volume at \/datadog-lib/);
    });
  });

  describe("configuration validation", () => {
    it("rejects Windows tasks", () => {
      expect(() =>
        createTask(
          {},
          {
            cpu: 1024,
            memoryLimitMiB: 2048,
            runtimePlatform: {
              operatingSystemFamily: ecs.OperatingSystemFamily.WINDOWS_SERVER_2019_CORE,
              cpuArchitecture: ecs.CpuArchitecture.X86_64,
            },
          },
        ),
      ).toThrow(/only supported on Linux/);
    });

    it("rejects a task without APM", () => {
      expect(() => createTask({ apm: { isEnabled: false } })).toThrow(/requires `apm.isEnabled` to be true/);
    });

    it("rejects Ruby with musl", () => {
      expect(() =>
        createTask({ apmInstrumentation: { language: TracerLanguage.RUBY, tracerLibc: TracerLibc.MUSL } }),
      ).toThrow(/Ruby does not support musl/);
    });

    it.each(["2", "2.51.0", "v2.51.0"])("rejects .NET tracer version %s", (tracerVersion) => {
      expect(() => createTask({ apmInstrumentation: { language: TracerLanguage.DOTNET, tracerVersion } })).toThrow(
        /requires tracer version 3\.0 or later/,
      );
    });

    it.each(["3", "v3.1.0", "latest"])("accepts .NET tracer version %s", (tracerVersion) => {
      expect(() =>
        createTask({ apmInstrumentation: { language: TracerLanguage.DOTNET, tracerVersion } }),
      ).not.toThrow();
    });

    it("rejects .NET on ARM64", () => {
      expect(() =>
        createTask(
          { apmInstrumentation: { language: TracerLanguage.DOTNET } },
          { runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.ARM64 } },
        ),
      ).toThrow(/\.NET is not supported on ARM64/);
    });

    it("accepts Node.js on ARM64", () => {
      expect(() => createTask({}, { runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.ARM64 } })).not.toThrow();
    });

    it.each(["not a tag", ".hidden", "a".repeat(129)])("rejects tracer version %p", (tracerVersion) => {
      expect(() => createTask({ apmInstrumentation: { language: TracerLanguage.NODEJS, tracerVersion } })).toThrow(
        /is not a valid image tag/,
      );
    });

    it("accepts a tracer version that is only known at deployment", () => {
      const tracerVersion = new cdk.CfnParameter(stack, "TracerVersion").valueAsString;
      addApp(createTask({ apmInstrumentation: { language: TracerLanguage.DOTNET, tracerVersion } }));

      expect(synthesizeTask().containers.get("datadog-tracer")?.Image).toEqual({
        "Fn::Join": ["", ["public.ecr.aws/datadog/dd-lib-dotnet-init:", { Ref: "TracerVersion" }]],
      });
    });

    it("rejects an unsupported language", () => {
      expect(() => createTask({ apmInstrumentation: { language: "go" as unknown as TracerLanguage } })).toThrow(
        "The `apmInstrumentation.language` property must be one of: java, nodejs, dotnet, python, ruby, php.",
      );
    });
  });

  describe("other features", () => {
    it("starts the application container after the Agent, CWS, and tracer containers", () => {
      const task = createTask({ cws: { isEnabled: true }, isDatadogDependencyEnabled: true });
      addApp(task, "app", { entryPoint: ["/app/start"] });

      expect(synthesizeTask().containers.get("app")?.DependsOn).toEqual(
        expect.arrayContaining([
          { ContainerName: "datadog-agent", Condition: "HEALTHY" },
          { ContainerName: "cws-instrumentation-init", Condition: "SUCCESS" },
          TracerDependency,
        ]),
      );
    });

    it("replaces the shared configuration with the task definition's own", () => {
      const datadog = new ecsDatadog.DatadogECSFargate({
        apiKey: "test-api-key",
        apmInstrumentation: { language: TracerLanguage.PHP, tracerLibc: TracerLibc.MUSL, containerName: "web" },
      });
      const task = datadog.fargateTaskDefinition(stack, "TestTaskDefinition", undefined, {
        apmInstrumentation: { language: TracerLanguage.RUBY },
      });
      addApp(task);
      const { containers } = synthesizeTask();

      expect(containers.get("datadog-tracer")?.Image).toBe("public.ecr.aws/datadog/dd-lib-ruby-init:latest");
      expect(environmentOf(containers.get("app"))).toMatchObject({ RUBYOPT: "-r/datadog-lib/auto_inject" });
    });
  });
});

describe("environment fragments", () => {
  const nodeOptions: EnvFragment = { name: "NODE_OPTIONS", value: NodeRequire, mode: "append", separator: " " };
  const rubyOpt: EnvFragment = {
    name: "RUBYOPT",
    value: "-r/datadog-lib/auto_inject",
    mode: "prepend",
    separator: " ",
  };
  const phpIniScanDir: EnvFragment = {
    name: "PHP_INI_SCAN_DIR",
    value: "/datadog-lib/linux-gnu/loader",
    mode: "append",
    separator: ":",
    preserveLeadingEmpty: true,
  };
  const profiler: EnvFragment = {
    name: "CORECLR_PROFILER",
    value: "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}",
    mode: "set-if-absent",
  };

  it.each([
    [undefined, NodeRequire],
    ["", NodeRequire],
    [NodeRequire, NodeRequire],
    ["--inspect", `--inspect ${NodeRequire}`],
    [`${NodeRequire} --inspect`, `--inspect ${NodeRequire}`],
    [`--inspect ${NodeRequire} ${NodeRequire} --trace-warnings`, `--inspect --trace-warnings ${NodeRequire}`],
    [`${NodeRequire}x`, `${NodeRequire}x ${NodeRequire}`],
  ])("appends one copy of the fragment to %p", (current, expected) => {
    expect(mergeEnvFragment("app", current, nodeOptions)).toBe(expected);
  });

  it.each([
    [undefined, "-r/datadog-lib/auto_inject"],
    ["-W0", "-r/datadog-lib/auto_inject -W0"],
    ["-r/datadog-lib/auto_inject -W0", "-r/datadog-lib/auto_inject -W0"],
    ["-W0 -r/datadog-lib/auto_inject", "-r/datadog-lib/auto_inject -W0"],
  ])("prepends one copy of the fragment to %p", (current, expected) => {
    expect(mergeEnvFragment("app", current, rubyOpt)).toBe(expected);
  });

  it.each([
    [undefined, ":/datadog-lib/linux-gnu/loader"],
    [":/datadog-lib/linux-gnu/loader", ":/datadog-lib/linux-gnu/loader"],
    ["/etc/php/conf.d", "/etc/php/conf.d:/datadog-lib/linux-gnu/loader"],
  ])("keeps the default PHP scan directory when merging into %p", (current, expected) => {
    expect(mergeEnvFragment("app", current, phpIniScanDir)).toBe(expected);
  });

  it.each([undefined, "", "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}"])(
    "sets a variable that is absent, empty, or already equal: %p",
    (current) => {
      expect(mergeEnvFragment("app", current, profiler)).toBe(profiler.value);
    },
  );

  it("rejects a variable set to another value", () => {
    expect(() => mergeEnvFragment("app", "{00000000-0000-0000-0000-000000000000}", profiler)).toThrow(
      'Cannot add the tracer to container app because CORECLR_PROFILER is set to "{00000000-0000-0000-0000-000000000000}" instead of "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}".',
    );
  });

  it("appends to a value that is only known at deployment", () => {
    const current = cdk.Lazy.string({ produce: () => "--inspect" });

    expect(mergeEnvFragment("app", current, nodeOptions)).toBe(`${current} ${NodeRequire}`);
  });

  it("rejects a set-if-absent value that is only known at deployment", () => {
    expect(() => mergeEnvFragment("app", cdk.Lazy.string({ produce: () => "x" }), profiler)).toThrow(
      /CORECLR_PROFILER is only known at deployment/,
    );
  });

  it.each([
    [`--inspect ${NodeRequire}`, true],
    [`${NodeRequire}x`, false],
    [undefined, false],
  ])("finds the exact fragment in %p: %p", (value, expected) => {
    expect(hasEnvFragment(value, nodeOptions)).toBe(expected);
  });
});
