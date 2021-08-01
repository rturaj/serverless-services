import AWS from 'aws-sdk';
import middleware from '../middlewares/common';
import validator from '@middy/validator';
import placeBidSchema from '../schemas/placeBidSchema';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';
const dynamoDb = new AWS.DynamoDB.DocumentClient();
async function placeBid(event, context) {
  let updatedAuction;
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller === email) {
    throw new createError.Forbidden('You cannot bid your own auction');
  }

  if (auction.highestBid.bidder === email) {
    throw new createError.Forbidden('You cannot double big the same auction');
  }

  if (auction.status !== 'OPEN') {
    throw new createError.Forbidden('You cannot bid on closed auctions');
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }
  try {
    const result = await dynamoDb
      .update({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: { ':amount': amount, ':bidder': email },
        ReturnValues: 'ALL_NEW',
      })
      .promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
  })
);
