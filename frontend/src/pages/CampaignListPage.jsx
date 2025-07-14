import { useEffect, useState } from "react";
import axios from "axios";
import PageTitle from "../components/common/PageTitle";
import SearchInput from "../components/common/SearchInput";
import Pagination from "../components/common/Pagination";
import LoadingCard from "../components/job/LoadingCard";
import CampaignTableRow from "../components/common/CampaignTableRow";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import Button from "../components/common/Button";
import { useNavigate } from "react-router-dom";
import { ZONES } from "../utils/constants";
import DropdownFilter from "../components/user/DropdownFilter";

const CampaignListPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const navigate = useNavigate()
  const [zone, setZone] = useState("");
  const clearFilters = () => {
    setSearch("");
    setZone("");
    setPriority("");
    setPage(1);
  };


  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/campaigns`, {
          params: {
            page,
            search: search.length >= 3 ? search : "",
            zone
          },
          withCredentials: true,
        });

        setCampaigns(data.campaigns || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
        });
        console.log(data.campaigns)
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || "Something went wrong");
      }

      setLoading(false);
    };

    fetchCampaigns();
  }, [search, page,zone]);

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 gap-4">
        <PageTitle>Lead Gen Campaigns</PageTitle>
        <StatusMessageWrapper
          loading={loading}
          error={error}
        />
        <Button width="auto" type="button" onClick={() => navigate('/create-campaign')} >Create Campaign</Button>
      </div>

      <div className={`flex flex-col sm:flex-row gap-4 mb-3  ${error ? "hidden" : ""}`}>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by name (min 3 chars)"
        />
        <DropdownFilter
          options={{
            label: "Zone",
            items: Object.entries(ZONES).map(([key, states]) => ({
              value: key,      // "Zone1"
              label: key       // or use a more readable label if needed
            }))
          }}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          onClear={() => setZone("")}
        />
        <button className="border border-blue-300 bg-blue-50 rounded-md px-3 text-blue-600 cursor-pointer" onClick={clearFilters}>
          Clear All
        </button>
      </div>

      <div className="flex justify-center">
        <div className="overflow-x-auto w-full bg-white shadow-md rounded-lg">
          <table className="w-full text-left border border-gray-200">
            <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Type</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} type="table" />)
              ) : error ? (
                <tr><td colSpan="6" className="p-4 text-center text-red-500">{error}</td></tr>
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <CampaignTableRow key={campaign._id} campaign={campaign} />
                ))
              ) : (
                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No campaigns found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default CampaignListPage;
