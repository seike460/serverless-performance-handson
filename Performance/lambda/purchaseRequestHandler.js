const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const queueUrl = process.env.QUEUE_URL;
const client = new SQSClient({ region: "ap-northeast-1" });

exports.handler = async (event) => {
  try {
    const message = { body: event.body, timestamp: new Date().toISOString() };
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message)
    });
    await client.send(command);
    return {
      statusCode: 202,
      body: JSON.stringify({ message: 'Purchase request received' })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing your request' })
    };
  }
};