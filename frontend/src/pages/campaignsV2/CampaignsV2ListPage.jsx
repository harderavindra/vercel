import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { listCampaigns } from "../../api/campaignsV2Api";
import { getZones } from "../../api/mastersApi";
import Button from "../../components/common/Button";
import Pagination from "../../components/common/Pagination";
import StatusPill from "../../components/campaignsV2/StatusPill";
import CampaignV2Modal from "../../components/campaignsV2/CampaignV2Modal";
import { STATUS, ROLE, fmtMonth, fmtDateTime, userName, waitingOn, canCreateCampaign } from "../../utils/campaignV2Flow";

const PAGE_SIZE = 10;
const selectStyle = "border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0 bg-white";

const CampaignsV2ListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isZmm = user?.role === ROLE.ZMM;
  const [filters, setFilters] = useState({ status: "", zone: "", month: "", q: "" });
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => { getZones().then(setZones).catch(() => setZones([])); }, []);

  // Search is applied after typing pauses
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim() })), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listCampaigns(filters)
      .then((data) => { if (!cancelled) { setCampaigns(data); setPage(1); } })
      .catch((err) => !cancelled && setError(err.response?.data?.message || "Could not load campaigns"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const rows = useMemo(() => campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [campaigns, page]);
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          {isZmm && <p className="text-gray-500 text-sm mt-1">{user.zone ? `Showing ${user.zone} campaigns.` : "Your user has no zone yet. Ask an admin to set it."}</p>}
        </div>
        {canCreateCampaign(user) && (
          <Button width="auto" onClick={() => setCreating(true)} className="flex items-center gap-2">
            <FiPlus /> New campaign
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            className={`${selectStyle} pl-9 w-64`}
            placeholder="Search title or offer code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search campaigns"
          />
        </div>
        <select className={selectStyle} value={filters.status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        <select
          className={selectStyle}
          value={isZmm ? user.zone || "" : filters.zone}
          disabled={isZmm}
          onChange={(e) => setFilter("zone", e.target.value)}
          aria-label="Zone"
        >
          <option value="">All zones</option>
          {zones.map((z) => <option key={z._id} value={z.name}>{z.name}</option>)}
        </select>
        <input type="month" className={selectStyle} value={filters.month} onChange={(e) => setFilter("month", e.target.value)} aria-label="Month" />
        {filtered && (
          <button type="button" className="text-sm text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => { setSearch(""); setFilters({ status: "", zone: "", month: "", q: "" }); }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-200 bg-white">
          <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
            <tr>
              <th className="p-3">Campaign</th>
              <th className="p-3">Zone · Month</th>
              <th className="p-3">Offers</th>
              <th className="p-3">Status</th>
              <th className="p-3">Waiting on</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading campaigns...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="p-4 text-center text-red-500">{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  {filtered ? "No campaigns match these filters." : canCreateCampaign(user) ? "No campaigns yet. Use New campaign to start one." : "No campaigns yet."}
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c._id} className="border-b border-gray-200 hover:bg-gray-50 align-top">
                  <td className="p-3">
                    <Link to={`/campaigns-v2/${c._id}`} className="font-semibold hover:text-red-500">{c.title}</Link>
                    {c.description && <p className="text-gray-500 text-sm line-clamp-1">{c.description}</p>}
                    {c.createdBy && <p className="text-gray-400 text-xs">by {userName(c.createdBy)}</p>}
                  </td>
                  <td className="p-3 whitespace-nowrap">{c.zone} · {fmtMonth(c.month)}</td>
                  <td className="p-3">
                    {c.offerCount}
                    {c.states?.length > 0 && <p className="text-gray-500 text-xs">{c.states.join(", ")}</p>}
                  </td>
                  <td className="p-3"><StatusPill status={c.status} /></td>
                  <td className="p-3 text-sm">{waitingOn(c).join(", ") || "—"}</td>
                  <td className="p-3 text-sm text-gray-500 whitespace-nowrap">{fmtDateTime(c.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {creating && (
        <CampaignV2Modal user={user} onClose={() => setCreating(false)} onCreated={(c) => navigate(`/campaigns-v2/${c._id}`)} />
      )}
    </div>
  );
};

export default CampaignsV2ListPage;
