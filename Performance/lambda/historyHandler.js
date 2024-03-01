const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const tableName = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: "ap-northeast-1" });

exports.handler = async (event) => {
  const customerId = event.queryStringParameters.customerId;
  const params = {
    TableName: tableName,
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": { S: customerId }
    }
  };
  try {
    const command = new QueryCommand(params);
    const data = await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items)
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred" })
    };
  }
};
