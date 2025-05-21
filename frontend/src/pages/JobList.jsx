import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/common/Button";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import PageTitle from "../components/common/PageTitle";
import JobCard from "../components/job/JobCard";
import LoadingCard from "../components/job/LoadingCard";
import SearchInput from "../components/common/SearchInput";
import Pagination from "../components/common/Pagination";
import DropdownFilter from "../components/common/DropdownFilter";
import MultiSelect from "../components/common/MultiSelect";

import { PRIORITY, LANGUAGES } from "../utils/constants";
import axios from "axios";
import { hasAccess } from "../utils/permissions";
import { useAuth } from "../context/auth-context";
import { FiGrid, FiList, FiTable } from "react-icons/fi";
import JobTableRow from "../components/job/JobTableRow";
import { useSticky } from "../hooks/useSticky";

const JobList = () => {
      const { ref, isSticky } = useSticky();

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.successMessage || "");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [currentView, setCurrentView] = useState("table");

    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [priority, setPriority] = useState("");
    const [selectedLanguages, setSelectedLanguages] = useState([]);

    const [jobs, setJobs] = useState([]);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(handler);
    }, [search]);

    // Reset page when search or filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, priority, selectedLanguages]);

    // Clear error on search/filter change
    useEffect(() => {
        setError("");
    }, [debouncedSearch, priority]);

    // Fetch jobs
    const fetchJobs = useCallback(async () => {
        if (debouncedSearch.length > 0 && debouncedSearch.length < 3) {


            setSuccess("Please type at least 3 characters to search");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const params = {
                page,
                limit: 12,
                search: debouncedSearch,
                priority,
                languages: selectedLanguages.join(",")
            };
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs`, {
                params,
                withCredentials: true,
            });
            setJobs(data?.data || []);
            setPagination(data?.pagination || { currentPage: 1, totalPages: 1 });
            setError("");
            setSuccess("Artwork loaded successfully");
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setError(error.response?.data?.message || "Failed to fetch jobs.");
            setSuccess(""); // clear stale success
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, priority, selectedLanguages]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);


    // Clear Filters
    const clearFilters = useCallback(() => {
        setPriority("");
        setSearch("");
        setSelectedLanguages([])
        setPage(1);
    }, []);

    // Priority options
    const priorityOptions = useMemo(() => {
        console.log
        return Object.entries(PRIORITY).map(([key, value]) => ({
            value,
            label: key.replace("_", " "),
        }));
    }, []);


    return (
        <div className="p-4 sm:p-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4">
                <PageTitle>Artwork Requests</PageTitle>
                <StatusMessageWrapper loading={loading} success={success} error={error} />
                {hasAccess(user?.role, ['marketing_manager', 'admin', 'zonal_marketing_manager']) && (
                    <Button width="auto" onClick={() => navigate('/create-artwork')}>
                        Add Artwork Request
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div  ref={ref} 
             className={`flex items-start justify-between py-2 px-4 mb-8 rounded-lg border border-gray-200 sticky top-0 bg-white z-10 transition-shadow duration-300 ease-in-out ${
        isSticky ? 'shadow-lg' : 'shadow-none'
      }`}
            >
                <div className={`flex flex-col sm:flex-row gap-4 mb-0 ${error ? "hidden" : ""}`}>
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Search by name (min 3 chars)"
                    />
                    <DropdownFilter
                        options={{ label: "Priority", items: priorityOptions }}
                        value={priority}
                        onChange={(e) => setPriority(e.target.value.toLowerCase())}
                        onClear={() => setPriority("")}
                    />
                    <MultiSelect
                        options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                        selected={selectedLanguages}
                        onChange={setSelectedLanguages}
                    />
                    <button className="border border-blue-300 bg-blue-50 rounded-md px-3 text-blue-600 cursor-pointer" onClick={clearFilters}>
                        Clear All
                    </button>

                </div>
                <div className={`flex  items-center border border-gray-400 rounded-lg px-0 overflow-hidden`}>
                    <button
                        className={`px-4 py-2 border-r border-gray-400 cursor-pointer ${currentView === 'table' ? 'bg-white' : 'bg-gray-50 opacity-30'}`}
                        onClick={() => {
                            setCurrentView('table');
                            setPage(1);
                        }}
                    ><FiList size={18} /></button>
                    <button
                        className={`px-4 py-2 cursor-pointer ${currentView === 'grid' ? 'bg-white' : 'bg-gray-50 opacity-30'}`}
                        onClick={() => {
                            setCurrentView('grid');
                            setPage(1);
                        }}
                    ><FiGrid size={18} /></button>
                </div>
            </div>
{ currentView   === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {loading
                    ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />)
                    : error ? (
                        <p className="text-center col-span-3 p-4 text-red-500">{error}</p>
                    ) : jobs.length > 0
                        ? jobs.map((job) => <JobCard key={job._id} job={job} />)
                        : <p className="text-center col-span-3 p-4">No Artwork found</p>}
            </div>
            )}
{
                currentView === 'table' && (
               
            <div className="flex justify-center ">
                <div className="overflow-x-auto w-full bg-white shadow-md rounded-lg overflow-hiddenx">
                    <table className="w-full text-left border border-gray-200">
                        <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
                            <tr>
                                <th className="p-3 ">Title</th>
                                <th className="p-3 ">Created By</th>
                                <th className="p-3 ">Priority</th>
                                <th className="p-3 ">Type</th>
                                <th className="p-3 ">Location</th>
                                <th className="p-3 ">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                    ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} type={"table"} />)
                    : error ? (
                        <p className="text-center col-span-3 p-4 text-red-500">{error}</p>
                    ) : jobs.length > 0
                        ?
                            jobs.map((job) => (
                                <JobTableRow key={job._id} job={job} />
                            )):(<p>No Artwork found</p>)
                            }
                        </tbody>
                    </table>
                </div>
            </div>
             )
}

            {/* Pagination */}
            <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default JobList;
