# Datadog CDK Constructs Java Example

This is an example AWS CDK application in Java that demonstrates how to use the Datadog CDK Constructs library to automatically instrument Lambda functions with Datadog monitoring.

## Prerequisites

- Java 11 or later
- Maven 3.6+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Installation

Add the Datadog CDK Constructs dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>com.datadoghq</groupId>
    <artifactId>datadog-cdk-constructs</artifactId>
    <version>3.3.0</version>
</dependency>
```

## Usage

1. Set your Datadog API key as an environment variable:
   ```bash
   export DD_API_KEY=your-api-key-here
   ```

2. Compile the application:
   ```bash
   mvn compile
   ```

3. Deploy the stack:
   ```bash
   cdk deploy
   ```

## What This Example Does

This example creates:
- A simple Lambda function that returns "Hello World!"
- A Lambda Function URL for easy HTTP access
- Datadog monitoring automatically configured with:
  - Lambda layer instrumentation
  - Datadog tracing enabled
  - Log forwarding to Datadog
  - Metrics collection

## Useful Commands

- `mvn compile` - Compile the Java code
- `cdk synth` - Synthesize the CloudFormation template
- `cdk deploy` - Deploy the stack to AWS
- `cdk diff` - Compare deployed stack with current state
- `cdk destroy` - Remove the stack from AWS

## Learn More

- [Datadog CDK Constructs Documentation](https://github.com/DataDog/datadog-cdk-constructs)
- [AWS CDK Java Documentation](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-java.html)
