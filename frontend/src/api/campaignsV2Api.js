import axios from "axios";
const API_baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns-v2`;

// Campaigns v2 API. Every call sends the auth cookie (withCredentials).
// The server checks every rule; the UI only hides buttons (see campaign.permissions).

// ---- Artwork ----
export const ARTWORK_TYPES = ["image/png", "image/jpeg"];
export const MAX_ARTWORK_MB = 5;

/** Checks a file before uploading; returns an error message or "" when it is fine. */
export const artworkFileError = (file) => {
  if (!file) return "Choose a file.";
  if (!ARTWORK_TYPES.includes(file.type)) return "Artwork must be a PNG or JPG image.";
  if (file.size > MAX_ARTWORK_MB * 1024 * 1024) return `Artwork must be at most ${MAX_ARTWORK_MB} MB.`;
  return "";
};

/**
 * Uploads an offer's artwork straight to storage and saves it on the offer:
 *   1. ask the server for a signed upload URL
 *   2. PUT the file to storage (no cookies; the signed URL is the permission)
 *   3. confirm, so the server checks the file and saves offer.artwork
 * Returns the updated offer. onProgress(percent) is optional.
 */
export const uploadArtwork = async (campaignId, offerId, file, { onProgress } = {}) => {
  const problem = artworkFileError(file);
  if (problem) throw new Error(problem);
  const base = `${API_baseURL}/${campaignId}/offers/${offerId}/artwork`;

  const { data: target } = await axios.post(`${base}/upload-url`, { fileType: file.type, size: file.size }, { withCredentials: true });

  await axios.put(target.uploadUrl, file, {
    headers: { "Content-Type": target.contentType },
    withCredentials: false,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  const { data: offer } = await axios.put(
    base,
    { fileName: target.fileName, type: file.type, size: file.size, originalName: file.name },
    { withCredentials: true }
  );
  return offer;
};

/** Short-lived (15 min) link to view an offer's artwork; pass fileName for an older version. */
export const getArtworkViewUrl = async (campaignId, offerId, fileName) => {
  const { data } = await axios.get(`${API_baseURL}/${campaignId}/offers/${offerId}/artwork/view`, {
    params: fileName ? { fileName } : {},
    withCredentials: true,
  });
  return data;
};

export const addArtworkComment = async (campaignId, offerId, text) => {
  const { data } = await axios.post(`${API_baseURL}/${campaignId}/offers/${offerId}/comments`, { text }, { withCredentials: true });
  return data;
};

// ---- Campaigns ----
// params: { status, zone, month, q }
export const listCampaigns = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const { data } = await axios.get(API_baseURL, { params: clean, withCredentials: true });
  return data;
};

/** Full campaign incl. `permissions` for the current user. */
export const getCampaign = async (id) => {
  const { data } = await axios.get(`${API_baseURL}/${id}`, { withCredentials: true });
  return data;
};

// fields: { title, description, month, zone (admin only) }
export const createCampaign = async (fields) => {
  const { data } = await axios.post(API_baseURL, fields, { withCredentials: true });
  return data;
};

// ---- Offers ----
// offer: { state, languages: [code], items: [{ brand, model, hp, type, offerPrice, crossingPrice, features: [id], details, remarks }] }
// On a 400 the server sends { message, errors: [...], fieldErrors: { state, languages, "items.0.brand", ... } }.
export const addOffer = async (campaignId, offer) => {
  const { data } = await axios.post(`${API_baseURL}/${campaignId}/offers`, offer, { withCredentials: true });
  return data;
};

export const updateOffer = async (campaignId, offerId, offer) => {
  const { data } = await axios.put(`${API_baseURL}/${campaignId}/offers/${offerId}`, offer, { withCredentials: true });
  return data;
};

export const removeOffer = async (campaignId, offerId) => {
  const { data } = await axios.delete(`${API_baseURL}/${campaignId}/offers/${offerId}`, { withCredentials: true });
  return data;
};

// fields: { title, description, month }
export const updateCampaign = async (id, fields) => {
  const { data } = await axios.put(`${API_baseURL}/${id}`, fields, { withCredentials: true });
  return data;
};

export const deleteCampaign = async (id) => {
  const { data } = await axios.delete(`${API_baseURL}/${id}`, { withCredentials: true });
  return data;
};

// fields: { title, description, month } → the new draft campaign
export const duplicateCampaign = async (id, fields) => {
  const { data } = await axios.post(`${API_baseURL}/${id}/duplicate`, fields, { withCredentials: true });
  return data;
};

// ---- Workflow actions ----
// action: submit | decideOffers | assign | changeStatus | submitArtwork | decideContent |
//         setCreativeLinks | submitLinks | setLandingPages | handOver
// body examples: decideOffers/decideContent { state, decision: "approved"|"rejected", remark },
//   assign { agencyUserId }, changeStatus { agencyStatus }, setCreativeLinks { links: { offerId: url } },
//   setLandingPages { pages: { offerId: url } }, handOver { agencyUserIds: [id] }
// Returns { message, status, campaign }.
export const performAction = async (id, action, body = {}) => {
  const { data } = await axios.post(`${API_baseURL}/${id}/actions/${action}`, body, { withCredentials: true });
  return data;
};

// Active agency users (Marketing Manager / Admin only)
export const listAgencyUsers = async () => {
  const { data } = await axios.get(`${API_baseURL}/agency-users`, { withCredentials: true });
  return data;
};
