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

const JobList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.successMessage || "");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

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
                limit: 2,
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
        <div className="p-10">
            {/* Header Section */}
            <div className="flex justify-between items-center pb-4">
                <PageTitle>Artwork Requests</PageTitle>
                <StatusMessageWrapper loading={loading} success={success} error={error} />
                {hasAccess(user?.role, ['marketing_manager','admin','zonal_marketing_manager']) && (
                <Button width="auto" onClick={() => navigate('/create-artwork')}>
                    Add Artwork Re
                </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex justify-between pb-8">
                <div className={`flex gap-4 mb-5 ${error ? "hidden" : ""}`}>
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
            </div>

            {/* Job List */}
            <div className="grid grid-cols-3 gap-8">
                {loading
                    ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />)
                    : error ? (
                        <p className="text-center col-span-3 p-4 text-red-500">{error}</p>
                    ) : jobs.length > 0
                        ? jobs.map((job) => <JobCard key={job._id} job={job} />)
                        : <p className="text-center col-span-3 p-4">No jobs found</p>}
            </div>

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
