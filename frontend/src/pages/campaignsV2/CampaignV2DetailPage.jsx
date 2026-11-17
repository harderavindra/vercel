import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiCheck, FiCopy, FiDownload, FiEdit2, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";
import { getCampaign, removeOffer, deleteCampaign, performAction, downloadCampaignExcel } from "../../api/campaignsV2Api";
import { useAuth } from "../../context/auth-context";
import { getLanguages } from "../../api/mastersApi";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import PageTitle from "../../components/common/PageTitle";
import StatusBubble from "../../components/common/StatusBubble";
import StatusBubbleText from "../../components/common/StatusBubbleText";
import StatusPill from "../../components/campaignsV2/StatusPill";
import ProgressTracker from "../../components/campaignsV2/ProgressTracker";
import OfferV2Modal from "../../components/campaignsV2/OfferV2Modal";
import ArtworkCell from "../../components/campaignsV2/ArtworkCell";
import ActionPanel from "../../components/campaignsV2/ActionPanel";
import CampaignV2Modal from "../../components/campaignsV2/CampaignV2Modal";
import TrucadenceMark from "../../components/campaignsV2/TrucadenceMark";
import { ROLE_LABELS, STATUS, fmtMonthLong, fmtINR, userName, eventStyle } from "../../utils/campaignV2Flow";
import { formatDateTime, formatDateDistance, formatShortDateTime } from "../../utils/formatDateTime";

const linkInput = "border rounded-md border-gray-400 px-2 py-1 focus:border-blue-300 focus:outline-0 w-full min-w-44";
const smallBtn = "flex items-center gap-1 border border-gray-300 rounded-md px-3 py-2 text-sm hover:border-red-400 hover:text-red-500 cursor-pointer bg-white";
const card = "bg-white border border-blue-300/60 rounded-lg shadow-md";
const TONE_BUBBLE = { draft: "disabled", wait: "warning", bad: "error", ok: "success" };

// Small label over a bold value, for the one-row campaign summary
const SummaryItem = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
    <div className="font-semibold text-gray-800">{children || "—"}</div>
  </div>
);

const linkHref = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const LinkValue = ({ value }) => {
  if (!value) return <span className="text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5 whitespace-nowrap">Not added</span>;
  return (
    <a href={linkHref(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-red-500 break-all inline-flex items-start gap-1">
      {value} <FiExternalLink className="shrink-0 mt-0.5" size={12} />
    </a>
  );
};
const LINK_STATE = {
  saved: { label: "Saved", cls: "bg-green-50 text-green-700 border-green-200" },
  unsaved: { label: "Not saved", cls: "bg-yellow-50 text-yellow-700 border-yellow-300" },
  missing: { label: "Not added", cls: "bg-gray-100 text-gray-500 border-gray-300" },
};

const CampaignV2DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campModal, setCampModal] = useState(null); // "edit" | "duplicate"
  const [linkDrafts, setLinkDrafts] = useState({}); // offerId → { creativeLink?, landingPage? } typed but not saved
  const [campaign, setCampaign] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [offerModal, setOfferModal] = useState(null); // { offer, readOnly }

  const load = useCallback(async () => {
    try {
      setCampaign(await getCampaign(id));
      setError("");
    } catch (err) {
      setError(err.response?.status === 404 ? "Campaign not found, or you don't have access to it." : err.response?.data?.message || "Could not load the campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getLanguages(true).catch(() => getLanguages()).then(setLanguages).catch(() => setLanguages([])); }, []);

  // After an action / upload / comment: show the message and reload the campaign
  const onChanged = useCallback(async (message) => {
    setNotice(message || "");
    setError("");
    await load();
  }, [load]);

  // Saves link edits typed in the offers table (creative links for the agency, landing pages for MM / Admin).
  // onlyOfferId: save just that row. Returns false if saving failed.
  const [savingRow, setSavingRow] = useState(null);
  const [linkErrors, setLinkErrors] = useState({}); // offerId → message from the last failed save
  const saveLinks = async (onlyOfferId) => {
    const field = campaign.permissions?.editCreativeLinks ? "creativeLink" : campaign.permissions?.editLandingPages ? "landingPage" : null;
    if (!field) return true;
    const rowId = typeof onlyOfferId === "string" ? onlyOfferId : null;
    const changed = Object.fromEntries(
      Object.entries(linkDrafts)
        .filter(([oid, d]) => (!rowId || oid === rowId) && d[field] !== undefined && d[field].trim() !== (campaign.offers.find((o) => o._id === oid)?.[field] || ""))
        .map(([oid, d]) => [oid, d[field].trim()])
    );
    if (!Object.keys(changed).length) return true;
    setSavingRow(rowId || "all");
    setLinkErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([oid]) => !(oid in changed))));
    try {
      await performAction(campaign._id, field === "creativeLink" ? "setCreativeLinks" : "setLandingPages", field === "creativeLink" ? { links: changed } : { pages: changed });
      setLinkDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([oid]) => !(oid in changed))));
      await onChanged(Object.keys(changed).length === 1 ? "Link saved." : "Links saved.");
      return true;
    } catch (err) {
      const message = err.response?.data?.message || "Could not save the link";
      setLinkErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(changed).map((oid) => [oid, message])) }));
      if (!rowId) setError(message);
      return false;
    } finally {
      setSavingRow(null);
    }
  };

  const [downloading, setDownloading] = useState(false);
  const onDownloadExcel = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadCampaignExcel(campaign);
    } catch (err) {
      // the error body is a Blob because of responseType "blob"
      let message = "Could not download the Excel file";
      try { message = JSON.parse(await err.response?.data?.text?.())?.message || message; } catch { /* keep default */ }
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const onDeleteCampaign = async () => {
    if (!window.confirm(`Delete the draft campaign "${campaign.title}" and its ${campaign.offers.length} offers? This cannot be undone.`)) return;
    try {
      await deleteCampaign(campaign._id);
      navigate("/campaigns-v2");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the campaign");
    }
  };

  const langName = (code) => languages.find((l) => l.code === code)?.name || code;
  const canEdit = !!campaign?.permissions?.editOffers;
  const canAdd = !!campaign?.permissions?.addOffers;
  // Under Brand Manager review, offers of approved states are locked
  const canEditOffer = (o) => canEdit && !(campaign?.permissions?.lockedStates || []).includes(o.state);
  const underReview = campaign?.status === "pending_offer_approval";

  const onSaved = async () => {
    setOfferModal(null);
    setNotice("Offer saved.");
    await load();
  };

  const onRemove = async (offer) => {
    if (!window.confirm(`Remove offer ${offer.code} (${offer.state}) from this campaign?`)) return;
    try {
      await removeOffer(campaign._id, offer._id);
      setNotice(`Offer ${offer.code} removed.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove the offer");
    }
  };

  if (loading) return <div className="p-10">Loading campaign...</div>;
  if (!campaign) {
    return (
      <div className="p-10 flex flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <Link to="/campaigns-v2" className="text-blue-600 hover:text-red-500">← All campaigns</Link>
      </div>
    );
  }

  const approvals = campaign.approvals || {};
  const contentApprovals = campaign.contentApprovals || {};
  const st = STATUS[campaign.status] || {};
  const perms = campaign.permissions || {};
  const linksField = perms.editCreativeLinks ? "creativeLink" : perms.editLandingPages ? "landingPage" : null;
  const draftOf = (o, field) => linkDrafts[o._id]?.[field] ?? o[field] ?? "";
  const rowDirty = (o, field) => draftOf(o, field).trim() !== (o[field] || "");
  const dirtyCount = linksField ? campaign.offers.filter((o) => rowDirty(o, linksField)).length : 0;
  const linkCell = (o, field) => {
    if (linksField !== field) return <LinkValue value={o[field]} />;
    const dirty = rowDirty(o, field);
    const state = LINK_STATE[dirty ? "unsaved" : o[field] ? "saved" : "missing"];
    const label = field === "creativeLink" ? "Creative link" : "Landing page";
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            className={`${linkInput} ${dirty ? "border-yellow-400 bg-yellow-50/40" : ""}`}
            placeholder="https://…"
            value={draftOf(o, field)}
            onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [o._id]: { ...prev[o._id], [field]: e.target.value } }))}
            onKeyDown={(e) => { if (e.key === "Enter" && dirty) saveLinks(o._id); }}
            aria-label={`${label} for ${o.code}`}
          />
          <button
            type="button"
            disabled={!dirty || !!savingRow}
            onClick={() => saveLinks(o._id)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-sm cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <FiCheck size={14} /> {savingRow === o._id ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${state.cls}`}>{state.label}</span>
          {linkErrors[o._id] && dirty && <span className="text-xs text-red-500">{linkErrors[o._id]}</span>}
          {o[field] && !dirty && <a href={linkHref(o[field])} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-red-500 inline-flex items-center gap-1">Open <FiExternalLink size={11} /></a>}
        </div>
      </div>
    );
  };
  const history = [...(campaign.history || [])].reverse();
  const states = [...new Set(campaign.offers.map((o) => o.state))];

  return (
    <div className="p-4 sm:p-10 flex flex-col gap-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-4">
          <PageTitle className="flex flex-wrap items-baseline gap-x-3"><TrucadenceMark /> <span>Campaign</span></PageTitle>
          <Button width="auto" type="button" onClick={() => navigate("/campaigns-v2")}>Back</Button>
        </div>
        <ProgressTracker campaign={campaign} />
        {notice && <p className="text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2">{notice}</p>}
        {error && <p className="text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</p>}
      </div>

      {/* Left: campaign info + next action. Right: history (same height, scrolls) */}
      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        <div className={`${card} p-6 flex flex-col gap-5`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-800 break-words">{campaign.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Avatar name={userName(campaign.createdBy)} src={campaign.createdBy?.profilePic} size="xs" />
                <span className="capitalize text-gray-700">{userName(campaign.createdBy) || "—"}</span>
                <span>· {formatDateTime(campaign.createdAt)}</span>
              </div>
            </div>
            <StatusBubbleText text={st.label || campaign.status} status={TONE_BUBBLE[st.tone] || "disabled"} className="text-center shrink-0" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-100/70 rounded-lg p-4">
            <SummaryItem label="Zone">{campaign.zone}</SummaryItem>
            <SummaryItem label="Month">{fmtMonthLong(campaign.month)}</SummaryItem>
            <SummaryItem label="Offers">{String(campaign.offers.length)}</SummaryItem>
            <SummaryItem label="States">{states.join(", ")}</SummaryItem>
            <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-x-10 gap-y-3 border-t border-gray-200 pt-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Agency</div>
                {campaign.agency ? (
                  <div className="flex gap-2 items-center mt-1">
                    <Avatar name={userName(campaign.agency)} src={campaign.agency.profilePic} size="xs" />
                    <span className="font-semibold text-gray-800">{userName(campaign.agency)}</span>
                    <span className="text-sm text-gray-500">· {campaign.agencyStatus || "Not started"}</span>
                  </div>
                ) : (
                  <div className="text-gray-400 mt-1">Not assigned yet</div>
                )}
              </div>
              {campaign.handedTo?.length > 0 && (
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Handed to</div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {campaign.handedTo.map((u) => (
                      <div key={u._id} className="flex gap-2 items-center">
                        <Avatar name={userName(u)} src={u.profilePic} size="xs" />
                        <span className="font-semibold text-gray-800">{userName(u)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {campaign.description && <p className="text-gray-600 text-sm whitespace-pre-line">{campaign.description}</p>}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Next action</h3>
            {/* keyed so remarks and selections reset when the step changes */}
            <ActionPanel key={campaign.status} campaign={campaign} onChanged={onChanged} saveLinks={saveLinks} />
          </div>
        </div>

        <div className={`${card} overflow-hidden flex flex-col h-[36rem] lg:h-auto lg:max-h-[48rem] lg:min-h-[28rem]`}>
          <h2 className="px-5 py-3 border-b border-gray-300 text-lg font-bold bg-gray-50 flex justify-between items-center">
            History <span className="text-sm font-normal text-gray-500">{history.length} events</span>
          </h2>
          <div className="overflow-y-auto flex-1 min-h-0 lg:h-0">
            {history.length ? (
              history.map((h, i) => {
                const style = eventStyle(h.event);
                const detail = [h.note, h.remark && `“${h.remark}”`].filter(Boolean).join(" · ");
                return (
                  <div key={h._id || i} className="border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                    <div className="shrink-0 self-center"><StatusBubble size="sm" icon={style.icon} status={style.status} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <p className="truncate" title={detail ? `${h.event} · ${detail}` : h.event}>
                          <span className="font-semibold text-gray-800">{h.event}</span>
                          {detail && <span className="text-gray-500"> · {detail}</span>}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateDistance(h.at).relative}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        <span className="text-gray-700">{userName(h.by) || "Someone"}</span>
                        {h.role && <> · {ROLE_LABELS[h.role] || h.role}</>}
                        {" · "}{formatShortDateTime(h.at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 px-5 py-3">No history yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Offers */}
      <div className={`${card} p-6 flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">Offers ({campaign.offers.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            {campaign.offers.length > 0 && (
              <button type="button" className={smallBtn} onClick={onDownloadExcel} disabled={downloading}>
                <FiDownload /> {downloading ? "Preparing…" : "Download Excel"}
              </button>
            )}
            {perms.editCampaign && <button type="button" className={smallBtn} onClick={() => setCampModal("edit")}><FiEdit2 /> Edit campaign</button>}
            {perms.duplicate && <button type="button" className={smallBtn} onClick={() => setCampModal("duplicate")}><FiCopy /> Duplicate campaign</button>}
            {perms.deleteCampaign && <button type="button" className={`${smallBtn} text-red-500`} onClick={onDeleteCampaign}><FiTrash2 /> Delete</button>}
            {linksField && dirtyCount > 1 && (
              <Button width="auto" variant="outline" disabled={!!savingRow} onClick={() => saveLinks()}>Save all ({dirtyCount})</Button>
            )}
            {canAdd && (
              <Button width="auto" onClick={() => { setNotice(""); setOfferModal({ offer: null, readOnly: false }); }} className="flex items-center gap-2">
                <FiPlus /> Add offer
              </Button>
            )}
          </div>
        </div>

        {campaign.offers.length === 0 ? (
          <p className="text-gray-500">
            No offers yet.{canAdd ? " Use Add offer to create the first one." : campaign.status === "draft" ? ` The Zonal Marketing Manager of ${campaign.zone} adds the offers.` : ""}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-200 text-sm">
              <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
                <tr>
                  <th className="p-3">Offer</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Languages</th>
                  <th className="p-3 min-w-72">Brands & offer details</th>
                  <th className="p-3">Artwork</th>
                  <th className="p-3">Creative link</th>
                  <th className="p-3">Landing page</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {campaign.offers.map((o, i) => (
                  <tr key={o._id} className="border-b border-gray-200 align-top">
                    <td className="p-3 whitespace-nowrap">
                      <strong>{i + 1}</strong>
                      <div className="font-mono text-xs text-gray-600">{o.code}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{o.state}</div>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                        <span>Offers: <StatusPill decision={approvals[o.state]?.status} /></span>
                        <span>Artwork: <StatusPill decision={contentApprovals[o.state]?.status} /></span>
                      </div>
                    </td>
                    <td className="p-3">{o.languages.map(langName).join(", ")}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-3">
                        {o.items.map((it, i) => (
                          <div key={i} className={i > 0 ? "border-t border-gray-200 pt-3" : ""}>
                            <div><strong>{it.modelName}</strong> <span className="text-gray-500">{it.brandName} · {it.hp}</span></div>
                            <div>
                              {it.type}
                              {it.offerPrice && <> · <strong>{fmtINR(it.offerPrice)}</strong></>}
                              {it.priceType && <span className="text-gray-500"> {it.priceType}</span>}
                              {/* older offers only (crossing price is no longer entered) */}
                              {it.crossingPrice && <span className="text-gray-500"> ({it.offerPrice ? "was " : "crossing "}<s>{fmtINR(it.crossingPrice)}</s>)</span>}
                            </div>
                            {it.details && <div className="text-gray-700">{it.details}</div>}
                            {it.features?.length > 0 && (
                              <ul className="list-disc list-inside text-gray-500">
                                {it.features.map((f, j) => <li key={j}>{f?.text?.en || "(feature removed)"}</li>)}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <ArtworkCell
                        campaignId={campaign._id}
                        offer={o}
                        canUpload={!!perms.uploadArtwork && contentApprovals[o.state]?.status !== "approved"}
                        canComment={!!perms.comment && contentApprovals[o.state]?.status === "pending"}
                        onChanged={onChanged}
                      />
                    </td>
                    <td className={`p-3 ${linksField === "creativeLink" ? "min-w-72" : "max-w-56"}`}>{linkCell(o, "creativeLink")}</td>
                    <td className={`p-3 ${linksField === "landingPage" ? "min-w-72" : "max-w-56"}`}>{linkCell(o, "landingPage")}</td>
                    <td className="p-3 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button type="button" className="text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => { setNotice(""); setOfferModal({ offer: o, readOnly: !canEditOffer(o) }); }}>
                          {canEditOffer(o) ? "Edit" : "View"}
                        </button>
                        {canAdd && <button type="button" className="text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => { setNotice(""); setOfferModal({ offer: { state: o.state, languages: o.languages, items: o.items }, readOnly: false }); }}>Duplicate</button>}
                        {canEditOffer(o) && <button type="button" className="text-red-500 hover:text-red-700 cursor-pointer" onClick={() => onRemove(o)}>Remove</button>}
                        {underReview && canEdit && !canEditOffer(o) && <span className="text-xs text-gray-500">Approved · locked</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {campModal && (
        <CampaignV2Modal
          user={user}
          mode={campModal}
          campaign={campaign}
          onClose={() => setCampModal(null)}
          onCreated={(c) => {
            setCampModal(null);
            if (campModal === "duplicate") navigate(`/campaigns-v2/${c._id}`);
            else onChanged("Campaign saved.");
          }}
        />
      )}
      {offerModal && (
        <OfferV2Modal
          campaign={campaign}
          offer={offerModal.offer}
          readOnly={offerModal.readOnly}
          onClose={() => setOfferModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
};

export default CampaignV2DetailPage;
