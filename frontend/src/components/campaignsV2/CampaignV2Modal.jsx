import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "../common/Button";
import { createCampaign, updateCampaign, duplicateCampaign } from "../../api/campaignsV2Api";
import { getZones } from "../../api/mastersApi";
import { ROLE } from "../../utils/campaignV2Flow";

const inputStyle = "border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0 w-full";
const thisMonth = () => new Date().toISOString().slice(0, 7);

const MODES = {
  create: { title: "New campaign", button: "Create campaign", busy: "Creating...", fail: "Could not create the campaign" },
  edit: { title: "Edit campaign", button: "Save changes", busy: "Saving...", fail: "Could not save the campaign" },
  duplicate: { title: "Duplicate campaign", button: "Duplicate", busy: "Duplicating...", fail: "Could not duplicate the campaign" },
};

// mode "create": title, description, month. A ZMM's zone is fixed to their own; an admin picks the zone.
// mode "edit": change title, description, month of `campaign` (zone stays).
// mode "duplicate": new draft in the ZMM's own zone with copies of `campaign`'s offers.
// onCreated(campaign) is called with the created / saved campaign.
const CampaignV2Modal = ({ user, mode = "create", campaign, onClose, onCreated }) => {
  const m = MODES[mode];
  const isAdmin = mode === "create" && [ROLE.ADMIN, ROLE.MASTER_ADMIN].includes(user?.role);
  const [title, setTitle] = useState(mode === "duplicate" ? `Copy of ${campaign.title}` : campaign?.title || "");
  const [description, setDescription] = useState(campaign?.description || "");
  const [month, setMonth] = useState(campaign?.month || thisMonth());
  const [zone, setZone] = useState(mode === "edit" ? campaign.zone : isAdmin ? "" : user?.zone || "");
  const [zones, setZones] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) getZones().then(setZones).catch(() => setZones([]));
  }, [isAdmin]);

  const save = async () => {
    const e = { title: !title.trim(), month: !/^\d{4}-\d{2}$/.test(month), zone: !zone };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    setError("");
    try {
      const fields = { title: title.trim(), description: description.trim(), month };
      const saved = mode === "edit"
        ? await updateCampaign(campaign._id, fields)
        : mode === "duplicate"
          ? await duplicateCampaign(campaign._id, fields)
          : await createCampaign({ ...fields, ...(isAdmin ? { zone } : {}) });
      onCreated(saved);
    } catch (err) {
      setError(err.response?.data?.message || m.fail);
    } finally {
      setSaving(false);
    }
  };

  const label = (text, required) => (
    <span className="font-medium">{text}{required && <span className="text-red-500"> *</span>}</span>
  );

  return (
    <Modal
      title={m.title}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={<>
        <Button width="auto" variant="outline" onClick={onClose}>Cancel</Button>
        <Button width="auto" onClick={save} disabled={saving}>{saving ? m.busy : m.button}</Button>
      </>}
    >
      <div className="flex flex-col gap-4">
        {mode === "duplicate" && <p className="text-gray-600 text-sm">The new draft gets copies of all {campaign.offers?.length || 0} offers with new codes. Artwork, comments and links are not copied.</p>}
        <label className="flex flex-col gap-1">
          {label("Title", true)}
          <input autoFocus className={`${inputStyle} ${errors.title ? "border-red-500" : ""}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali tractor offers" />
        </label>
        <label className="flex flex-col gap-1">
          {label("Description")}
          <textarea rows={3} className={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1 w-full">
            {label("Zone", true)}
            {isAdmin ? (
              <select className={`${inputStyle} bg-white ${errors.zone ? "border-red-500" : ""}`} value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">Select zone</option>
                {zones.map((z) => <option key={z._id} value={z.name}>{z.name}</option>)}
              </select>
            ) : (
              <input className={`${inputStyle} bg-gray-100`} value={zone || "No zone set for your user"} disabled />
            )}
          </label>
          <label className="flex flex-col gap-1 w-full">
            {label("Month", true)}
            <input type="month" className={`${inputStyle} ${errors.month ? "border-red-500" : ""}`} value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
        </div>
        {Object.values(errors).some(Boolean) && <p className="text-red-500 text-sm">Title, zone and month are required.</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Modal>
  );
};

export default CampaignV2Modal;
