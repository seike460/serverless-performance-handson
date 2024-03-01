const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const tableName = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const AWSXRay = require('aws-xray-sdk-core');
const dynamoDBClient = AWSXRay.captureAWSv3Client(client);

exports.handler = async (event) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒遅延
  const purchaseData = JSON.parse(event.body);
  const params = {
    TableName: tableName,
    Item: {
      customerId: { S: purchaseData.customerId },
      orderId: { S: purchaseData.orderId },
      orderDate: { S: new Date().toISOString() },
      items: { S: JSON.stringify(purchaseData.items) },
      totalAmount: { N: purchaseData.totalAmount.toString() }
    }
  };
  try {
    await dynamoDBClient.send(new PutItemCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Purchase completed and recorded' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred" }),
    };
  }
};