using System;
using System.Collections.Generic;
using System.Net;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(
typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace HelloWorld
{
    public class Handler
    {

        public APIGatewayProxyResponse SayHi(APIGatewayProxyRequest request, ILambdaContext context)
        {
            APIGatewayProxyResponse response;
            Dictionary<string, string> dict = new Dictionary<string, string>();
            dict.Add("hello", "world");
            response = CreateResponse(dict);
            return response;
        }

        APIGatewayProxyResponse CreateResponse(IDictionary<string, string> result)
        {
            int statusCode = (result != null) ?
                (int)HttpStatusCode.OK :
                (int)HttpStatusCode.InternalServerError;

            string body = (result != null) ?
                JsonConvert.SerializeObject(result) : string.Empty;

            var response = new APIGatewayProxyResponse
            {
                StatusCode = statusCode,
                Body = body,
                Headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" },
                    { "Access-Control-Allow-Origin", "*" }
                }
            };

            return response;
        }
    }
}
