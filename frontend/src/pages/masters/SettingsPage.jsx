import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import { getSettings, updateSetting } from "../../api/mastersApi";
import ChipCard from "../../components/masters/ChipCard";

const ADMIN_ROLES = ["admin", "master_admin"];

const SETTING_CARDS = [
  { key: "hpSegments", title: "HP Segments", placeholder: "e.g. 21-30 HP" },
  { key: "offerTypes", title: "Offer Types", placeholder: "e.g. Special Price Offer" },
  { key: "agencyStatuses", title: "Agency Statuses", placeholder: "e.g. Accepted" },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [settings, setSettings] = useState({ hpSegments: [], offerTypes: [], agencyStatuses: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save the full list for one key; returns true on success
  const save = async (key, values) => {
    setError("");
    setSaving(true);
    try {
      const data = await updateSetting(key, values);
      setSettings((prev) => ({ ...prev, [key]: data.values }));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addValue = (key, value) => {
    const current = settings[key] || [];
    if (current.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" already exists`);
      return false;
    }
    return save(key, [...current, value]);
  };

  const removeValue = (key, value) => {
    if (!window.confirm(`Remove "${value}"?`)) return;
    save(key, (settings[key] || []).filter((v) => v !== value));
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        {!canEdit && <p className="text-gray-500 text-sm mt-1">View only. Only admins can change these lists.</p>}
      </div>

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        SETTING_CARDS.map(({ key, title, placeholder }) => (
          <ChipCard
            key={key}
            title={title}
            items={settings[key] || []}
            addPlaceholder={placeholder}
            busy={saving}
            onAdd={canEdit ? (value) => addValue(key, value) : undefined}
            onRemove={canEdit ? (value) => removeValue(key, value) : undefined}
          />
        ))
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default SettingsPage;
