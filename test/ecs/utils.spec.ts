import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import {
  validateECSBaseProps,
  isOperatingSystemLinux,
  getSecretApiKey,
  addCdkConstructVersionTag,
} from "../../src/ecs/utils";

describe("utils", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let scope: Construct;
  let task: ecs.TaskDefinition;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");
    scope = new Construct(stack, "TestScope");
    task = new ecs.TaskDefinition(scope, "TestTask", {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: "256",
      memoryMiB: "512",
    });
  });

  describe("validateECSBaseProps", () => {
    it("should not throw an error for valid props", () => {
      const props = {
        site: "datadoghq.com",
        dogstatsd: {},
        apm: {},
        cws: {},
        registry: "public.ecr.aws/datadog/agent",
        imageVersion: "latest",
      };
      expect(() => validateECSBaseProps(props)).not.toThrow();
    });

    it("should throw an error if site is invalid", () => {
      const props = {
        site: "invalid-site",
        dogstatsd: {},
        apm: {},
        cws: {},
        registry: "public.ecr.aws/datadog/agent",
        imageVersion: "latest",
      };
      expect(() => validateECSBaseProps(props)).toThrow();
    });

    it("should throw an error if a feature (dogstatsd) is undefined", () => {
      const props = {
        site: "datadoghq.com",
        apm: {},
        cws: {},
        registry: "public.ecr.aws/datadog/agent",
        imageVersion: "latest",
      };
      expect(() => validateECSBaseProps(props)).toThrow();
    });

    it("should throw an error if registry is undefined", () => {
      const props = {
        site: "datadoghq.com",
        dogstatsd: {},
        apm: {},
        cws: {},
        imageVersion: "latest",
      };
      expect(() => validateECSBaseProps(props)).toThrow();
    });

    it("should throw an error if imageVersion is undefined", () => {
      const props = {
        site: "datadoghq.com",
        dogstatsd: {},
        apm: {},
        cws: {},
        registry: "public.ecr.aws/datadog/agent",
      };
      expect(() => validateECSBaseProps(props)).toThrow();
    });

    it("should throw an error if datadog dependency is enabled but health check is not defined", () => {
      const props = {
        site: "datadoghq.com",
        dogstatsd: {},
        apm: {},
        cws: {},
        registry: "public.ecr.aws/datadog/agent",
        imageVersion: "latest",
        isDatadogDependencyEnabled: true,
      };
      expect(() => validateECSBaseProps(props)).toThrow();
    });
  });

  describe("isOperatingSystemLinux", () => {
    it("should return true if runtimePlatform is undefined", () => {
      const props = {};
      expect(isOperatingSystemLinux(props)).toBe(true);
    });

    it("should return true if operatingSystemFamily is undefined", () => {
      const props = { runtimePlatform: {} };
      expect(isOperatingSystemLinux(props)).toBe(true);
    });

    it("should return true if operatingSystemFamily is Linux", () => {
      const props = {
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      };
      expect(isOperatingSystemLinux(props)).toBe(true);
    });

    it("should return false if operatingSystemFamily is not Linux", () => {
      const props = {
        runtimePlatform: {
          operatingSystemFamily: ecs.OperatingSystemFamily.WINDOWS_SERVER_2019_CORE,
        },
      };
      expect(isOperatingSystemLinux(props)).toBe(false);
    });
  });

  describe("getSecretApiKey", () => {
    it("should return a secret from SecretsManager if apiKeySecret is provided", () => {
      const secret = secretsmanager.Secret.fromSecretNameV2(scope, "TestSecret", "test-secret");
      const props = { apiKeySecret: secret };
      const result = getSecretApiKey(scope, props);
      expect(result).toBeDefined();
    });

    it("should return a secret from ARN if apiKeySecretArn is provided", () => {
      const props = { apiKeySecretArn: "arn:aws:secretsmanager:region:account-id:secret:test-secret" };
      const result = getSecretApiKey(scope, props);
      expect(result).toBeDefined();
    });

    it("should return undefined if no secret is provided", () => {
      const props = {};
      const result = getSecretApiKey(scope, props);
      expect(result).toBeUndefined();
    });
  });

  describe("addCdkConstructVersionTag", () => {
    it("should add a CDK construct version tag to the task", () => {
      addCdkConstructVersionTag(task);
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties("AWS::ECS::TaskDefinition", {
        Tags: [
          {
            Key: "dd_cdk_construct",
            Value: `v${require("../../version.json").version}`,
          },
        ],
      });
    });
  });
});
