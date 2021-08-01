import AWS from 'aws-sdk';
import middleware from '../middlewares/common';
import validator from '@middy/validator';
import getAuctionsSchema from '../schemas/getAuctionsSchema';
import createError from 'http-errors';
const dynamoDb = new AWS.DynamoDB.DocumentClient();
async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;
  let auctions;
  try {
    const result = await dynamoDb
      .query({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
          ':status': status,
        },
        ExpressionAttributeNames: {
          '#status': 'status',
        },
      })
      .promise();
    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = middleware(getAuctions).use(
  validator({
    inputSchema: getAuctionsSchema,
    ajvOptions: { useDefaults: true, strict: false },
  })
);
