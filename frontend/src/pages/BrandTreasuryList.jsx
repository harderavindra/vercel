import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import Pagination from "../components/common/Pagination";
import BrandCard from "../components/brand/BrandCard";
import SearchInput from "../components/user/SearchInput";
import Button from "../components/common/Button";
import DropdownFilter from "../components/user/DropdownFilter";
import { BRAND_TREASURY_DOCUMENTS, LANGUAGES } from "../utils/constants";
import StatusMessage from "../components/common/StatusMessage";
import MultiSelect from "../components/common/MultiSelect";
import axios from "axios";

const BrandTreasuryList = () => {
  const navigate = useNavigate();

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
        page, limit: 4, documentType, starred, myDocuments, search: debouncedSearch, languages: selectedLanguages.join(",")
      };
       const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/`, {
      
        params,
        withCredentials: true,
      });
      console.log(data.data,'api/brand-treasury/')
      setDocuments(data?.data || []);
      setPagination(data?.pagination || { currentPage: 1, totalPages: 1 });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch documents.");
      console.error("❌ Error fetching brand treasury data:", error.response?.data || error.message);
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
      <div className="w-full p-10">
        <div className="flex justify-between py-3">
          <h1 className="text-3xl font-semibold">Brand Treasury</h1>
        </div>

        {/* Filters */}
        {/* <div className={`flex justify-between ${selectedLanguages.length > 0
          ? 'pb-10' : 'pb-0'}`}>
          <div className={`flex gap-4 mb-5 ${error ? "hidden" : ""}`}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by name (min 3 chars)"
            />
            <DropdownFilter
              options={BRAND_TREASURY_DOCUMENTS}
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
          <div>
            <Button onClick={() => navigate("/add-brand-treasury")}>Add</Button>
          </div>
        </div> */}


        {/* Status Messages */}
        <div className="flex flex-col items-center">
          {success && <StatusMessage variant="success">{success}</StatusMessage>}
          {error && <StatusMessage variant="failure">{error}</StatusMessage>}
        </div>

        {/* Documents List */}
        <div className="grid grid-cols-4 gap-10">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <BrandCard key={i} loading />)
            : documents.length > 0
              ? documents.map((doc) => <BrandCard key={doc._id} document={doc} />)
              : <p>No documents found.</p>
          }
        </div>

        {/* Pagination */}
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
      </div>

      {/* Sidebar Filters */}
      <div className="bg-white shadow-md w-[220px]">
        <button
          className={`flex gap-2 items-center py-2 px-3 text-lg ${starred ? "text-red-500" : ""}`}
          onClick={() => { setStarred(true); setMyDocuments(false); setPage(1); }}
        >
          <FiStar size={24} /> Starred
        </button>
        <button
          className={`flex gap-2 items-center py-2 px-3 text-lg ${myDocuments ? "text-red-500" : ""}`}
          onClick={() => { setMyDocuments(true); setStarred(false); setPage(1); }}
        >
          <FiStar size={24} /> My Documents
        </button>
        <button
          className="flex gap-2 items-center py-2 px-3 text-lg"
          onClick={() => { setMyDocuments(false); setStarred(false); setPage(1); }}
        >
          <FiStar size={24} /> All Documents
        </button>
      </div>
    </div>
  );
};

export default BrandTreasuryList;
