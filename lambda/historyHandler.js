const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const tableName = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const AWSXRay = require('aws-xray-sdk-core');
const dynamoDBClient = AWSXRay.captureAWSv3Client(client);

exports.handler = async (event) => {
  const params = {
    TableName: tableName,
  };
  const command = new ScanCommand(params);
  const data = await dynamoDBClient.send(command);
  return {
    statusCode: 200,
    body: JSON.stringify(data.Items)
  };
};
