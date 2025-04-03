import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/common/Button";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import PageTitle from "../components/common/PageTitle";
import JobCard from "../components/job/JobCard";
import LoadingCard from "../components/job/LoadingCard";
import axios from "axios";

const JobList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.successMessage || "");
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        let isMounted = true; // Prevents state update if component unmounts

        const fetchJobs = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs`,  { withCredentials: true });
                if (isMounted) setJobs(data);
            } catch (error) {
                if (isMounted) setError("Failed to load jobs.");
                console.error("Error fetching jobs:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchJobs();

        return () => {
            isMounted = false; // Cleanup function to prevent memory leaks
        };
    }, []);

    return (
        <div className="p-10">
            {/* Header Section */}
            <div className="flex justify-between items-center pb-4">
                <PageTitle>Artwork Requests</PageTitle>
                <StatusMessageWrapper loading={loading} success={success} error={error} />
                <Button width="auto" onClick={() => navigate('/create-artwork')}>Add Artwork</Button>
            </div>

            {/* Job List */}
            <div className="grid grid-cols-3 gap-8">
                {loading
                    ? Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />)
                    : jobs.length > 0
                        ? jobs.map(job => <JobCard key={job._id} job={job} />)
                        : <p className="text-center col-span-3 p-4">No jobs found</p>}
            </div>
        </div>
    );
};

export default JobList;