import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Info, Layers, Search, Sparkles } from "lucide-react";

const cases = [
  {
    caseNumber: "AAI-UAE-2025-001",
    caseName: "Dubai Creek Runway Excursion",
    module: "CVR & FDR",
    status: "Correlate Analyzed",
    lead: "Eng. Ahmed Al Mansoori",
    lastUpdated: "2025-06-03",
    summary:
      "Combined CVR/FDR analysis indicates pilot distraction and late braking response under tailwind conditions.",
  },
  {
    caseNumber: "AAI-UAE-2025-004",
    caseName: "Sharjah Desert UAV Incident",
    module: "FDR",
    status: "Analysis In Progress",
    lead: "Dr. Hessa Al Suwaidi",
    lastUpdated: "2025-05-28",
    summary:
      "Preliminary FDR study highlights repeated loss of uplink signal and erratic control surface inputs.",
  },
  {
    caseNumber: "AAI-UAE-2025-009",
    caseName: "Abu Dhabi Mid-Air Near Miss",
    module: "CVR",
    status: "Ready for Analysis",
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
  const [caseQuery, setCaseQuery] = useState("");
  const [isCaseListOpen, setIsCaseListOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);

  const selectedCase = useMemo(
    () => cases.find((caseItem) => caseItem.caseNumber === selectedCaseNumber),
    [selectedCaseNumber]
  );

  const filteredCases = useMemo(() => {
    const normalizedQuery = caseQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return cases;
    }

    return cases.filter((caseItem) => {
      const searchableText = `${caseItem.caseNumber} ${caseItem.caseName} ${caseItem.module}`.toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [caseQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsCaseListOpen(false);
        setCaseQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isCaseListOpen) {
      return;
    }

    if (caseQuery.trim()) {
      setHighlightedIndex(0);
      return;
    }

    const selectedIndex = filteredCases.findIndex(
      (caseItem) => caseItem.caseNumber === selectedCaseNumber
    );

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [caseQuery, filteredCases, isCaseListOpen, selectedCaseNumber]);

  const handleSelectCase = (caseItem) => {
    setSelectedCaseNumber(caseItem.caseNumber);
    setIsCaseListOpen(false);
    setCaseQuery("");
  };

  const handleCaseInputFocus = (event) => {
    setIsCaseListOpen(true);
    setCaseQuery("");
    event.target.select();
  };

  const handleCaseInputChange = (event) => {
    setCaseQuery(event.target.value);
    setIsCaseListOpen(true);
  };

  const handleCaseInputKeyDown = (event) => {
    if (!isCaseListOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setIsCaseListOpen(true);
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setHighlightedIndex((prevIndex) =>
          Math.min(prevIndex + 1, Math.max(filteredCases.length - 1, 0))
        );
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        break;
      }
      case "Enter": {
        if (filteredCases[highlightedIndex]) {
          event.preventDefault();
          handleSelectCase(filteredCases[highlightedIndex]);
        }
        break;
      }
      case "Escape": {
        setIsCaseListOpen(false);
        setCaseQuery("");
        break;
      }
      default:
        break;
    }
  };


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
            <div className="relative max-w-lg" ref={comboboxRef}>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={isCaseListOpen}
                  aria-controls="case-combobox-list"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    isCaseListOpen && filteredCases[highlightedIndex]
                      ? `case-option-${filteredCases[highlightedIndex].caseNumber}`
                      : undefined
                  }
                  onFocus={handleCaseInputFocus}
                  onChange={handleCaseInputChange}
                  onKeyDown={handleCaseInputKeyDown}
                  value={caseQuery || (selectedCase ? `${selectedCase.caseNumber} — ${selectedCase.caseName}` : "")}
                  placeholder="Search cases by number, name, or module"
                  className="h-8 w-full border-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              {isCaseListOpen && (
                <div
                  id="case-combobox-list"
                  role="listbox"
                  className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  {filteredCases.length > 0 ? (
                    filteredCases.map((caseItem, index) => {
                      const isHighlighted = index === highlightedIndex;
                      const isSelected = caseItem.caseNumber === selectedCaseNumber;

                      return (
                        <button
                          key={caseItem.caseNumber}
                          type="button"
                          role="option"
                          id={`case-option-${caseItem.caseNumber}`}
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectCase(caseItem)}
                          className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm transition-colors ${isHighlighted
                              ? "bg-emerald-50 text-emerald-900"
                              : "text-gray-700 hover:bg-emerald-50/70"
                            } ${isSelected ? "font-semibold" : "font-normal"}`}
                        >
                          <span>
                            {caseItem.caseNumber} — {caseItem.caseName}
                          </span>
                          <span className="text-xs text-gray-500">
                            Module: {caseItem.module} · Status: {caseItem.status}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      No cases match your search. Try a different case number or keyword.
                    </div>
                  )}
                </div>
              )}
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
                    className={`flex h-full cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors ${isActive ? "border-emerald-500 bg-emerald-50/70" : "border-gray-200 hover:border-emerald-400"
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
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors ${exportFormat === format.id
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