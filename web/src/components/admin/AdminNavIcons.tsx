import type { ReactNode } from "react";
import type { AdminModule } from "@/lib/admin-modules";

function IconBase({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  panelists: (
    <IconBase>
      <path strokeLinecap="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  ),
  "admin-dashboard": (
    <IconBase>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </IconBase>
  ),
  "under-review": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
    </IconBase>
  ),
  notifications: (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </IconBase>
  ),
  payouts: (
    <IconBase>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M2 10h20" />
      <path strokeLinecap="round" d="M6 15h2" />
    </IconBase>
  ),
  "fraud-prevention": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </IconBase>
  ),
  "sample-selection": (
    <IconBase>
      <path strokeLinecap="round" d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
    </IconBase>
  ),
  campaigns: (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M7 21h10M9 15h6" />
    </IconBase>
  ),
  "create-campaign": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </IconBase>
  ),
  "survey-distribution": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="m22 2-7 20-4-9-9-4 20-7Z" />
    </IconBase>
  ),
  "advanced-analytics": (
    <IconBase>
      <path strokeLinecap="round" d="M3 3v18h18" />
      <path strokeLinecap="round" d="M7 16l4-4 4 4 5-6" />
    </IconBase>
  ),
  "distribution-engine": (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
      <path strokeLinecap="round" d="M2 12h20" />
    </IconBase>
  ),
  "external-data-import": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5M12 15V3" />
    </IconBase>
  ),
  "client-project-management": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect x="2" y="8" width="20" height="12" rx="2" />
    </IconBase>
  ),
  "financial-revenue": (
    <IconBase>
      <path strokeLinecap="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </IconBase>
  ),
  "client-reporting": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path strokeLinecap="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </IconBase>
  ),
  "communication-notifications": (
    <IconBase>
      <path strokeLinecap="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
      <path strokeLinecap="round" d="m22 6-10 7L2 6" />
    </IconBase>
  ),
  "fieldwork-management": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  ),
  "data-protection": (
    <IconBase>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
  ),
  "user-roles": (
    <IconBase>
      <path strokeLinecap="round" d="M15.5 7.5 19 4M19 4l-3.5 3.5M19 4v4" />
      <path strokeLinecap="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path strokeLinecap="round" d="M19 15v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2" />
    </IconBase>
  ),
  "backup-recovery": (
    <IconBase>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path strokeLinecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path strokeLinecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </IconBase>
  ),
  "system-settings": (
    <IconBase>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </IconBase>
  ),
  "api-integrations": (
    <IconBase>
      <path strokeLinecap="round" d="M12 22v-5M9 8V2M15 8V2M6 12H2M22 12h-4M7 19l-3 3M20 16l-3 3M7 5 4 2M20 8l-3-3" />
    </IconBase>
  ),
  "deployment-production": (
    <IconBase>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.05-2.91a2.18 2.18 0 0 0-2.91-.05Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </IconBase>
  ),
};

export function AdminNavIcon({ module }: { module: AdminModule }) {
  const icon = ICONS[module.slug] ?? (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
    </IconBase>
  );

  return <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center opacity-90">{icon}</span>;
}
