import { LoggingType } from "../../../src/ecs/fargate/interfaces";
import { validateECSFargateProps } from "../../../src/ecs/fargate/utils";

describe("validateECSFargateProps", () => {
  let props: any;

  beforeEach(() => {
    props = {
      logCollection: {
        isEnabled: true,
        loggingType: LoggingType.FLUENTBIT,
        fluentbitConfig: {
          logDriverConfig: {
            registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
            imageVersion: "stable",
          },
        },
      },
      cws: {
        isEnabled: false,
      },
      isLinux: true,
    };
  });

  it("should not throw an error when all required fields are valid", () => {
    expect(() => validateECSFargateProps(props)).not.toThrow();
  });

  it("should throw an error if logCollection is undefined", () => {
    delete props.logCollection;
    expect(() => validateECSFargateProps(props)).toThrow();
  });

  it("should throw an error if loggingType is undefined when logging is enabled", () => {
    delete props.logCollection.loggingType;
    expect(() => validateECSFargateProps(props)).toThrow();
  });

  it("should throw an error if logDriverConfig is undefined when logging is enabled", () => {
    delete props.logCollection.fluentbitConfig.logDriverConfig;
    expect(() => validateECSFargateProps(props)).toThrow();
  });

  it("should throw an error if Fluent Bit logging is enabled but the operating system is not Linux", () => {
    props.isLinux = false;
    expect(() => validateECSFargateProps(props)).toThrow();
  });

  it("should not throw an error if logging is disabled", () => {
    props.logCollection.isEnabled = false;
    delete props.logCollection.loggingType;
    delete props.logCollection.fluentbitConfig.logDriverConfig;
    expect(() => validateECSFargateProps(props)).not.toThrow();
  });
});
