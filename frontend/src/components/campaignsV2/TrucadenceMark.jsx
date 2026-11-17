import React from "react";

// "TRUCADENCE" brand word for the Campaigns v2 headings: logo red (#E21936), uppercase, heavy and spaced like the logo.
const TrucadenceMark = ({ className = "" }) => (
  <span className={`uppercase font-black tracking-wider text-[#E21936] ${className}`}>Trucadence</span>
);

export default TrucadenceMark;
