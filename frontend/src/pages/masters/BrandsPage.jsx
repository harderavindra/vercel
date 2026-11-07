import React, { useCallback, useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { hasAccess } from "../../utils/permissions";
import {
  getCatalog, createBrand, renameBrand, deleteBrand,
  createModel, renameModel, deleteModel,
} from "../../api/mastersApi";
import ChipRow from "../../components/masters/ChipRow";
import MastersTabs from "../../components/masters/MastersTabs";
import RenameForm from "../../components/masters/RenameForm";

const ADMIN_ROLES = ["admin", "master_admin"];

const RenameButton = ({ label, onClick }) => (
  <div className="border-t border-gray-200 pt-4">
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-gray-600 hover:text-red-500 cursor-pointer">
      <FiEdit2 /> Rename {label}
    </button>
  </div>
);

// Brand & Model master. Works on the same product/brand/model categories as /masterdata,
// Jobs and Brand Treasury, so renames keep the same ids and used items can't be deleted.
const BrandsPage = () => {
  const { user } = useAuth();
  const canEdit = hasAccess(user?.role, ADMIN_ROLES);

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [modelId, setModelId] = useState(null); // model selected for renaming
  const [renamingBrand, setRenamingBrand] = useState(false);

  const reload = useCallback(async () => {
    const data = await getCatalog();
    setCatalog(data);
    return data;
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await reload();
        if (data.length) setProductId(data[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load brands and models");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, reload]);

  const product = catalog.find((p) => p._id === productId) || catalog[0];
  const brand = product?.brands.find((b) => b._id === brandId);
  const model = brand?.models.find((m) => m._id === modelId);
  const brandByName = (name) => product?.brands.find((b) => b.name === name);
  const modelByName = (name) => brand?.models.find((m) => m.name === name);

  // Runs an API call, then reloads the catalog; returns true on success
  const run = async (fn, fallbackMessage) => {
    setError("");
    setSaving(true);
    try {
      await fn();
      await reload();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || fallbackMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ---- Product ----
  const selectProduct = (name) => {
    const p = catalog.find((x) => x.name === name);
    if (!p) return;
    setProductId(p._id);
    setBrandId(null);
    setModelId(null);
    setRenamingBrand(false);
  };

  // ---- Brands ----
  const selectBrand = (name) => {
    const b = brandByName(name);
    setBrandId(b && b._id !== brandId ? b._id : null);
    setModelId(null);
    setRenamingBrand(false);
  };

  const handleAddBrand = (name) => {
    if (product.brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists in ${product.name}`);
      return false;
    }
    return run(async () => {
      const created = await createBrand(name, product._id);
      setBrandId(created._id);
    }, "Failed to add brand");
  };

  const handleRemoveBrand = (name) => {
    const b = brandByName(name);
    if (!b || !window.confirm(`Delete brand "${name}"?`)) return;
    run(async () => {
      await deleteBrand(b._id);
      if (brandId === b._id) setBrandId(null);
    }, "Failed to delete brand");
  };

  const handleRenameBrand = async (name) => {
    const ok = await run(() => renameBrand(brand._id, name), "Failed to rename brand");
    if (ok) setRenamingBrand(false);
  };

  // ---- Models ----
  const selectModel = (name) => {
    const m = modelByName(name);
    setModelId(m && m._id !== modelId ? m._id : null);
  };

  const handleAddModel = (name) => {
    if (brand.models.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" already exists for ${brand.name}`);
      return false;
    }
    return run(() => createModel(name, brand._id), "Failed to add model");
  };

  const handleRemoveModel = (name) => {
    const m = modelByName(name);
    if (!m || !window.confirm(`Delete model "${name}"?`)) return;
    run(async () => {
      await deleteModel(m._id);
      if (modelId === m._id) setModelId(null);
    }, "Failed to delete model");
  };

  const handleRenameModel = async (name) => {
    const ok = await run(() => renameModel(model._id, name), "Failed to rename model");
    if (ok) setModelId(null);
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-10">
      <MastersTabs />
      <div>
        <h1 className="font-semibold text-2xl">Brand & Model</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pick a product category, then a brand, to see and manage its models. Brands and models used by artworks,
          brand treasury or documents cannot be deleted, but can be renamed.
          {canEdit ? " Click a model to rename it." : " View only. Only admins can change these."}
        </p>
      </div>

      {loading ? (
        <p>Loading brands and models...</p>
      ) : (
        <>
          <ChipRow
            label="Product Category"
            items={catalog.map((p) => p.name)}
            selected={product?.name}
            onSelect={selectProduct}
            empty="No product categories."
          />

          {product && (
            <ChipRow
              label="Brand Category"
              items={product.brands.map((b) => b.name)}
              selected={brand?.name}
              onSelect={selectBrand}
              onRemove={canEdit ? handleRemoveBrand : undefined}
              onAdd={canEdit ? handleAddBrand : undefined}
              placeholder="New brand"
              empty={`No brands under ${product.name} yet.`}
              busy={saving}
            >
              {canEdit && brand && (renamingBrand ? (
                <RenameForm key={brand._id} current={brand.name} busy={saving} onSave={handleRenameBrand} onCancel={() => setRenamingBrand(false)} />
              ) : (
                <RenameButton label={brand.name} onClick={() => setRenamingBrand(true)} />
              ))}
            </ChipRow>
          )}

          {brand ? (
            <ChipRow
              label="Model Category"
              items={brand.models.map((m) => m.name)}
              selected={model?.name}
              onSelect={canEdit ? selectModel : undefined}
              onRemove={canEdit ? handleRemoveModel : undefined}
              onAdd={canEdit ? handleAddModel : undefined}
              placeholder="New model"
              empty={`No models for ${brand.name} yet.`}
              busy={saving}
            >
              {canEdit && model && (
                <RenameForm key={model._id} current={model.name} busy={saving} onSave={handleRenameModel} onCancel={() => setModelId(null)} />
              )}
            </ChipRow>
          ) : (
            product && product.brands.length > 0 && (
              <ChipRow label="Model Category" items={[]} empty="Select a brand to see its models." />
            )
          )}
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default BrandsPage;
