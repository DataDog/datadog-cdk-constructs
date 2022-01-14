export const LAYER_PREFIX = "DatadogLayer";
export const EXTENSION_LAYER_PREFIX = "DatadogExtension";
export const DD_ACCOUNT_ID = "464622532012";
export const DD_GOV_ACCOUNT_ID = "002406178527";
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";

export enum RuntimeType {
  NODE,
  PYTHON,
  UNSUPPORTED,
}

export enum TagKeys {
  Cdk = "dd_cdk_construct",
}

export const runtimeLookup: { [key: string]: RuntimeType } = {
  "nodejs10.x": RuntimeType.NODE,
  "nodejs12.x": RuntimeType.NODE,
  "nodejs14.x": RuntimeType.NODE,
  "python2.7": RuntimeType.PYTHON,
  "python3.6": RuntimeType.PYTHON,
  "python3.7": RuntimeType.PYTHON,
  "python3.8": RuntimeType.PYTHON,
  "python3.9": RuntimeType.PYTHON,
};

export const runtimeToLayerName: { [key: string]: string } = {
  "nodejs10.x": "Datadog-Node10-x",
  "nodejs12.x": "Datadog-Node12-x",
  "nodejs14.x": "Datadog-Node14-x",
  "python2.7": "Datadog-Python27",
  "python3.6": "Datadog-Python36",
  "python3.7": "Datadog-Python37",
  "python3.8": "Datadog-Python38",
  "python3.9": "Datadog-Python39",
};
