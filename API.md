# API Reference

**Classes**

Name|Description
----|-----------
[Datadog](#datadog-cdk-constructs-datadog)|*No description*
[Transport](#datadog-cdk-constructs-transport)|*No description*


**Interfaces**

Name|Description
----|-----------
[IDatadogProps](#datadog-cdk-constructs-idatadogprops)|*No description*


**Enums**

Name|Description
----|-----------
[RuntimeType](#datadog-cdk-constructs-runtimetype)|*No description*



## class Datadog  <a id="datadog-cdk-constructs-datadog"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Datadog(scope: Construct, id: string, props: IDatadogProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[IDatadogProps](#datadog-cdk-constructs-idatadogprops)</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**props** | <code>[IDatadogProps](#datadog-cdk-constructs-idatadogprops)</code> | <span></span>
**scope** | <code>[Construct](#aws-cdk-core-construct)</code> | <span></span>
**transport** | <code>[Transport](#datadog-cdk-constructs-transport)</code> | <span></span>

### Methods


#### addLambdaFunctions(lambdaFunctions) <a id="datadog-cdk-constructs-datadog-addlambdafunctions"></a>



```ts
addLambdaFunctions(lambdaFunctions: Array<Function>): void
```

* **lambdaFunctions** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  *No description*






## class Transport  <a id="datadog-cdk-constructs-transport"></a>




### Initializer




```ts
new Transport(flushMetricsToLogs?: boolean, site?: string, apiKey?: string, apiKMSKey?: string)
```

* **flushMetricsToLogs** (<code>boolean</code>)  *No description*
* **site** (<code>string</code>)  *No description*
* **apiKey** (<code>string</code>)  *No description*
* **apiKMSKey** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**flushMetricsToLogs** | <code>boolean</code> | <span></span>
**site** | <code>string</code> | <span></span>
**apiKMSKey**? | <code>string</code> | __*Optional*__
**apiKey**? | <code>string</code> | __*Optional*__

### Methods


#### applyEnvVars(lambdas) <a id="datadog-cdk-constructs-transport-applyenvvars"></a>



```ts
applyEnvVars(lambdas: Array<Function>): void
```

* **lambdas** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  *No description*






## interface IDatadogProps  <a id="datadog-cdk-constructs-idatadogprops"></a>




### Properties


Name | Type | Description 
-----|------|-------------
**addLayers**? | <code>boolean</code> | __*Optional*__
**apiKMSKey**? | <code>string</code> | __*Optional*__
**apiKey**? | <code>string</code> | __*Optional*__
**enableDDTracing**? | <code>boolean</code> | __*Optional*__
**flushMetricsToLogs**? | <code>boolean</code> | __*Optional*__
**forwarderARN**? | <code>string</code> | __*Optional*__
**injectLogContext**? | <code>boolean</code> | __*Optional*__
**nodeLayerVersion**? | <code>number</code> | __*Optional*__
**pythonLayerVersion**? | <code>number</code> | __*Optional*__
**site**? | <code>string</code> | __*Optional*__



## enum RuntimeType  <a id="datadog-cdk-constructs-runtimetype"></a>



Name | Description
-----|-----
**NODE** |
**PYTHON** |
**UNSUPPORTED** |


