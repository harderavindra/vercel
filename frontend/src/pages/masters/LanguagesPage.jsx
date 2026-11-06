import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import { getLanguages, addLanguage, updateLanguage, loadDefaultLanguages } from "../../api/mastersApi";
import ChipRow from "../../components/masters/ChipRow";
import MastersTabs from "../../components/masters/MastersTabs";
import Button from "../../components/common/Button";

const ADMIN_ROLES = ["admin", "master_admin"];

const LanguagesPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [languages, setLanguages] = useState([]); // admins: active + inactive; others: active only
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // name of the language being renamed
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        setLanguages(await getLanguages(canEdit));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load languages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, canEdit]);

  const active = languages.filter((l) => l.active !== false);
  const inactive = languages.filter((l) => l.active === false);
  const findByName = (name) => languages.find((l) => l.name === name);

  const replaceLanguage = (updated) =>
    setLanguages((prev) => prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)));

  // Runs an API call with the saving flag and error handling; returns true on success
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

  const handleAdd = (name) => {
    const existing = languages.find((l) => l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setError(existing.active === false ? `"${existing.name}" was removed. Restore it below instead.` : `"${name}" already exists`);
      return false;
    }
    return run(async () => {
      const created = await addLanguage(name);
      setLanguages((prev) => [...prev, created]);
    }, "Failed to add language");
  };

  const handleRemove = (name) => {
    const language = findByName(name);
    if (!language || !window.confirm(`Remove language "${name}"? It can be restored later.`)) return;
    run(async () => {
      replaceLanguage(await updateLanguage(language._id, { active: false }));
      if (selected === name) setSelected(null);
    }, "Failed to remove language");
  };

  const handleRestore = (name) => {
    const language = findByName(name);
    if (!language || !window.confirm(`Restore language "${name}"?`)) return;
    run(async () => replaceLanguage(await updateLanguage(language._id, { active: true })), "Failed to restore language");
  };

  const handleSelect = (name) => {
    if (selected === name) {
      setSelected(null);
      return;
    }
    setSelected(name);
    setNewName(name);
    setError("");
  };

  const handleRename = async (e) => {
    e.preventDefault();
    const language = findByName(selected);
    const name = newName.trim();
    if (!language || !name || name === language.name) return;
    const ok = await run(async () => replaceLanguage(await updateLanguage(language._id, { name })), "Failed to rename language");
    if (ok) setSelected(null);
  };

  const handleLoadDefaults = () =>
    run(async () => {
      const data = await loadDefaultLanguages();
      setLanguages(data.languages);
    }, "Failed to load default languages");

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <MastersTabs />
      <div>
        <h1 className="font-semibold text-2xl">Languages</h1>
        <p className="text-gray-500 text-sm mt-1">
          Languages an offer can be created in. English cannot be removed.
          {canEdit ? " Click a language to rename it." : " View only. Only admins can change this list."}
        </p>
      </div>

      {loading ? (
        <p>Loading languages...</p>
      ) : (
        <>
          <ChipRow
            label="Languages"
            items={active.map((l) => l.name)}
            selected={selected}
            onSelect={canEdit ? handleSelect : undefined}
            onRemove={canEdit ? handleRemove : undefined}
            canRemove={(name) => findByName(name)?.code !== "en"}
            onAdd={canEdit ? handleAdd : undefined}
            placeholder="New language"
            empty="No languages yet."
            busy={saving}
          >
            {canEdit && selected && (
              <form onSubmit={handleRename} className="flex flex-wrap gap-2 items-center border-t border-gray-200 pt-4">
                <span className="text-gray-600">Rename <b>{selected}</b> to</span>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border border-gray-300 px-4 py-2 rounded-md"
                />
                <button
                  type="submit"
                  disabled={saving || !newName.trim() || newName.trim() === selected}
                  className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md cursor-pointer"
                  onClick={() => setSelected(null)}
                ><FiX /></button>
              </form>
            )}
          </ChipRow>

          {canEdit && inactive.length > 0 && (
            <ChipRow
              label="Removed"
              items={inactive.map((l) => l.name)}
              onSelect={handleRestore}
              empty=""
              busy={saving}
            >
              <p className="text-gray-500 text-sm">Click a removed language to restore it.</p>
            </ChipRow>
          )}

          {canEdit && languages.length === 0 && (
            <div className="self-start">
              <Button width="auto" onClick={handleLoadDefaults} disabled={saving}>
                Load default languages (12)
              </Button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default LanguagesPage;
