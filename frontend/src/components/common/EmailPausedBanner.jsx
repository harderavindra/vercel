import React, { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "../../context/auth-context";
import { getEmailStatus } from "../../api/mastersApi";

const ADMIN_ROLES = ["admin", "master_admin"];

// Admins only: a bar saying app emails are paused (backend env var EMAIL_PAUSED=true).
// Renders nothing for other roles, when emails are on, or if the status can't be loaded.
const EmailPausedBanner = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    getEmailStatus().then((s) => setPaused(!!s?.paused)).catch(() => setPaused(false));
  }, [isAdmin]);

  if (!isAdmin || !paused) return null;
  return (
    <div role="status" className="w-full max-w-3xl flex gap-3 items-start bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-5 py-4 shadow-sm">
      <FiAlertTriangle size={22} className="shrink-0 mt-0.5" />
      <p>
        <strong>Emails are paused.</strong> No emails are being sent from the app, including password reset links.
        To resume, remove <code className="bg-amber-100 px-1 rounded">EMAIL_PAUSED</code> from the backend&apos;s Vercel environment variables and redeploy.
      </p>
    </div>
  );
};

export default EmailPausedBanner;
