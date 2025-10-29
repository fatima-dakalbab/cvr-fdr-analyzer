import React, { useMemo, useState } from "react";
import { Download, FileText, Info, Layers, Sparkles } from "lucide-react";

const cases = [
  {
    caseNumber: "AAI-UAE-2025-001",
    caseName: "Dubai Creek Runway Excursion",
    module: "CVR & FDR",
    status: "Complete",
    lead: "Eng. Ahmed Al Mansoori",
    lastUpdated: "2025-06-03",
    summary:
      "Combined CVR/FDR analysis indicates pilot distraction and late braking response under tailwind conditions.",
  },
  {
    caseNumber: "AAI-UAE-2025-004",
    caseName: "Sharjah Desert UAV Incident",
    module: "FDR",
    status: "In Progress",
    lead: "Dr. Hessa Al Suwaidi",
    lastUpdated: "2025-05-28",
    summary:
      "Preliminary FDR study highlights repeated loss of uplink signal and erratic control surface inputs.",
  },
  {
    caseNumber: "AAI-UAE-2025-009",
    caseName: "Abu Dhabi Mid-Air Near Miss",
    module: "CVR",
    status: "Pending Review",
    lead: "Capt. Khalid Al Hameli",
    lastUpdated: "2025-05-16",
    summary:
      "CVR transcript review awaiting ATC communication merge for correlation stage.",
  },
  {
    caseNumber: "AAI-UAE-2025-013",
    caseName: "Al Ain Night Landing Deviation",
    module: "CVR & FDR",
    status: "Data Required",
    lead: "Salem Al Marri",
    lastUpdated: "2025-05-09",
    summary:
      "Additional CVR cleaning required prior to combined correlation review.",
  },
];

const sectionOptions = [
  {
    id: "executiveSummary",
    title: "Executive Summary",
    description: "High-level incident overview with findings and recommendations.",
  },
  {
    id: "cvrTranscripts",
    title: "CVR Transcripts",
    description: "Formatted cockpit transcript with key callouts and annotations.",
  },
  {
    id: "fdrMetrics",
    title: "FDR Analysis",
    description: "Sensor charts, exceedance detection and phase-based analysis.",
  },
  {
    id: "correlation",
    title: "CVR & FDR Correlation",
    description: "Time-aligned insights highlighting correlations and discrepancies.",
  },
];

const exportFormats = [
  { id: "pdf", label: "PDF" },
  { id: "docx", label: "DOCX" },
];

export default function Reports() {
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(cases[0].caseNumber);
  const [selectedSections, setSelectedSections] = useState(() =>
    sectionOptions.reduce(
      (acc, option, index) => ({
        ...acc,
        [option.id]: index < 3,
      }),
      {}
    )
  );
  const [exportFormat, setExportFormat] = useState("pdf");
  const [includeCover, setIncludeCover] = useState(true);

  const selectedCase = useMemo(
    () => cases.find((caseItem) => caseItem.caseNumber === selectedCaseNumber),
    [selectedCaseNumber]
  );

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const selectedCount = useMemo(
    () => Object.values(selectedSections).filter(Boolean).length,
    [selectedSections]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-600">
            Compile findings for the selected case with tailored sections and export formats.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <FileText className="w-4 h-4" />
          View History
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Case</h3>
            <p className="text-sm text-gray-500">Choose the investigation you would like to generate a report for.</p>
            <div className="relative max-w-lg">
              <select
                value={selectedCaseNumber}
                onChange={(event) => setSelectedCaseNumber(event.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-12 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {cases.map((caseItem) => (
                  <option key={caseItem.caseNumber} value={caseItem.caseNumber}>
                    {caseItem.caseNumber} — {caseItem.caseName}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Layers className="w-4 h-4 text-emerald-500" />
              Include Sections
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {sectionOptions.map((option) => {
                const isActive = selectedSections[option.id];

                return (
                  <label
                    key={option.id}
                    className={`flex h-full cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors ${
                      isActive ? "border-emerald-500 bg-emerald-50/70" : "border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(isActive)}
                        onChange={() => toggleSection(option.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{option.title}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{selectedCount}</span> sections selected
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Export Options
              </div>
              <div className="space-y-3">
                {exportFormats.map((format) => (
                  <label
                    key={format.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                      exportFormat === format.id
                        ? "border-emerald-500 bg-emerald-50/70"
                        : "border-gray-200 hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format.id}
                        checked={exportFormat === format.id}
                        onChange={() => setExportFormat(format.id)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-800">{format.label}</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Info className="w-4 h-4 text-emerald-500" />
                Report Settings
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={includeCover}
                  onChange={() => setIncludeCover((prev) => !prev)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-semibold text-gray-800">Include cover page & metadata</p>
                  <p className="text-sm text-gray-500">
                    Adds branding, case metadata, and distribution notes to the beginning of the report.
                  </p>
                </div>
              </label>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                Ensure all selected analyses are complete before exporting to avoid missing sections.
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Last generated on <span className="font-medium text-gray-700">12 Jun 2025</span> by
              <span className="font-medium text-gray-700"> Eng. Fatima Al Shehhi</span>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-white shadow-md transition hover:shadow-lg sm:w-auto"
              style={{ backgroundColor: "#019348" }}
            >
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {selectedCase && (
          <aside className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">Selected Case</p>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCase.caseName}</h3>
                  <p className="text-sm text-gray-500">{selectedCase.caseNumber}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {selectedCase.module}
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-600">{selectedCase.summary}</p>
              <dl className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-medium text-gray-800">{selectedCase.status}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Lead Investigator</dt>
                  <dd className="font-medium text-gray-800">{selectedCase.lead}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Last updated</dt>
                  <dd className="font-medium text-gray-800">{selectedCase.lastUpdated}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <h4 className="text-sm font-semibold text-gray-800">Recent Exports</h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-center justify-between">
                  <span>AAI-UAE-2025-001 — Full correlation pack</span>
                  <span className="text-gray-400">PDF</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>AAI-UAE-2025-009 — Transcript briefing</span>
                  <span className="text-gray-400">DOCX</span>
                </li>
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}