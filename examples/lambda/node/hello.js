exports.lambda_handler = async (event) => {
  console.log("Logging from hello.js");

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from CDK Node!", another: "field" }),
  };
  return response;
};
