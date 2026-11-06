import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import { getLanguages, addLanguage, deleteLanguage, loadDefaultLanguages } from "../../api/mastersApi";
import ChipCard from "../../components/masters/ChipCard";
import MastersTabs from "../../components/masters/MastersTabs";
import Button from "../../components/common/Button";

const ADMIN_ROLES = ["admin", "master_admin"];

const LanguagesPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setLanguages(await getLanguages());
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load languages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const findByName = (name) => languages.find((l) => l.name === name);

  const handleAdd = async (name) => {
    setError("");
    if (languages.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists`);
      return false;
    }
    setSaving(true);
    try {
      const created = await addLanguage(name);
      setLanguages((prev) => [...prev, created]);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add language");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (name) => {
    const language = findByName(name);
    if (!language) return;
    if (!window.confirm(`Delete language "${name}"?`)) return;
    setError("");
    setSaving(true);
    try {
      await deleteLanguage(language._id);
      setLanguages((prev) => prev.filter((l) => l._id !== language._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete language");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDefaults = async () => {
    setError("");
    setSaving(true);
    try {
      const data = await loadDefaultLanguages();
      setLanguages(data.languages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load default languages");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <MastersTabs />
      <div>
        <h1 className="font-semibold text-2xl">Languages</h1>
        <p className="text-gray-500 text-sm mt-1">
          Languages an offer can be created in. English cannot be deleted.
          {!canEdit && " View only. Only admins can change this list."}
        </p>
      </div>

      {loading ? (
        <p>Loading languages...</p>
      ) : (
        <>
          <ChipCard
            title="Languages"
            items={languages.map((l) => l.name)}
            addPlaceholder="New language"
            emptyText="No languages yet."
            busy={saving}
            onAdd={canEdit ? handleAdd : undefined}
            onRemove={canEdit ? handleRemove : undefined}
            canRemove={(name) => findByName(name)?.code !== "en"}
          />
          {canEdit && languages.length === 0 && (
            <div className="w-auto self-start">
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
