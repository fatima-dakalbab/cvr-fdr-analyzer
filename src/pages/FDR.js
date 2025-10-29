import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
} from "recharts";

const parameterGroups = [
  {
    category: "Flight Dynamics",
    parameters: [
      "Altitude",
      "Airspeed",
      "Pitch Angle",
      "Roll Angle",
      "Heading",
    ],
  },
  {
    category: "Engines",
    parameters: [
      "Engine 1 N1",
      "Engine 1 EGT",
      "Engine 2 N1",
      "Engine 2 EGT",
    ],
  },
  {
    category: "Flight Controls",
    parameters: [
      "Flap Position",
      "Spoiler Deployment",
      "Rudder Position",
      "Elevator Position",
    ],
  },
];

const chartSamples = [
  { time: "00:00", altitude: 1200, speed: 145, engine: 68 },
  { time: "00:10", altitude: 1800, speed: 152, engine: 70 },
  { time: "00:20", altitude: 2400, speed: 160, engine: 72 },
  { time: "00:30", altitude: 2900, speed: 166, engine: 74 },
  { time: "00:40", altitude: 3200, speed: 170, engine: 75 },
  { time: "00:50", altitude: 3600, speed: 176, engine: 77 },
  { time: "01:00", altitude: 4000, speed: 182, engine: 79 },
];

const parameterTableRows = [
  { parameter: "Altitude", unit: "ft", min: 1200, max: 4000 },
  { parameter: "Airspeed", unit: "kts", min: 145, max: 182 },
  { parameter: "Pitch Angle", unit: "deg", min: -2.1, max: 4.5 },
  { parameter: "Engine 1 N1", unit: "%", min: 62, max: 80 },
  { parameter: "Engine 2 N1", unit: "%", min: 61, max: 79 },
];

const phases = [
  "Pre-flight",
  "Takeoff",
  "Climb",
  "Cruise",
  "Descent",
  "Approach",
  "Landing",
];

const anomalyTypes = [
  "Exceedance",
  "Deviation",
  "System Fault",
  "Parameter Drift",
];

const severityLevels = ["Low", "Moderate", "High", "Critical"];

export default function FDR() {
  const [selectedParameters, setSelectedParameters] = useState([
    "Altitude",
    "Airspeed",
    "Engine 1 N1",
  ]);
  const [selectedPhase, setSelectedPhase] = useState("Takeoff");
  const [selectedAnomalyType, setSelectedAnomalyType] = useState("Exceedance");
  const [selectedSeverity, setSelectedSeverity] = useState("Moderate");
  const [isRunningDetection, setIsRunningDetection] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("");

  const toggleParameter = (parameter) => {
    setDetectionStatus("");
    setSelectedParameters((prev) =>
      prev.includes(parameter)
        ? prev.filter((item) => item !== parameter)
        : [...prev, parameter]
    );
  };

  const handleRunDetection = () => {
    setIsRunningDetection(true);
    setDetectionStatus("Running anomaly detection...");

    // Placeholder for future machine learning integration.
    // This simulates a background task and sets a ready state for when
    // a real model is connected to this workflow.
    window.setTimeout(() => {
      setIsRunningDetection(false);
      setDetectionStatus(
        "Detection complete. View results in the anomaly report panel."
      );
    }, 1500);
  };

  const chartLines = useMemo(() => {
    const mappings = {
      Altitude: { key: "altitude", color: "#019348" },
      Airspeed: { key: "speed", color: "#0ea5e9" },
      "Engine 1 N1": { key: "engine", color: "#6366f1" },
    };

    return selectedParameters
      .map((param) => mappings[param])
      .filter(Boolean);
  }, [selectedParameters]);
    return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FDR Module</h1>
          <p className="text-gray-600">
            Configure parameters, review recorded data, and launch anomaly
            detection for the selected flight case.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-gray-500">Active Case</p>
            <p className="text-sm font-semibold text-gray-800">
              AAI-UAE-2025-009 · Abu Dhabi Mid-Air Near Miss
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_280px] gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Parameter Selector
            </h2>
            <p className="text-sm text-gray-500">
              Choose the flight data parameters to visualize and analyze.
            </p>
          </div>

          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Flight Parameter Selected
            </p>
            <p className="text-sm font-medium text-gray-800">
              {selectedParameters.length > 0
                ? selectedParameters.join(", ")
                : "No parameters selected"}
            </p>
          </div>

          <div className="space-y-5">
            {parameterGroups.map(({ category, parameters }) => (
              <div key={category} className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{category}</p>
                <div className="space-y-2">
                  {parameters.map((parameter) => (
                    <label
                      key={parameter}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selectedParameters.includes(parameter)}
                        onChange={() => toggleParameter(parameter)}
                      />
                      <span>{parameter}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Flight Parameter Overview
              </h2>
              <p className="text-sm text-gray-500">
                Time series visualization of recorder values for the selected
                parameters.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50"
            >
              Export CSV
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartSamples}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="engine" name="Engine 1 N1" fill="#d1fae5" />
                {chartLines.map(({ key, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Anomaly Filter</h2>
            <p className="text-sm text-gray-500">
              Define the criteria for anomaly detection before running the
              model.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Phase of Flight
              </label>
              <select
                className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                value={selectedPhase}
                onChange={(event) => setSelectedPhase(event.target.value)}
              >
                {phases.map((phase) => (
                  <option key={phase}>{phase}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Anomaly Type
              </label>
              <select
                className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                value={selectedAnomalyType}
                onChange={(event) => setSelectedAnomalyType(event.target.value)}
              >
                {anomalyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Severity Level
              </label>
              <select
                className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                value={selectedSeverity}
                onChange={(event) => setSelectedSeverity(event.target.value)}
              >
                {severityLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunDetection}
            disabled={isRunningDetection}
            className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ backgroundColor: "#019348" }}
          >
            {isRunningDetection ? "Running..." : "Run Anomaly Detection"}
          </button>

          {detectionStatus && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              {detectionStatus}
            </p>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
            Machine learning output will populate anomaly summaries and
            visualizations once integrated with the detection pipeline.
          </div>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Parameter Table</h2>
            <p className="text-sm text-gray-500">
              Summary of key flight parameters captured in the recorder.
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
            {parameterTableRows.length} parameters
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Parameter</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-right px-4 py-3">Minimum</th>
                <th className="text-right px-4 py-3">Maximum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parameterTableRows.map((row) => (
                <tr key={row.parameter} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.parameter}</td>
                  <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.min}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}