const {
  sendDistributionMetric,
  sendDistributionMetricWithDate,
} = require("datadog-lambda-js");
const tracer = require("dd-trace");

// submit a custom span named "sleep"
const sleep = tracer.wrap("sleep", (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
});

exports.lambda_handler = async (event) => {
  // add custom tags to the lambda function span,
  // does NOT work when X-Ray tracing is enabled
  const span = tracer.scope().active();
  span.setTag("customer_id", "123456");

  await sleep(100);

  // submit a custom span
  const sandwich = tracer.trace("hello.world", () => {
    console.log("Hello, World!");
  });

  // submit a custom metric
  sendDistributionMetric(
    "coffee_house.order_value", // metric name
    12.45, // metric value
    "product:latte", // tag
    "order:online" // another tag
  );

  // submit a custom metric with timestamp
  sendDistributionMetricWithDate(
    "coffee_house.order_value", // metric name
    12.45, // metric value
    new Date(Date.now()), // date, must be within last 20 mins
    "product:latte", // tag
    "order:online" // another tag
  );

  console.log("Logging from hello.js");

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from CDK Node!", another: "field" }),
  };
  return response;
};
