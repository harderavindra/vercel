import React from "react";
import { NavLink } from "react-router-dom";

// Tabs across the top of every /masters/* page. Add new masters pages here.
const MASTERS_TABS = [
  { to: "/masters/settings", label: "Settings" },
  { to: "/masters/languages", label: "Languages" },
  { to: "/masters/zones", label: "Zones & States" },
  { to: "/masters/brands", label: "Brand & Model" },
  { to: "/masters/features", label: "Offer Features" },
];

const MastersTabs = () => (
  <div className="flex gap-2 flex-wrap border-b border-gray-300">
    {MASTERS_TABS.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `px-4 py-2 -mb-px border-b-2 font-semibold ${isActive ? "border-red-500 text-red-500" : "border-transparent text-gray-700 hover:text-red-500"}`
        }
      >
        {label}
      </NavLink>
    ))}
  </div>
);

export default MastersTabs;
