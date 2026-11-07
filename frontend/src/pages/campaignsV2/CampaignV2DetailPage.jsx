import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiClock, FiCopy, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { getCampaign, removeOffer, deleteCampaign, performAction } from "../../api/campaignsV2Api";
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
import { ROLE_LABELS, STATUS, fmtMonthLong, fmtINR, userName, eventStyle } from "../../utils/campaignV2Flow";
import { formatDateTime, formatDateDistance, formatShortDateTime } from "../../utils/formatDateTime";

const linkInput = "border rounded-md border-gray-400 px-2 py-1 focus:border-blue-300 focus:outline-0 w-48";
const smallBtn = "flex items-center gap-1 border border-gray-300 rounded-md px-3 py-2 text-sm hover:border-red-400 hover:text-red-500 cursor-pointer bg-white";
const card = "bg-white border border-blue-300/60 rounded-lg shadow-md";
const TONE_BUBBLE = { draft: "disabled", wait: "warning", bad: "error", ok: "success" };

// Label over a bold value, as in the job page's Specification box
const LabelValue = ({ label, children }) => (
  <div className="w-full">
    <label className="text-gray-400">{label}</label>
    <div className="font-semibold">{children || "—"}</div>
  </div>
);

const LinkValue = ({ value }) => {
  if (!value) return <span className="text-gray-400">—</span>;
  return /^https?:\/\//i.test(value)
    ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-red-500 break-all">{value}</a>
    : <span className="break-all">{value}</span>;
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
  // Returns false if saving failed.
  const saveLinks = async () => {
    const field = campaign.permissions?.editCreativeLinks ? "creativeLink" : campaign.permissions?.editLandingPages ? "landingPage" : null;
    if (!field) return true;
    const changed = Object.fromEntries(
      Object.entries(linkDrafts)
        .filter(([oid, d]) => d[field] !== undefined && d[field] !== (campaign.offers.find((o) => o._id === oid)?.[field] || ""))
        .map(([oid, d]) => [oid, d[field]])
    );
    if (!Object.keys(changed).length) return true;
    try {
      await performAction(campaign._id, field === "creativeLink" ? "setCreativeLinks" : "setLandingPages", field === "creativeLink" ? { links: changed } : { pages: changed });
      setLinkDrafts({});
      await onChanged("Links saved.");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the links");
      return false;
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
  const completed = campaign.status === "completed";
  const perms = campaign.permissions || {};
  const linksField = perms.editCreativeLinks ? "creativeLink" : perms.editLandingPages ? "landingPage" : null;
  const linksDirty = !!linksField && Object.entries(linkDrafts).some(([oid, d]) => d[linksField] !== undefined && d[linksField] !== (campaign.offers.find((o) => o._id === oid)?.[linksField] || ""));
  const linkCell = (o, field) => {
    if (linksField !== field) return <LinkValue value={o[field]} />;
    const v = linkDrafts[o._id]?.[field] ?? o[field] ?? "";
    return (
      <input
        className={linkInput}
        placeholder="https://…"
        value={v}
        onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [o._id]: { ...prev[o._id], [field]: e.target.value } }))}
        aria-label={`${field === "creativeLink" ? "Creative link" : "Landing page"} for ${o.code}`}
      />
    );
  };
  const history = [...(campaign.history || [])].reverse();
  const states = [...new Set(campaign.offers.map((o) => o.state))];

  return (
    <div className="p-4 sm:p-10 flex flex-col gap-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-4">
          <PageTitle>Campaign</PageTitle>
          <Button width="auto" type="button" onClick={() => navigate("/campaigns-v2")}>Back</Button>
        </div>
        <ProgressTracker campaign={campaign} />
        {notice && <p className="text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2">{notice}</p>}
        {error && <p className="text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</p>}
      </div>

      <div className="flex gap-10 flex-col lg:flex-row">
        {/* Left: campaign card */}
        <div className={`${card} flex flex-col gap-4 p-6 sm:px-10 lg:w-xl shrink-0`}>
          <div className="pb-2 flex justify-between gap-3 items-start">
            <h2 className="text-2xl font-bold text-gray-800">{campaign.title}</h2>
            <StatusBubble size="xs" icon={completed ? "check" : "clock"} status={completed ? "success" : "error"} />
          </div>
          <div className="flex justify-between items-center gap-3">
            <div className="flex gap-3">
              <Avatar name={userName(campaign.createdBy)} src={campaign.createdBy?.profilePic} size="sm" />
              <div>
                <p className="text-base/4 capitalize">{userName(campaign.createdBy) || "—"}</p>
                <p className="text-sm">{formatDateTime(campaign.createdAt)}</p>
              </div>
            </div>
            <StatusBubbleText text={st.label || campaign.status} status={TONE_BUBBLE[st.tone] || "disabled"} className="ml-auto text-center" />
          </div>
          <h2>Specification</h2>
          <div className="bg-gray-100/70 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <LabelValue label="Zone">{campaign.zone}</LabelValue>
              <LabelValue label="Month">{fmtMonthLong(campaign.month)}</LabelValue>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <LabelValue label="Offers">{String(campaign.offers.length)}</LabelValue>
              <LabelValue label="States">{states.join(", ")}</LabelValue>
            </div>
          </div>
          {campaign.description && (
            <>
              <h2>Description</h2>
              <div className="bg-gray-100/70 p-4 rounded-lg whitespace-pre-line">{campaign.description}</div>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-5 mt-auto">
            <Button type="button" variant="outline" onClick={() => navigate("/campaigns-v2")}>Back to Campaigns</Button>
          </div>
        </div>

        {/* Right: assignment + history */}
        <div className={`${card} w-full overflow-hidden`}>
          <div className="flex flex-col sm:flex-row justify-between h-full">
            <div className="sm:w-[70%] p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Assigned to</h3>
                {campaign.agency ? (
                  <div className="flex gap-3 items-center mt-2">
                    <Avatar name={userName(campaign.agency)} src={campaign.agency.profilePic} size="sm" />
                    <div>
                      <p className="text-gray-400 text-base/tight">
                        Assigned to <span className="text-gray-700 font-bold">{userName(campaign.agency)}</span>
                      </p>
                      <p className="text-gray-400 text-base/tight">
                        Agency status <span className="text-gray-700 font-bold">{campaign.agencyStatus || "Not started"}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 mt-1">Not assigned to an agency yet.</p>
                )}
              </div>
              {campaign.handedTo?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Handed to</h3>
                  <div className="flex flex-col gap-2 mt-2">
                    {campaign.handedTo.map((u) => (
                      <div key={u._id} className="flex gap-3 items-center">
                        <Avatar name={userName(u)} src={u.profilePic} size="sm" />
                        <span className="text-gray-700 font-bold">{userName(u)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* keyed so remarks and selections reset when the step changes */}
              <ActionPanel key={campaign.status} campaign={campaign} onChanged={onChanged} saveLinks={saveLinks} />
            </div>
            <div className="bg-gray-50 w-full sm:min-w-80">
              <h2 className="px-4 py-2 border-b border-gray-300 text-xl font-bold">History</h2>
              {history.length ? (
                history.map((h, i) => {
                  const style = eventStyle(h.event);
                  return (
                    <div key={h._id || i} className="border-b px-6 py-4 border-gray-300 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex gap-2 items-center whitespace-nowrap">
                          <FiClock size={12} />
                          {formatShortDateTime(h.at)}
                        </p>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-semibold opacity-40 whitespace-nowrap">{formatDateDistance(h.at).relative}</span>
                          <p className="flex gap-2 items-center text-xs font-semibold text-right">
                            {h.event}
                            <StatusBubble size="md" icon={style.icon} status={style.status} />
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="min-w-8">
                          <Avatar name={userName(h.by)} src={h.by?.profilePic} size="sm" />
                        </div>
                        <div className="w-full">
                          <p>by: {userName(h.by) || "Someone"}{h.role && <span className="text-gray-400 text-sm"> ({ROLE_LABELS[h.role] || h.role})</span>}</p>
                          {h.note && <p className="text-gray-600 text-base/tight">{h.note}</p>}
                          {h.remark && <p className="text-gray-600 text-base/tight italic">“{h.remark}”</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 px-4 py-2">No history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offers */}
      <div className={`${card} p-6 flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">Offers ({campaign.offers.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            {perms.editCampaign && <button type="button" className={smallBtn} onClick={() => setCampModal("edit")}><FiEdit2 /> Edit campaign</button>}
            {perms.duplicate && <button type="button" className={smallBtn} onClick={() => setCampModal("duplicate")}><FiCopy /> Duplicate campaign</button>}
            {perms.deleteCampaign && <button type="button" className={`${smallBtn} text-red-500`} onClick={onDeleteCampaign}><FiTrash2 /> Delete</button>}
            {linksField && (
              <Button width="auto" variant="outline" disabled={!linksDirty} onClick={saveLinks}>Save links</Button>
            )}
            {canEdit && (
              <Button width="auto" onClick={() => { setNotice(""); setOfferModal({ offer: null, readOnly: false }); }} className="flex items-center gap-2">
                <FiPlus /> Add offer
              </Button>
            )}
          </div>
        </div>

        {campaign.offers.length === 0 ? (
          <p className="text-gray-500">
            No offers yet.{canEdit ? " Use Add offer to create the first one." : campaign.status === "draft" ? ` The Zonal Marketing Manager of ${campaign.zone} adds the offers.` : ""}
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
                {campaign.offers.map((o) => (
                  <tr key={o._id} className="border-b border-gray-200 align-top">
                    <td className="p-3 whitespace-nowrap">
                      <strong>#{o.serial}</strong>
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
                              {it.crossingPrice && <span className="text-gray-500"> ({it.offerPrice ? "was " : "crossing "}<s>{fmtINR(it.crossingPrice)}</s>)</span>}
                            </div>
                            {it.details && <div className="text-gray-700">{it.details}</div>}
                            {it.features?.length > 0 && (
                              <ul className="list-disc list-inside text-gray-500">
                                {it.features.map((f, j) => <li key={j}>{f?.text?.en || "(feature removed)"}</li>)}
                              </ul>
                            )}
                            {it.remarks && <div className="text-xs text-gray-500 italic">Remarks: {it.remarks}</div>}
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
                    <td className="p-3 max-w-52">{linkCell(o, "creativeLink")}</td>
                    <td className="p-3 max-w-52">{linkCell(o, "landingPage")}</td>
                    <td className="p-3 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button type="button" className="text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => { setNotice(""); setOfferModal({ offer: o, readOnly: !canEdit }); }}>
                          {canEdit ? "Edit" : "View"}
                        </button>
                        {canEdit && <button type="button" className="text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => { setNotice(""); setOfferModal({ offer: { state: o.state, languages: o.languages, items: o.items }, readOnly: false }); }}>Duplicate</button>}
                        {canEdit && <button type="button" className="text-red-500 hover:text-red-700 cursor-pointer" onClick={() => onRemove(o)}>Remove</button>}
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
