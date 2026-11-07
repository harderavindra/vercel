import React, { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Modal from "./Modal";
import Button from "../common/Button";
import { addOffer, updateOffer } from "../../api/campaignsV2Api";
import { getCatalog, getFeatures, getSettings, getZones, getLanguages } from "../../api/mastersApi";
import { MAX_ITEMS, MAX_FEATURES, MIN_PRICE_DIGITS, MAX_PRICE_DIGITS, fmtINR, fmtMonth, validPrice } from "../../utils/campaignV2Flow";

const inputStyle = "border rounded-md px-3 py-2 focus:border-blue-300 focus:outline-0 w-full bg-white disabled:bg-gray-100";
const blankItem = () => ({ brand: "", model: "", hp: "", type: "", offerPrice: "", crossingPrice: "", features: [], details: "", remarks: "" });
const idOf = (v) => (v && typeof v === "object" ? String(v._id) : v ? String(v) : "");

// Offer from the API → form draft (ids as strings, prices as digit strings)
const toDraft = (offer) => ({
  state: offer?.state || "",
  languages: offer?.languages ? [...offer.languages] : [],
  items: offer?.items?.length
    ? offer.items.map((it) => ({
        brand: idOf(it.brand),
        model: idOf(it.model),
        hp: it.hp || "",
        type: it.type || "",
        offerPrice: it.offerPrice ? String(it.offerPrice) : "",
        crossingPrice: it.crossingPrice ? String(it.crossingPrice) : "",
        features: (it.features || []).map(idOf),
        details: it.details || "",
        remarks: it.remarks || "",
      }))
    : [blankItem()],
});

// Same rules as the server (utils/campaignV2Access.js validateOffer), keyed like its fieldErrors
const validate = (d) => {
  const e = {};
  if (!d.state) e.state = "State is required";
  if (!d.languages.length) e.languages = "Select at least one language";
  d.items.forEach((it, i) => {
    const k = (f) => `items.${i}.${f}`;
    if (!it.brand) e[k("brand")] = "Brand is required";
    else if (d.items.some((o, j) => j !== i && o.brand === it.brand)) e[k("brand")] = "Each brand section must be a different brand";
    if (!it.model) e[k("model")] = "Model is required";
    if (!it.hp) e[k("hp")] = "HP is required";
    if (!it.type) e[k("type")] = "Offer type is required";
    if (it.offerPrice && !validPrice(it.offerPrice)) e[k("offerPrice")] = `Enter ${MIN_PRICE_DIGITS}–${MAX_PRICE_DIGITS} digits (₹1,00,000 or more)`;
    if (it.crossingPrice && !validPrice(it.crossingPrice)) e[k("crossingPrice")] = `Enter ${MIN_PRICE_DIGITS}–${MAX_PRICE_DIGITS} digits (₹1,00,000 or more)`;
    if (it.features.length < 1 || it.features.length > MAX_FEATURES) e[k("features")] = `Select 1 to ${MAX_FEATURES} features`;
    if (!it.details.trim()) e[k("details")] = "Offer details are required";
  });
  return e;
};

/**
 * Add / edit / view one offer.
 * campaign: { _id, title, zone, month }. offer: existing offer (edit/view) or null (add).
 * readOnly: view only. onSaved(offer) after a successful save.
 */
const OfferV2Modal = ({ campaign, offer, readOnly = false, onClose, onSaved }) => {
  const [d, setD] = useState(() => toDraft(offer));
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);
  const [featMsg, setFeatMsg] = useState({});
  const [masters, setMasters] = useState({ loading: true, zone: null, languages: [], catalog: [], settings: {} });
  const [featuresByModel, setFeaturesByModel] = useState({}); // modelId → [{ _id, text }]

  useEffect(() => {
    let cancelled = false;
    Promise.all([getZones(), getLanguages(true).catch(() => getLanguages()), getCatalog(), getSettings()])
      .then(([zones, languages, catalog, settings]) => {
        if (!cancelled) setMasters({ loading: false, zone: zones.find((z) => z.name === campaign.zone) || null, languages, catalog, settings });
      })
      .catch((err) => !cancelled && setBanner(err.response?.data?.message || "Could not load the masters"));
    return () => { cancelled = true; };
  }, [campaign.zone]);

  // Load features for every chosen model (cached)
  const modelIds = d.items.map((it) => it.model).filter(Boolean).join(",");
  useEffect(() => {
    modelIds.split(",").filter(Boolean).forEach((id) => {
      if (featuresByModel[id]) return;
      getFeatures(id)
        .then((list) => setFeaturesByModel((prev) => ({ ...prev, [id]: list })))
        .catch(() => setFeaturesByModel((prev) => ({ ...prev, [id]: [] })));
    });
  }, [modelIds, featuresByModel]);

  const activeCodes = useMemo(() => new Set(masters.languages.filter((l) => l.active !== false).map((l) => l.code)), [masters.languages]);
  const langName = (code) => masters.languages.find((l) => l.code === code)?.name || code;
  const zoneState = masters.zone?.states.find((s) => s.name === d.state);
  const stateLanguages = (zoneState?.languages || []).filter((c) => activeCodes.has(c));
  const brandsById = useMemo(() => {
    const m = {};
    masters.catalog.forEach((p) => p.brands.forEach((b) => { m[b._id] = { ...b, product: p.name }; }));
    return m;
  }, [masters.catalog]);

  const clearError = (key) => setErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
  const updateItem = (i, patch) => setD((prev) => ({ ...prev, items: prev.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));

  // Picking a state ticks all of its (active) languages; any can be unticked
  const pickState = (state) => {
    const st = masters.zone?.states.find((s) => s.name === state);
    setD((prev) => ({ ...prev, state, languages: (st?.languages || []).filter((c) => activeCodes.has(c)) }));
    clearError("state");
    clearError("languages");
  };
  const toggleLang = (code, on) => {
    setD((prev) => ({ ...prev, languages: on ? [...prev.languages, code] : prev.languages.filter((c) => c !== code) }));
    clearError("languages");
  };
  // A new brand or model has different features, so ticked ones are cleared
  const setBrand = (i, brand) => { updateItem(i, { brand, model: "", features: [] }); clearError(`items.${i}.brand`); };
  const setModel = (i, model) => { updateItem(i, { model, features: [] }); clearError(`items.${i}.model`); };
  const setField = (i, field, value) => { updateItem(i, { [field]: value }); clearError(`items.${i}.${field}`); };
  const toggleFeature = (i, id, checked) => {
    const it = d.items[i];
    if (checked && it.features.length >= MAX_FEATURES) {
      setFeatMsg((m) => ({ ...m, [i]: `You can select up to ${MAX_FEATURES} features. Untick one to change your choice.` }));
      return;
    }
    setFeatMsg((m) => ({ ...m, [i]: "" }));
    updateItem(i, { features: checked ? [...it.features, id] : it.features.filter((x) => x !== id) });
    clearError(`items.${i}.features`);
  };
  const addBrand = () => setD((prev) => ({ ...prev, items: [...prev.items, blankItem()] }));
  const removeBrand = (i) => {
    setD((prev) => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }));
    setErrors({});
    setFeatMsg({});
  };

  const save = async () => {
    setBanner("");
    const e = validate(d);
    setErrors(e);
    if (Object.keys(e).length) {
      setBanner("Fill the highlighted fields.");
      return;
    }
    // A changed offer sends its state back to the Brand Manager (the server un-approves it)
    const approvedState = [d.state, offer?._id && offer.state].find((s) => s && campaign.approvals?.[s]?.status === "approved");
    if (approvedState && !window.confirm(`${approvedState} is already approved. Saving sends ${approvedState} back to the Brand Manager. Continue?`)) return;
    setSaving(true);
    const body = {
      state: d.state,
      languages: d.languages,
      items: d.items.map((it) => ({ ...it, offerPrice: it.offerPrice || undefined, crossingPrice: it.crossingPrice || undefined })),
    };
    try {
      const saved = offer?._id ? await updateOffer(campaign._id, offer._id, body) : await addOffer(campaign._id, body);
      onSaved(saved);
    } catch (err) {
      const data = err.response?.data || {};
      if (data.fieldErrors && Object.keys(data.fieldErrors).length) {
        setErrors(data.fieldErrors);
        setBanner(data.fieldErrors.items || "Please fix the highlighted fields.");
      } else {
        setBanner(data.message || "Could not save the offer");
      }
    } finally {
      setSaving(false);
    }
  };

  const errClass = (key) => (errors[key] ? "border-red-500" : "border-gray-400");
  const FieldError = ({ k }) => (errors[k] ? <p className="text-red-500 text-xs mt-1">{errors[k]}</p> : null);
  const Label = ({ children, required }) => (
    <span className="font-medium text-sm">{children}{required && !readOnly && <span className="text-red-500"> *</span>}</span>
  );

  const priceInput = (i, field, label) => {
    const v = d.items[i][field];
    const key = `items.${i}.${field}`;
    return (
      <label className="flex flex-col gap-1">
        <Label>{label}</Label>
        <input
          inputMode="numeric"
          disabled={readOnly}
          className={`${inputStyle} ${errClass(key)}`}
          value={v}
          placeholder="e.g. 650000"
          onChange={(e) => setField(i, field, e.target.value.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS))}
        />
        {errors[key] ? <FieldError k={key} /> : <span className="text-gray-500 text-xs min-h-4">{v ? fmtINR(v) : " "}</span>}
      </label>
    );
  };

  const title = readOnly ? "Offer" : offer?._id ? "Edit offer" : offer ? "Duplicate offer" : "Add offer";

  return (
    <Modal
      title={<>
        {title}
        {offer?.code && <span className="ml-2 text-sm font-mono bg-gray-100 border border-gray-300 rounded px-2 py-0.5">{offer.code}</span>}
        <span className="block text-sm font-normal text-gray-500">{campaign.title} · {campaign.zone} · {fmtMonth(campaign.month)}</span>
      </>}
      onClose={onClose}
      maxWidth="max-w-4xl"
      footer={readOnly
        ? <Button width="auto" variant="outline" onClick={onClose}>Close</Button>
        : <>
            <Button width="auto" variant="outline" onClick={onClose}>Cancel</Button>
            <Button width="auto" onClick={save} disabled={saving || masters.loading}>{saving ? "Saving..." : "Save offer"}</Button>
          </>}
    >
      {masters.loading ? (
        <p>{banner || "Loading..."}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* State + languages */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="flex flex-col gap-1">
              <Label required>State</Label>
              <select disabled={readOnly} className={`${inputStyle} ${errClass("state")}`} value={d.state} onChange={(e) => pickState(e.target.value)}>
                <option value="">Select</option>
                {(masters.zone?.states || []).map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                {d.state && !zoneState && <option value={d.state}>{d.state} (not in {campaign.zone})</option>}
              </select>
              <FieldError k="state" />
              {!masters.zone && <p className="text-red-500 text-xs">{campaign.zone} is not in the Zones & States master.</p>}
            </label>
            <div className="sm:col-span-3 flex flex-col gap-1">
              <Label required>Languages</Label>
              <div className={`flex flex-wrap gap-2 min-h-10 items-center rounded-md ${errors.languages ? "border border-red-500 p-2" : ""}`}>
                {!d.state ? (
                  <span className="text-gray-500 text-sm">Select a state first</span>
                ) : stateLanguages.length ? (
                  stateLanguages.map((code) => {
                    const on = d.languages.includes(code);
                    return (
                      <label key={code} className={`flex items-center gap-2 py-1 px-3 rounded-md border text-sm cursor-pointer ${on ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-gray-300"}`}>
                        <input type="checkbox" disabled={readOnly} checked={on} onChange={(e) => toggleLang(code, e.target.checked)} />
                        {langName(code)}
                      </label>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm">No languages set for {d.state} in Zones & States.</span>
                )}
              </div>
              <FieldError k="languages" />
            </div>
          </div>

          {/* Brand sections */}
          {d.items.map((it, i) => {
            const otherBrand = d.items[1 - i]?.brand;
            const brand = brandsById[it.brand];
            const features = it.model ? featuresByModel[it.model] : null;
            const k = (f) => `items.${i}.${f}`;
            return (
              <section key={i} className="border border-blue-300/60 rounded-xl p-4 flex flex-col gap-4">
                <header className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {d.items.length > 1 ? `Brand ${i + 1}` : "Brand"}
                    {brand && <span className="text-gray-500 font-normal"> · {brand.name}</span>}
                  </h3>
                  {!readOnly && i > 0 && (
                    <button type="button" onClick={() => removeBrand(i)} title="Remove this brand" aria-label={`Remove brand ${i + 1}`} className="text-gray-500 hover:text-red-500 cursor-pointer">
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="flex flex-col gap-1">
                    <Label required>Brand</Label>
                    <select disabled={readOnly} className={`${inputStyle} ${errClass(k("brand"))}`} value={it.brand} onChange={(e) => setBrand(i, e.target.value)}>
                      <option value="">Select</option>
                      {masters.catalog.filter((p) => p.brands.length).map((p) => (
                        <optgroup key={p._id} label={p.name}>
                          {p.brands.filter((b) => b._id !== otherBrand).map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <FieldError k={k("brand")} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label required>Model</Label>
                    <select disabled={readOnly || !it.brand} className={`${inputStyle} ${errClass(k("model"))}`} value={it.model} onChange={(e) => setModel(i, e.target.value)}>
                      <option value="">{it.brand ? "Select" : "Select a brand first"}</option>
                      {(brand?.models || []).map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    <FieldError k={k("model")} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label required>HP Segment</Label>
                    <select disabled={readOnly} className={`${inputStyle} ${errClass(k("hp"))}`} value={it.hp} onChange={(e) => setField(i, "hp", e.target.value)}>
                      <option value="">Select</option>
                      {(masters.settings.hpSegments || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <FieldError k={k("hp")} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label required>Offer Type</Label>
                    <select disabled={readOnly} className={`${inputStyle} ${errClass(k("type"))}`} value={it.type} onChange={(e) => setField(i, "type", e.target.value)}>
                      <option value="">Select</option>
                      {(masters.settings.offerTypes || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <FieldError k={k("type")} />
                  </label>
                  {priceInput(i, "offerPrice", "Offer Price (₹)")}
                  {priceInput(i, "crossingPrice", "Crossing Price (₹)")}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label required>Features (up to {MAX_FEATURES}, shown in English)</Label>
                    <div className={`border rounded-md p-3 flex flex-col gap-2 max-h-48 overflow-y-auto ${errors[k("features")] ? "border-red-500" : "border-gray-300"}`}>
                      {!it.model ? (
                        <span className="text-gray-500 text-sm">Select a model first</span>
                      ) : !features ? (
                        <span className="text-gray-500 text-sm">Loading features...</span>
                      ) : features.filter((f) => f.text?.en || it.features.includes(f._id)).length === 0 ? (
                        <span className="text-gray-500 text-sm">No features for this model. Add them in Masters → Offer Features.</span>
                      ) : (
                        features.filter((f) => f.text?.en || it.features.includes(f._id)).map((f) => (
                          <label key={f._id} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input type="checkbox" className="mt-1" disabled={readOnly} checked={it.features.includes(f._id)} onChange={(e) => toggleFeature(i, f._id, e.target.checked)} />
                            {f.text?.en || "(no English text)"}
                          </label>
                        ))
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{it.features.length} of {MAX_FEATURES} selected</span>
                    {featMsg[i] && <p className="text-red-500 text-xs">{featMsg[i]}</p>}
                    <FieldError k={k("features")} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1">
                      <Label required>Offer Details</Label>
                      <textarea rows={3} disabled={readOnly} className={`${inputStyle} ${errClass(k("details"))}`} value={it.details} onChange={(e) => setField(i, "details", e.target.value)} />
                      <FieldError k={k("details")} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <Label>Remarks for Brand Manager</Label>
                      <textarea rows={2} disabled={readOnly} className={`${inputStyle} border-gray-400`} value={it.remarks} onChange={(e) => setField(i, "remarks", e.target.value)} />
                    </label>
                  </div>
                </div>
              </section>
            );
          })}

          {!readOnly && d.items.length < MAX_ITEMS && (
            <button type="button" onClick={addBrand} className="self-start flex items-center gap-2 border border-dashed border-gray-400 rounded-md px-4 py-2 text-gray-700 hover:border-red-400 hover:text-red-500 cursor-pointer">
              <FiPlus /> Add another brand
            </button>
          )}
          {banner && <p className="text-red-500">{banner}</p>}
        </div>
      )}
    </Modal>
  );
};

export default OfferV2Modal;
