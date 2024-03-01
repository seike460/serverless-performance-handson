const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const tableName = process.env.TABLE_NAME;
const client = new DynamoDBClient({ region: "ap-northeast-1" });

exports.handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    // 購入処理により1秒遅延
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒遅延
    const message = JSON.parse(record.body)
    const purchaseData = JSON.parse(message.body);
    const params = {
      TableName: tableName,
      Item: {
        customerId: { S: purchaseData.customerId },
        orderId: { S: purchaseData.orderId },
        orderDate: { S: message.timestamp },
        items: { S: JSON.stringify(purchaseData.items) },
        totalAmount: { N: purchaseData.totalAmount.toString() } 
      }
    };
    try {
      await client.send(new PutItemCommand(params));
      console.log(`Purchase record saved: ${purchaseData.orderId}`);
    } catch (error) {
      console.error(`Error saving purchase record:`, error);
    }
  });

  await Promise.all(promises);

  return { statusCode: 200 };
};