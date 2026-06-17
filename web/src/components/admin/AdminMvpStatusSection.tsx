import { MVP_MODULE_CHECKLIST } from "@/lib/admin-modules";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminMvpStatusSection() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Handoff</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">
          {formatHeadingCase("MVP status & handoff checklist")}
        </h1>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Core working modules")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2 font-semibold">Module</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {MVP_MODULE_CHECKLIST.map((row) => (
                <tr key={row.module} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-3 font-medium text-zinc-900">{row.module}</td>
                  <td className="px-3 py-3 text-zinc-600">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Before developer handoff")}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
          <li>Confirm registration saves every field correctly to panelists.csv</li>
          <li>Confirm duplicate blocking works for email, phone, name + DOB, and ID fragment</li>
          <li>Confirm Admin Dashboard edit, filter, duplicate review, and export all work</li>
          <li>Confirm Panelist Login displays correct profile information</li>
          <li>Confirm sample size calculator uses filtered panel count correctly</li>
          <li>Decide which concept modules should become working modules first</li>
          <li>Prepare requirements.txt and clean folder structure</li>
          <li>Replace CSV storage with PostgreSQL or another production database</li>
          <li>Move admin password and secrets out of source code</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">
          {formatHeadingCase("Recommended next production priorities")}
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-teal-900/90">
          <li>Stabilize Registration + Admin Dashboard</li>
          <li>Convert CSV database to PostgreSQL</li>
          <li>Add secure authentication and roles</li>
          <li>Build survey distribution properly</li>
          <li>Build rewards tracking properly</li>
          <li>Add automated backups</li>
          <li>Prepare pilot launch</li>
        </ol>
      </section>
    </div>
  );
}
