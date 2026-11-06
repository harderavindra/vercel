import React, { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import {
  getZones, createZone, updateZone, deleteZone,
  addState, updateState, deleteState, loadDefaultZones, getLanguages,
} from "../../api/mastersApi";
import ChipRow from "../../components/masters/ChipRow";
import MastersTabs from "../../components/masters/MastersTabs";
import RenameForm from "../../components/masters/RenameForm";
import Button from "../../components/common/Button";

const ADMIN_ROLES = ["admin", "master_admin"];

const RenameButton = ({ label, onClick }) => (
  <div className="border-t border-gray-200 pt-4">
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-gray-600 hover:text-red-500 cursor-pointer">
      <FiEdit2 /> Rename {label}
    </button>
  </div>
);

const ZonesPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [zones, setZones] = useState([]);
  const [languages, setLanguages] = useState([]); // all languages, used to show names for codes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoneId, setZoneId] = useState(null);
  const [stateName, setStateName] = useState("");
  const [renaming, setRenaming] = useState(null); // null | "zone" | "state"

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [zoneData, langData] = await Promise.all([getZones(), getLanguages(true).catch(() => getLanguages())]);
        setZones(zoneData);
        setLanguages(langData);
        if (zoneData.length) setZoneId(zoneData[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load zones");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const zone = zones.find((z) => z._id === zoneId) || zones[0];
  const state = zone?.states.find((s) => s.name === stateName);
  const activeLanguages = languages.filter((l) => l.active !== false);
  const langName = (code) => languages.find((l) => l.code === code)?.name || code;
  const langCode = (name) => languages.find((l) => l.name === name)?.code;
  const stateLanguageNames = state ? state.languages.map(langName) : [];
  const stateCount = zones.reduce((n, z) => n + z.states.length, 0);

  const replaceZone = (updated) => setZones((prev) => prev.map((z) => (z._id === updated._id ? updated : z)));

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

  // ---- Zones ----
  const selectZone = (name) => {
    const z = zones.find((x) => x.name === name);
    if (!z) return;
    setZoneId(z._id);
    setStateName("");
    setRenaming(null);
  };

  const handleAddZone = (name) => {
    if (zones.some((z) => z.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists`);
      return false;
    }
    return run(async () => {
      const created = await createZone(name);
      setZones((prev) => [...prev, created]);
      setZoneId(created._id);
      setStateName("");
    }, "Failed to add zone");
  };

  const handleRemoveZone = (name) => {
    const z = zones.find((x) => x.name === name);
    if (!z) return;
    const msg = `Delete "${name}" and its ${z.states.length} state(s)? Existing campaigns keep the zone name they were saved with.`;
    if (!window.confirm(msg)) return;
    run(async () => {
      await deleteZone(z._id);
      const rest = zones.filter((x) => x._id !== z._id);
      setZones(rest);
      if (zone?._id === z._id) {
        setZoneId(rest[0]?._id || null);
        setStateName("");
      }
    }, "Failed to delete zone");
  };

  const handleRenameZone = async (name) => {
    const ok = await run(async () => replaceZone(await updateZone(zone._id, { name })), "Failed to rename zone");
    if (ok) setRenaming(null);
  };

  // ---- States ----
  const handleAddState = (name) =>
    run(async () => {
      replaceZone(await addState(zone._id, { name }));
      setStateName(name);
    }, "Failed to add state");

  const handleRemoveState = (name) => {
    if (!window.confirm(`Delete state "${name}" from ${zone.name}? Existing offers keep the state they were saved with.`)) return;
    run(async () => {
      replaceZone(await deleteState(zone._id, name));
      if (stateName === name) setStateName("");
    }, "Failed to delete state");
  };

  const handleRenameState = async (name) => {
    const ok = await run(async () => {
      replaceZone(await updateState(zone._id, state.name, { name }));
      setStateName(name);
    }, "Failed to rename state");
    if (ok) setRenaming(null);
  };

  // ---- State languages (order matters: first = default) ----
  const saveLanguages = (codes) =>
    run(async () => replaceZone(await updateState(zone._id, state.name, { languages: codes })), "Failed to update languages");

  const handleAddLanguage = (name) => {
    const code = langCode(name);
    if (!code) return false;
    return saveLanguages([...state.languages, code]);
  };

  const handleRemoveLanguage = (name) => {
    const code = langCode(name) || name;
    saveLanguages(state.languages.filter((c) => c !== code));
  };

  const handleMakeDefault = (name) => {
    const code = langCode(name);
    if (!code || state.languages[0] === code) return;
    saveLanguages([code, ...state.languages.filter((c) => c !== code)]);
  };

  const handleLoadDefaults = () =>
    run(async () => {
      const data = await loadDefaultZones();
      setZones(data.zones);
      if (data.zones.length) setZoneId(data.zones[0]._id);
    }, "Failed to load default zones");

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <MastersTabs />
      <div>
        <h1 className="font-semibold text-2xl">Zones & States</h1>
        <p className="text-gray-500 text-sm mt-1">
          Each zone has its states, and each state has the languages its offers can use. The first language (in red) is
          the state&apos;s default.
          {canEdit ? " Click another language to make it the default." : " View only. Only admins can change these."}
          {!loading && ` ${stateCount} states in ${zones.length} zones.`}
        </p>
      </div>

      {loading ? (
        <p>Loading zones...</p>
      ) : (
        <>
          <ChipRow
            label="Zone"
            items={zones.map((z) => z.name)}
            selected={zone?.name}
            onSelect={selectZone}
            onRemove={canEdit ? handleRemoveZone : undefined}
            onAdd={canEdit ? handleAddZone : undefined}
            placeholder="New zone"
            empty="No zones yet."
            busy={saving}
          >
            {canEdit && zone && (renaming === "zone" ? (
              <RenameForm key={zone._id} current={zone.name} busy={saving} onSave={handleRenameZone} onCancel={() => setRenaming(null)} />
            ) : (
              <RenameButton label={zone.name} onClick={() => setRenaming("zone")} />
            ))}
          </ChipRow>

          {zone && (
            <ChipRow
              label="State"
              items={zone.states.map((s) => s.name)}
              selected={state?.name}
              onSelect={(name) => { setStateName(name === stateName ? "" : name); setRenaming(null); }}
              onRemove={canEdit ? handleRemoveState : undefined}
              onAdd={canEdit ? handleAddState : undefined}
              placeholder="New state"
              empty={`No states in ${zone.name} yet.`}
              busy={saving}
            >
              {canEdit && state && (renaming === "state" ? (
                <RenameForm key={state.name} current={state.name} busy={saving} onSave={handleRenameState} onCancel={() => setRenaming(null)} />
              ) : (
                <RenameButton label={state.name} onClick={() => setRenaming("state")} />
              ))}
            </ChipRow>
          )}

          {state ? (
            <ChipRow
              label={`Languages · ${state.name}`}
              items={stateLanguageNames}
              selected={stateLanguageNames[0]}
              onSelect={canEdit ? handleMakeDefault : undefined}
              onRemove={canEdit ? handleRemoveLanguage : undefined}
              onAdd={canEdit ? handleAddLanguage : undefined}
              addOptions={activeLanguages.filter((l) => !state.languages.includes(l.code)).map((l) => l.name)}
              placeholder="Add language"
              empty="No languages yet, so no offers can be created for this state."
              busy={saving}
            />
          ) : (
            zone && zone.states.length > 0 && (
              <ChipRow label="Languages" items={[]} empty="Select a state to see its languages." />
            )
          )}

          {canEdit && zones.length === 0 && (
            <div className="self-start flex flex-col gap-2">
              <Button width="auto" onClick={handleLoadDefaults} disabled={saving}>
                Load default zones (5 zones, 21 states)
              </Button>
              {activeLanguages.length === 0 && (
                <p className="text-gray-500 text-sm">Tip: load the default languages first, so states get their languages.</p>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default ZonesPage;
