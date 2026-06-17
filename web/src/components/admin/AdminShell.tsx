"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import {
  ADMIN_NAV_SECTIONS,
  ADMIN_MODULES,
  getAdminModulesBySection,
  type AdminModule,
} from "@/lib/admin-modules";
import { formatHeadingCase } from "@/lib/sentence-case";

function statusBadge(status?: AdminModule["status"]) {
  if (status === "working") return "bg-emerald-100 text-emerald-800";
  if (status === "partial") return "bg-amber-100 text-amber-900";
  if (status === "streamlit") return "bg-violet-100 text-violet-900";
  return "bg-zinc-100 text-zinc-600";
}

function statusLabel(status?: AdminModule["status"]) {
  if (status === "working") return "Live";
  if (status === "partial") return "Partial";
  if (status === "streamlit") return "Streamlit";
  return "Planned";
}

function moduleHref(module: AdminModule): string {
  if (module.href) return module.href;
  return `/admin/modules/${module.slug}`;
}

function isModuleActive(pathname: string, module: AdminModule): boolean {
  if (module.href) return pathname === module.href || pathname.startsWith(`${module.href}/`);
  return pathname === `/admin/modules/${module.slug}`;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_10rem,#f4f4f5_100%)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="safe-top shrink-0 border-b border-teal-100 bg-teal-950 text-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400 lg:hidden" aria-hidden />
          <div className="border-b border-white/10 px-4 py-4">
            <BrpLogoLink href="/admin/dashboard" variant="dark" className="block" />
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-teal-200/90">
              {formatHeadingCase("Admin console")}
            </p>
          </div>
          <nav className="nav-scroll max-h-[40vh] overflow-y-auto px-2 py-3 lg:max-h-[calc(100vh-7rem)] lg:py-4" aria-label="Admin modules">
            <div className="space-y-5">
              {ADMIN_NAV_SECTIONS.map((section) => {
                const modules = getAdminModulesBySection(section.id);
                if (modules.length === 0) return null;

                return (
                  <div key={section.id}>
                    <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300/80">
                      {section.label}
                    </p>
                    <ul className="space-y-0.5">
                      {modules.map((module) => {
                        const active = isModuleActive(pathname, module);
                        const href = moduleHref(module);
                        const external = Boolean(module.externalHref);

                        return (
                          <li key={module.slug}>
                            <Link
                              href={href}
                              target={external ? "_blank" : undefined}
                              rel={external ? "noopener noreferrer" : undefined}
                              className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                                active
                                  ? "bg-teal-700 text-white shadow-sm"
                                  : "text-teal-50/90 hover:bg-white/10 hover:text-white"
                              }`}
                              aria-current={active ? "page" : undefined}
                            >
                              <span className="min-w-0 flex-1 leading-snug">{module.label}</span>
                              {module.status ? (
                                <span
                                  className={`mt-0.5 hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide xl:inline ${statusBadge(module.status)}`}
                                >
                                  {statusLabel(module.status)}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </nav>
          <div className="border-t border-white/10 px-4 py-4">
            <Link href="/" className="block text-sm text-teal-100/80 transition hover:text-white">
              ← Public site
            </Link>
            <form action="/api/admin/logout" method="post" className="mt-2">
              <button
                type="submit"
                className="text-sm font-medium text-amber-200 transition hover:text-amber-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-teal-100 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
              Belize Research Panel
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Registration, sample selection, and panel management for public opinion polling, market research, and
              governance studies.
            </p>
          </header>
          <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
