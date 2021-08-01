import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import validator from '@middy/validator';
import createAuctionSchema from '../schemas/createAuctionSchema';
import middleware from '../middlewares/common';
import createError from 'http-errors';
const dynamoDb = new AWS.DynamoDB.DocumentClient();
async function createAuction(event, context) {
  const { title } = event.body;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);
  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
  };
  try {
    await dynamoDb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = middleware(createAuction).use(
  validator({
    inputSchema: createAuctionSchema,
  })
);