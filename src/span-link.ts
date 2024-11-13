/**
 * Builds a payload for a Step Function LambdaInvoke task, so the Step Function traces
 * can be merged with downstream Lambda traces.
 *
 * This function modifies the provided payload to include context fields necessary
 * for trace merging purposes. If the payload already contains any of these fields,
 * an error is thrown to avoid conflicts.
 *
 * @param payload - The user's payload object. Defaults to an empty object.
 * @returns The modified payload object with necessary context added.
 * @throws {ConflictError} If the payload already contains `Execution`, `State`, or `StateMachine` fields.
 */
export function buildStepFunctionLambdaTaskPayloadToMergeTraces(payload: { [key: string]: any } = {}): {
  [key: string]: any;
} {
  if (
    "Execution" in payload ||
    "Execution.$" in payload ||
    "State" in payload ||
    "State.$" in payload ||
    "StateMachine" in payload ||
    "StateMachine.$" in payload
  ) {
    throw new Error(`The LambdaInvoke task may be using custom Execution, State or StateMachine field. \
Step Functions Context Object injection skipped. Your Step Functions trace will not be merged with downstream Lambda traces. \
Please open an issue in https://github.com/DataDog/datadog-cdk-constructs to discuss your workaround.`);
  }

  payload["Execution.$"] = "$$.Execution";
  payload["State.$"] = "$$.State";
  payload["StateMachine.$"] = "$$.StateMachine";
  return payload;
}

/**
 * Builds a payload for a Step Function execution task, so the Step Function traces
 * can be merged with downstream Step Function traces.
 *
 * This function modifies the provided payload to include context fields necessary
 * for trace merging purposes. If the payload already contains CONTEXT or CONTEXT.$ field,
 * an error is thrown to avoid conflicts.
 *
 * @param payload - The user's payload object. Defaults to an empty object.
 * @returns The modified payload object with necessary context added.
 * @throws {ConflictError} If the payload already contains `CONTEXT` or `CONTEXT.$` fields.
 */

export function buildStepFunctionSfnExecutionTaskPayloadToMergeTraces(payload: { [key: string]: any } = {}): {
  [key: string]: any;
} {
  if ("CONTEXT" in payload || "CONTEXT.$" in payload) {
    throw new Error(`The StepFunction StartExecution task may be using custom CONTEXT field. Step Functions Context Object injection skipped. \
Your Step Functions trace will not be merged with downstream Lambda traces. \
Please open an issue in https://github.com/DataDog/datadog-cdk-constructs to discuss your workaround.`);
  }

  payload["CONTEXT.$"] = `$$['Execution', 'State', 'StateMachine']`;
  return payload;
}
