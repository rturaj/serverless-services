import { getAuctionById } from './getAuction';
import AWS, { DynamoDB } from 'aws-sdk';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import validator from '@middy/validator';
import uploadAuctionPictureSchema from '../schemas/uploadAuctionPictureSchema';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
async function uploadAuctionPicture(event) {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionById(id);
  if (email !== auction.seller) {
    throw new createError.Forbidden('You cannot upload photo to auction you dont own');
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  let updatedAuction;
  try {
    const picture = await s3
      .upload({
        Bucket: process.env.AUCTIONS_BUCKET_NAME,
        Key: auction.id + '.jpg',
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
      })
      .promise();
    updatedAuction = await dynamodb
      .update({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set pictureUrl = :pictureUrl',
        ExpressionAttributeValues: { ':pictureUrl': picture.Location },
        ReturnValues: 'ALL_NEW',
      })
      .promise();
  } catch (err) {
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ inputSchema: uploadAuctionPictureSchema }));
