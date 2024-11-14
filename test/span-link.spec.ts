import { buildStepFunctionLambdaTaskPayloadToMergeTraces } from "../src/span-link";

describe("buildStepFunctionLambdaTaskPayloadToMergeTraces", () => {
  it("adds necessary fields to an empty payload", () => {
    const result = buildStepFunctionLambdaTaskPayloadToMergeTraces();
    expect(result).toEqual({
      "Execution.$": "$$.Execution",
      "State.$": "$$.State",
      "StateMachine.$": "$$.StateMachine",
    });
  });

  it("adds necessary fields to a non-empty payload", () => {
    const payload = { "custom-key": "custom-value" };
    const result = buildStepFunctionLambdaTaskPayloadToMergeTraces(payload);
    expect(result).toEqual({
      "custom-key": "custom-value",
      "Execution.$": "$$.Execution",
      "State.$": "$$.State",
      "StateMachine.$": "$$.StateMachine",
    });
  });

  it("throws an error if payload already contains Execution field", () => {
    const payload = { Execution: "value" };
    expect(() => buildStepFunctionLambdaTaskPayloadToMergeTraces(payload)).toThrowError(
      "The LambdaInvoke task may be using custom Execution, State or StateMachine field. Step Functions Context Object injection skipped. Your Step Functions trace will not be merged with downstream Lambda traces. Please open an issue in https://github.com/DataDog/datadog-cdk-constructs to discuss your workaround.",
    );
  });
});
