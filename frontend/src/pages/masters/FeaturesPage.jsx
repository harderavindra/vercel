import React, { useEffect, useState } from "react";
import { FiEdit2, FiFileText, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import {
  getCatalog, getLanguages, getFeatures, createFeature, updateFeatureText, deleteFeature,
} from "../../api/mastersApi";
import MastersTabs from "../../components/masters/MastersTabs";
import Button from "../../components/common/Button";

const ADMIN_ROLES = ["admin", "master_admin"];
const ENGLISH = { code: "en", name: "English" };
const selectStyle = "border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0 bg-white disabled:bg-gray-100";

// Modal to add or edit one language's text of a feature
const TextModal = ({ lang, initial, english, isNew, busy, onClose, onSave }) => {
  const [text, setText] = useState(initial);
  const [error, setError] = useState(false);

  const save = () => {
    if (!text.trim()) {
      setError(true);
      return;
    }
    onSave(text.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-md w-full max-w-lg p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-lg">{isNew ? "Add feature" : "Edit feature"} · {lang.name}</h2>
        {lang.code !== "en" && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-gray-500 text-sm">English</p>
            <p>{english || "—"}</p>
          </div>
        )}
        <label className="flex flex-col gap-1">
          <span className="font-medium">{lang.name} text <span className="text-red-500">*</span></span>
          <textarea
            autoFocus
            rows={4}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(false); }}
            className={`border rounded-md px-3 py-2 focus:border-blue-300 focus:outline-0 ${error ? "border-red-500" : "border-gray-400"}`}
          />
        </label>
        {error && <p className="text-red-500 text-sm">Enter the text, or use Close to leave it unchanged.</p>}
        <div className="flex justify-end gap-2">
          <Button width="auto" variant="outline" onClick={onClose}>Close</Button>
          <Button width="auto" onClick={save} disabled={busy}>Save</Button>
        </div>
      </div>
    </div>
  );
};

const FeaturesPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [catalog, setCatalog] = useState([]);
  const [languages, setLanguages] = useState([]); // active languages
  const [productId, setProductId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [features, setFeatures] = useState(null); // null = no model selected
  const [loading, setLoading] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { featureId: string|null, lang }

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [cat, langs] = await Promise.all([getCatalog(), getLanguages()]);
        setCatalog(cat);
        setLanguages(langs);
        if (cat.length) setProductId(cat[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!modelId) {
      setFeatures(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingFeatures(true);
      setError("");
      try {
        const data = await getFeatures(modelId);
        if (!cancelled) setFeatures(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load features");
      } finally {
        if (!cancelled) setLoadingFeatures(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [modelId]);

  const product = catalog.find((p) => p._id === productId);
  const brand = product?.brands.find((b) => b._id === brandId);
  const model = brand?.models.find((m) => m._id === modelId);
  const english = languages.find((l) => l.code === "en") || ENGLISH;
  const others = languages.filter((l) => l.code !== "en");
  const editingFeature = editing?.featureId ? features?.find((f) => f._id === editing.featureId) : undefined;

  const replaceFeature = (updated) => setFeatures((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));

  const run = async (fn, fallbackMessage) => {
    setError("");
    setSaving(true);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || fallbackMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveText = async (text) => {
    const { featureId, lang } = editing;
    const ok = await run(async () => {
      if (featureId) {
        replaceFeature(await updateFeatureText(featureId, lang.code, text));
      } else {
        const created = await createFeature(modelId, text);
        setFeatures((prev) => [...prev, created]);
      }
    }, "Failed to save feature");
    if (ok) setEditing(null);
  };

  const removeFeature = (f) => {
    if (!window.confirm(`Delete the feature "${f.text.en || "(no English text)"}" in all languages?`)) return;
    run(async () => {
      await deleteFeature(f._id);
      setFeatures((prev) => prev.filter((x) => x._id !== f._id));
    }, "Failed to delete feature");
  };

  const removeText = (f, lang) => {
    if (!window.confirm(`Delete the ${lang.name} text of this feature? Offers in ${lang.name} will show the English text instead.`)) return;
    run(async () => replaceFeature(await updateFeatureText(f._id, lang.code, "")), "Failed to delete text");
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <MastersTabs />
      <div>
        <h1 className="font-semibold text-2xl">Offer Features</h1>
        <p className="text-gray-500 text-sm mt-1">
          Features / customer benefits per brand and model. Each feature has its English text and an optional
          translation per language.
          {!canEdit && " View only. Only admins can change these."}
        </p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-6 p-8 bg-white border border-blue-300/60 rounded-xl shadow-md">
            <label className="flex flex-col gap-1 w-full">
              <span className="font-medium">Product Category</span>
              <select
                className={selectStyle}
                value={productId}
                onChange={(e) => { setProductId(e.target.value); setBrandId(""); setModelId(""); }}
              >
                {catalog.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 w-full">
              <span className="font-medium">Brand Category</span>
              <select
                className={selectStyle}
                value={brandId}
                disabled={!product?.brands.length}
                onChange={(e) => { setBrandId(e.target.value); setModelId(""); }}
              >
                <option value="">{product?.brands.length ? "Select brand" : "No brands yet"}</option>
                {product?.brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 w-full">
              <span className="font-medium">Model Category</span>
              <select
                className={selectStyle}
                value={modelId}
                disabled={!brand?.models.length}
                onChange={(e) => setModelId(e.target.value)}
              >
                <option value="">{!brand ? "Select brand first" : brand.models.length ? "Select model" : "No models yet"}</option>
                {brand?.models.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-4 p-8 bg-white border border-blue-300/60 rounded-xl shadow-md">
            {!model ? (
              <p className="text-gray-500">Select a brand and a model to see its features.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <h2 className="font-semibold text-lg">{brand.name} · {model.name}</h2>
                  {canEdit && (
                    <Button width="auto" onClick={() => setEditing({ featureId: null, lang: english })} disabled={saving || loadingFeatures}>
                      Add feature
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-gray-200">
                    <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
                      <tr>
                        <th className="p-3 w-10">#</th>
                        <th className="p-3 w-1/3">English</th>
                        <th className="p-3">Other languages</th>
                        {canEdit && <th className="p-3 w-24" />}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingFeatures ? (
                        <tr><td colSpan={canEdit ? 4 : 3} className="p-4 text-center text-gray-500">Loading features...</td></tr>
                      ) : features?.length ? (
                        features.map((f, i) => (
                          <tr key={f._id} className="border-b border-gray-200 align-top">
                            <td className="p-3">{i + 1}</td>
                            <td className="p-3">{f.text.en || <span className="text-gray-400">(no English text)</span>}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                {others.map((l) => {
                                  const text = f.text[l.code];
                                  return (
                                    <span
                                      key={l.code}
                                      className={`flex items-center gap-1 py-1 px-2 rounded-md border text-sm ${text ? "bg-white border-gray-300" : "bg-gray-50 border-dashed border-gray-300 text-gray-400"}`}
                                    >
                                      {l.name}
                                      {text && (
                                        <span title={text} aria-label={`${l.name} text: ${text}`} className="text-blue-500 cursor-help">
                                          <FiFileText />
                                        </span>
                                      )}
                                      {canEdit && (
                                        <button
                                          type="button"
                                          title={`${text ? "Edit" : "Add"} ${l.name} text`}
                                          aria-label={`${text ? "Edit" : "Add"} ${l.name} text`}
                                          onClick={() => setEditing({ featureId: f._id, lang: l })}
                                          className="cursor-pointer text-gray-500 hover:text-red-500"
                                        >
                                          <FiEdit2 />
                                        </button>
                                      )}
                                      {canEdit && text && (
                                        <button
                                          type="button"
                                          title={`Delete ${l.name} text`}
                                          aria-label={`Delete ${l.name} text`}
                                          onClick={() => removeText(f, l)}
                                          className="cursor-pointer text-gray-500 hover:text-red-500"
                                        >
                                          <FiTrash2 />
                                        </button>
                                      )}
                                    </span>
                                  );
                                })}
                                {!others.length && <span className="text-gray-400">No other languages in the Languages master.</span>}
                              </div>
                            </td>
                            {canEdit && (
                              <td className="p-3 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  title="Edit English text"
                                  aria-label="Edit English text"
                                  onClick={() => setEditing({ featureId: f._id, lang: english })}
                                  className="cursor-pointer text-gray-600 hover:text-red-500 p-1"
                                >
                                  <FiEdit2 size={18} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete feature"
                                  aria-label="Delete feature"
                                  onClick={() => removeFeature(f)}
                                  className="cursor-pointer text-gray-600 hover:text-red-500 p-1"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={canEdit ? 4 : 3} className="p-4 text-center text-gray-500">No features for this model yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {editing && (
        <TextModal
          key={`${editing.featureId}-${editing.lang.code}`}
          lang={editing.lang}
          isNew={!editing.featureId}
          initial={editingFeature?.text[editing.lang.code] ?? ""}
          english={editingFeature?.text.en ?? ""}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={saveText}
        />
      )}
    </div>
  );
};

export default FeaturesPage;
