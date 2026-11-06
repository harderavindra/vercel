import Counter from '../models/Counter.js';

/**
 * Atomically reserves `count` consecutive serials from a named counter and returns the FIRST one.
 * Serials first..first+count-1 belong to the caller. Safe under concurrent requests:
 * the $inc runs in one atomic findOneAndUpdate, so two callers never get the same numbers.
 *
 *   const first = await allocateSerials(3); // e.g. 13 → use 13, 14, 15
 */
export const allocateSerials = async (count = 1, counterId = 'offerV2') => {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer');
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: count } },
    { upsert: true, new: true }
  ).lean();
  return counter.seq - count + 1;
};

export default allocateSerials;
