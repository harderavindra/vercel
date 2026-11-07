import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiImage, FiMessageSquare, FiUploadCloud } from "react-icons/fi";
import Modal from "./Modal";
import Button from "../common/Button";
import { getArtworkViewUrl, uploadArtwork, addArtworkComment, artworkFileError } from "../../api/campaignsV2Api";
import { fmtDateTime, userName } from "../../utils/campaignV2Flow";

// Signed view URLs last 15 minutes; fetch one when shown and again if the image fails to load.
const useArtworkUrl = (campaignId, offerId, fileName) => {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    if (!fileName) return;
    getArtworkViewUrl(campaignId, offerId, fileName)
      .then((d) => { setUrl(d.url); setFailed(false); })
      .catch(() => setFailed(true));
  }, [campaignId, offerId, fileName]);
  useEffect(() => { setUrl(""); load(); }, [load]);
  return { url, failed, reload: load };
};

// canComment: the ZMM can add a comment while this state's artwork awaits approval
const CommentsModal = ({ campaignId, offer, canComment, onChanged, onClose }) => {
  const current = offer.artwork?.fileName;
  const { url } = useArtworkUrl(campaignId, offer._id, current);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const add = async () => {
    if (!text.trim()) { setError("Write a comment first."); return; }
    setSaving(true);
    setError("");
    try {
      await addArtworkComment(campaignId, offer._id, text.trim());
      setText("");
      await onChanged("Comment added.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the comment");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title={<>Artwork comments <span className="ml-2 text-sm font-mono bg-gray-100 border border-gray-300 rounded px-2 py-0.5">{offer.code}</span></>}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={<Button width="auto" variant="outline" onClick={onClose}>Close</Button>}
    >
      {current ? (
        url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Artwork ${offer.code}`} className="max-h-72 mx-auto rounded-md border border-gray-200" /></a>
            : <p className="text-gray-500">Loading artwork...</p>
      ) : (
        <p className="text-gray-500">No artwork uploaded right now.</p>
      )}
      {offer.artworkComments?.length ? (
        <ul className="mt-4 flex flex-col gap-3">
          {offer.artworkComments.map((c, i) => {
            const old = !!current && !!c.fileName && c.fileName !== current;
            return (
              <li key={i} className={`border-l-4 pl-3 ${old ? "border-gray-300 text-gray-500" : "border-red-400"}`}>
                <div className="text-sm">
                  <strong>{userName(c.by) || "Zonal Marketing Manager"}</strong>
                  <span className="text-gray-500"> · {fmtDateTime(c.at)}{old && " · on an earlier artwork"}</span>
                </div>
                <p>{c.text}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 mt-4">No comments yet.</p>
      )}
      {canComment && (
        <div className="mt-4 flex flex-col gap-2">
          <textarea rows={3} className="border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0 w-full" placeholder="What should the agency change?" value={text} onChange={(e) => setText(e.target.value)} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div><Button width="auto" onClick={add} disabled={saving}>{saving ? "Adding..." : "Add comment"}</Button></div>
        </div>
      )}
    </Modal>
  );
};

// Thumbnail of an offer's artwork (opens full size), a comments button and, for the agency, Upload / Replace.
// canUpload / canComment come from campaign.permissions plus the state's artwork decision; onChanged(message) reloads.
const ArtworkCell = ({ campaignId, offer, canUpload = false, canComment = false, onChanged }) => {
  const fileName = offer.artwork?.fileName;
  const { url, failed, reload } = useArtworkUrl(campaignId, offer._id, fileName);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const input = useRef(null);
  const count = offer.artworkComments?.length || 0;

  const upload = async (file) => {
    if (!file) return;
    const problem = artworkFileError(file);
    if (problem) { setError(problem); return; }
    setError("");
    setProgress(0);
    try {
      await uploadArtwork(campaignId, offer._id, file, { onProgress: setProgress });
      await onChanged(`Artwork uploaded for ${offer.code}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 items-start">
      {!fileName ? (
        <span className="text-gray-400 text-sm flex items-center gap-1"><FiImage /> None</span>
      ) : url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" title={offer.artwork.originalName || "Open artwork"}>
          <img src={url} alt={`Artwork ${offer.code}`} onError={reload} className="w-20 h-20 object-cover rounded-md border border-gray-200" />
        </a>
      ) : (
        <span className="w-20 h-20 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
          {failed ? "Not available" : "Loading..."}
        </span>
      )}
      {canUpload && (
        <>
          <input ref={input} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" disabled={progress !== null} onClick={() => input.current?.click()} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50">
            <FiUploadCloud /> {progress !== null ? `Uploading ${progress}%` : fileName ? "Replace" : "Upload"}
          </button>
        </>
      )}
      {error && <span className="text-red-500 text-xs max-w-40">{error}</span>}
      {(fileName || count > 0 || canComment) && (
        <button type="button" onClick={() => setShowComments(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-red-500 cursor-pointer">
          <FiMessageSquare /> Comments{count > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 text-xs">{count}</span>}
        </button>
      )}
      {showComments && <CommentsModal campaignId={campaignId} offer={offer} canComment={canComment} onChanged={onChanged} onClose={() => setShowComments(false)} />}
    </div>
  );
};

export default ArtworkCell;
