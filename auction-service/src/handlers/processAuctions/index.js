import createHttpError from 'http-errors';
import closeAuction from './closeAuction';
import getEndedAuctions from './getEndedAuctions';
async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getEndedAuctions();
    const promises = auctionsToClose.map((auction) => closeAuction(auction));
    await Promise.all(promises);
    return { closed: auctionsToClose.length };
  } catch (error) {
    console.error(error);
    throw new createHttpError.InternalServerError(error);
  }
}
export const handler = processAuctions;
