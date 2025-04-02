import { format, formatDistanceToNowStrict, differenceInHours, differenceInDays, differenceInWeeks, differenceInMinutes } from "date-fns";

export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A"; // Handle null/undefined cases
  const date = new Date(dateString);
  if (isNaN(date)) return "Invalid Date"; // Handle invalid date formats

  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
};

export const formatDateDistance = (dateString) => {
  if (!dateString) return { relative: "N/A", formatted: "N/A" };

  const date = new Date(dateString);
  if (isNaN(date)) return { relative: "Invalid Date", formatted: "Invalid Date" };

  let relativeTime;
  const minutes = differenceInMinutes(new Date(), date);
  const hours = differenceInHours(new Date(), date);
  const days = differenceInDays(new Date(), date);
  const weeks = differenceInWeeks(new Date(), date);

  if (minutes < 60) {
    relativeTime = `${minutes}m ago`;
  } else if (hours < 24) {
    relativeTime = `${hours}h ago`;
  } else if (days < 7) {
    relativeTime = `${days}d ago`;
  } else {
    relativeTime = `${weeks}w ago`;
  }

  return {
    relative: relativeTime,
    formatted: format(date, "dd MMM yyyy, hh:mm a"),
  };
};

export const formatShortDateTime = (dateString) => {
  if (!dateString) return "N/A"; 

  const date = new Date(dateString);
  if (isNaN(date)) return "Invalid Date";

  return format(date, "dd MMM, h:mm a"); // Example: 24 Mar, 6:41 PM
};