import { isDeepStrictEqual } from 'node:util';

export function assertPilotRights(entry, review) {
  if (entry.license !== 'CC0-1.0' || review?.license !== entry.license || review?.id !== entry.id || review?.sourceUrl !== entry.sourceUrl || review?.status !== 'verified-cc0' || !/^\d{4}-\d{2}-\d{2}$/.test(review?.checkedOn ?? '') || review?.termsUrl !== 'https://www.innerscene.com/tools/library/terms') throw Error(`${entry.id}: commercial-use evidence is missing or mismatched`);
}
export function assertCurrentPilotRights(entry, review) {
  assertPilotRights(entry, review);
  if (!isDeepStrictEqual(entry.rightsReview, review)) throw Error(`${entry.id}: embedded rights evidence is stale`);
}
export function annotatePilotRecord(entry, model, review) {
  assertPilotRights(entry, review);
  if (!model) throw Error(`${entry.id}: missing catalogue model`);
  const modelDimensions = { length_m: entry.bounds.max[0] - entry.bounds.min[0], width_m: entry.bounds.max[2] - entry.bounds.min[2], height_m: entry.bounds.max[1] - entry.bounds.min[1] };
  const catalogueDimensions = { length_m: model.length_m, width_m: model.width_m, height_m: model.height_m };
  for (const key of Object.keys(modelDimensions)) if (!Number.isFinite(modelDimensions[key]) || Math.abs(modelDimensions[key] - catalogueDimensions[key]) >= 0.002) throw Error(`${entry.id}: measured ${key} differs from catalogue`);
  return { ...entry, modelDimensions, catalogueDimensions, dimensionBasis: 'measured-model-bounds', manufacturerCertified: false, rightsReview: review };
}
