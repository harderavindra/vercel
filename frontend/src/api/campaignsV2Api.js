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
