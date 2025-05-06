import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiGrid, FiStar, FiUserPlus } from "react-icons/fi";
import Pagination from "../components/common/Pagination";
import BrandCard from "../components/brand/BrandCard";
import SearchInput from "../components/user/SearchInput";
import Button from "../components/common/Button";
import DropdownFilter from "../components/user/DropdownFilter";
import { BRAND_TREASURY_DOCUMENTS, LANGUAGES } from "../utils/constants";
import StatusMessage from "../components/common/StatusMessage";
import MultiSelect from "../components/common/MultiSelect";
import axios from "axios";
import PageTitle from "../components/common/PageTitle";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import { hasAccess } from "../utils/permissions";
import { useAuth } from "../context/auth-context";

const BrandTreasuryList = () => {
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(1);
  const [documentType, setDocumentType] = useState("");
  const [starred, setStarred] = useState(false);
  const [myDocuments, setMyDocuments] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
  
      // Clear the message after a delay (optional)
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
  
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Brand Treasury Documents
  const fetchTreasuries = useCallback(async () => {
    setLoading(true);
    setError(""); // Clear previous error messages

    try {
      console.log(selectedLanguages, 'selectedLanguages')
      const params = {
        page, limit: 12, documentType, starred, myDocuments, search: debouncedSearch, languages: selectedLanguages.join(",")
      };
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/`, {

        params,
        withCredentials: true,
      });
      setDocuments(data?.data || []);
      setPagination(data?.pagination || { currentPage: 1, totalPages: 1 });
      setDocumentTypes(data.usedDocumentTypes || []);

    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch documents.");
      console.error(" Error fetching brand treasury data:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [page, documentType, starred, myDocuments, debouncedSearch, selectedLanguages]);

  useEffect(() => {
    if (debouncedSearch.length < 3 && debouncedSearch.length > 0) return;
    fetchTreasuries();
  }, [fetchTreasuries]);

  // Clear Filters
  const clearFilters = useCallback(() => {
    setDocumentType("");
    setSearch("");
    setPage(1);
    setSelectedLanguages([])
  }, []);

  // Memoized Filter Options
  const documentOptions = useMemo(() => Object.entries(BRAND_TREASURY_DOCUMENTS).map(([key, value]) => ({
    value,
    label: key.replace("_", " "),
  })), []);

  return (
    <div className="flex justify-between items-stretch min-h-full gap-10">
      {/* Left Content */}
      <div className="w-full p-3 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-3">
          <PageTitle>Brand Treasury</PageTitle>
          <StatusMessageWrapper loading={loading} success={success} error={error} />
          {hasAccess(user?.role, ['marketing_manager', 'admin', 'zonal_marketing_manager']) && (
            <Button width="auto" onClick={() => navigate('/create-brand-treasury')}>
              Add Brand Treasury
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className={`flex  justify-between ${selectedLanguages.length > 0
          ? 'pb-10' : 'pb-0'}`}>
          <div className={`flex flex-col sm:flex-row gap-4 mb-5 ${error ? "hidden" : ""}`}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by name (min 3 chars)"
            />
            <DropdownFilter
              options={{
                label: "Document Type",
                items: documentTypes.map((doc) => ({
                  value: doc.toLowerCase(),
                  label: doc
                }))
              }}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value.toLowerCase())}
              onClear={() => setDocumentType("")}
            />
            <MultiSelect
              options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
              selected={selectedLanguages}
              onChange={setSelectedLanguages}
            />
            <button
              className="border border-blue-300 bg-blue-50 rounded-md px-3 text-blue-600"
              onClick={clearFilters}
            >
              Clear All
            </button>
          </div>
       
        </div>


        {/* Status Messages */}
        <div className="flex flex-col items-center">
          {success && <StatusMessage variant="success">{success}</StatusMessage>}
          {error && <StatusMessage variant="failure">{error}</StatusMessage>}
        </div>

        {/* Documents List */}
        <div>
          {loading ? (
            <div className="grid grid-cols-4 gap-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <BrandCard key={i} loading />
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
              {documents.map((doc) => (
                <BrandCard key={doc._id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="py-2 px-3 bg-blue-100 border border-blue-400 rounded-lg text-blue-600">Brand Treasury is currently empty.</p>
            </div>
          )}
        </div>
      

        {/* Pagination */}
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
      </div>

      {/* Sidebar Filters */}
      <div className="bg-white shadow-md min-w-[40px] px-2 py-3 hidden sm:block">
      <button
          className={`flex flex-col gap-1 items-center py-2 px-3 text-xs w-full cursor-pointer ${!myDocuments &&  !starred ? "text-red-500" : ""}`}
          onClick={() => { setMyDocuments(false); setStarred(false); setPage(1); }}
        >
          <FiGrid size={18} /> All
        </button>
        <button
          className={`flex flex-col gap-1 items-center py-2 px-3 text-xs w-full cursor-pointer ${starred ? "text-red-500" : ""}`}
          onClick={() => { setStarred(true); setMyDocuments(false); setPage(1); }}
        >
          <FiStar size={18} /> Starred
        </button>
        <button
          className={`flex flex-col gap-1 items-center py-2 px-3 text-xs w-full cursor-pointer ${myDocuments ? "text-red-500" : ""}`}
          onClick={() => { setMyDocuments(true); setStarred(false); setPage(1); }}
        >
          <FiUserPlus size={18} /> My
        </button>
       
      </div>
    </div>
  );
};

export default BrandTreasuryList;
