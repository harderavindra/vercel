// Campaigns v2 artwork in the existing GCS bucket (config/storage.js). The old /api/files routes are not used.
//
// Upload flow (frontend/src/api/campaignsV2Api.js → uploadArtwork):
//   1. POST .../artwork/upload-url { fileType, size }   → { uploadUrl, fileName }  (signed WRITE url, 15 min)
//   2. browser PUTs the file to uploadUrl with Content-Type = fileType
//   3. PUT  .../artwork { fileName, type, size }         → server checks the object in the bucket, saves offer.artwork
// Viewing: GET .../artwork/view → signed READ url (15 min) for anyone who can see the campaign.
import { bucket, uuidv4 } from '../config/storage.js';
import { ARTWORK_TYPES, MAX_ARTWORK_MB } from '../constants/campaignV2Workflow.js';
import { HttpError, sendError, loadCampaign, findOffer, sameId } from '../utils/campaignV2Access.js';

const SIGNED_URL_MINUTES = 15;
const MAX_BYTES = MAX_ARTWORK_MB * 1024 * 1024;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg' };
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

const folderOf = (campaign, offer) => `campaigns-v2/${campaign._id}/${offer._id}/`;

/** The assigned agency may upload while preparing artwork / after a rejection, until the state is approved. */
const assertCanUpload = (campaign, offer, user) => {
  if (!sameId(campaign.agency, user.userId)) throw new HttpError(403, 'Only the assigned agency can upload artwork');
  if (!['in_progress', 'content_rejected'].includes(campaign.status)) {
    throw new HttpError(409, 'Artwork can be uploaded after the agency changes the status, or after a rejection');
  }
  if (campaign.contentApprovals.get(offer.state)?.status === 'approved') {
    throw new HttpError(409, `The artwork for ${offer.state} is already approved and locked`);
  }
};

const checkTypeAndSize = (type, size) => {
  if (!ARTWORK_TYPES.includes(type)) throw new HttpError(400, 'Artwork must be a PNG or JPG image');
  if (!Number.isFinite(size) || size <= 0) throw new HttpError(400, 'File size is required');
  if (size > MAX_BYTES) throw new HttpError(400, `Artwork must be at most ${MAX_ARTWORK_MB} MB`);
};

// POST /api/campaigns-v2/:id/offers/:offerId/artwork/upload-url  body: { fileType, size }
export const getArtworkUploadUrl = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    const offer = findOffer(campaign, req.params.offerId);
    assertCanUpload(campaign, offer, req.user);
    const type = clean(req.body?.fileType);
    checkTypeAndSize(type, Number(req.body?.size));

    const fileName = `${folderOf(campaign, offer)}${uuidv4()}.${EXT[type]}`;
    const expires = Date.now() + SIGNED_URL_MINUTES * 60 * 1000;
    const [uploadUrl] = await bucket.file(fileName).getSignedUrl({ version: 'v4', action: 'write', expires, contentType: type });
    res.status(200).json({ uploadUrl, fileName, contentType: type, expiresAt: new Date(expires) });
  } catch (error) {
    sendError(res, error, 'Failed to create upload URL');
  }
};

// PUT /api/campaigns-v2/:id/offers/:offerId/artwork  body: { fileName, type, size, originalName? }
// The file must already be in the bucket at fileName (from upload-url) with the same type and a size <= 5 MB.
export const confirmArtwork = async (req, res) => {
  try {
    const { user } = req;
    const campaign = await loadCampaign(req.params.id, user);
    const offer = findOffer(campaign, req.params.offerId);
    assertCanUpload(campaign, offer, user);

    const fileName = clean(req.body?.fileName);
    const type = clean(req.body?.type);
    const size = Number(req.body?.size);
    checkTypeAndSize(type, size);
    // Only objects this offer's upload-url could have produced (no pointing at other files in the bucket)
    const pattern = new RegExp(`^${folderOf(campaign, offer)}[0-9a-f-]{36}\\.${EXT[type]}$`);
    if (!pattern.test(fileName)) throw new HttpError(400, 'fileName does not belong to this offer');

    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (!exists) throw new HttpError(400, 'The file was not found in storage. Upload it first.');
    const [meta] = await file.getMetadata();
    const storedSize = Number(meta.size);
    if (meta.contentType !== type || storedSize > MAX_BYTES || (size && storedSize !== size)) {
      // Wrong content in storage: remove it so it cannot be used later
      await file.delete({ ignoreNotFound: true }).catch((e) => console.error('Could not delete rejected artwork:', e.message));
      throw new HttpError(400, `The uploaded file does not match (type ${meta.contentType}, ${storedSize} bytes). Upload a PNG or JPG up to ${MAX_ARTWORK_MB} MB.`);
    }

    // Older artwork files stay in storage: comments refer to them by fileName
    offer.artwork = {
      fileName, originalName: clean(req.body?.originalName), type, size: storedSize,
      uploadedAt: new Date(), uploadedBy: user.userId,
    };
    await campaign.save();
    res.status(200).json({ ...offer.toJSON({ flattenMaps: true }), campaignStatus: campaign.status });
  } catch (error) {
    sendError(res, error, 'Failed to save artwork');
  }
};

// GET /api/campaigns-v2/:id/offers/:offerId/artwork/view  → { url, expiresAt, fileName, type }
// ?fileName=<older artwork of this offer> shows a previous version (e.g. the one a comment refers to).
export const viewArtwork = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user); // 404 if the user cannot see the campaign
    const offer = findOffer(campaign, req.params.offerId);
    const requested = clean(req.query?.fileName);
    let fileName = offer.artwork?.fileName;
    if (requested) {
      const known = requested === fileName || offer.artworkComments.some((c) => c.fileName === requested);
      if (!known) throw new HttpError(404, 'Artwork not found');
      fileName = requested;
    }
    if (!fileName) throw new HttpError(404, 'This offer has no artwork yet');

    const expires = Date.now() + SIGNED_URL_MINUTES * 60 * 1000;
    const [url] = await bucket.file(fileName).getSignedUrl({ version: 'v4', action: 'read', expires });
    res.status(200).json({ url, expiresAt: new Date(expires), fileName, type: offer.artwork?.type });
  } catch (error) {
    sendError(res, error, 'Failed to get artwork');
  }
};
