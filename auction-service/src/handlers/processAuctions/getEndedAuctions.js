import AWS from 'aws-sdk';
const dynamoDb = new AWS.DynamoDB.DocumentClient();
export default async function getEndedAuctions(event, context) {
  const now = new Date();
  const result = await dynamoDb
    .query({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status AND endingAt <= :now',
      ExpressionAttributeValues: {
        ':status': 'OPEN',
        ':now': now.toISOString(),
      },
      ExpressionAttributeNames: {
        '#status': 'status',
      },
    })
    .promise();
  return result.Items;
}
