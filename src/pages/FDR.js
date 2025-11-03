import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
    ResponsiveContainer,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Line,
    Bar,
} from "recharts";
import { fetchCaseByNumber } from "../api/cases";
import useRecentCases from "../hooks/useRecentCases";
import { buildCasePreview } from "../utils/caseDisplay";

const defaultCaseOptions = [
    {
        id: "AAI-UAE-2025-009",
        title: "Abu Dhabi Mid-Air Near Miss",
        aircraft: "A320-214",
        date: "12 Feb 2025",
        summary:
            "ATC intervention prevented conflict between Flight AZ217 and Flight FJ904 during climb out.",
    },
    {
        id: "AAI-UAE-2024-031",
        title: "Runway Excursion Investigation",
        aircraft: "Boeing 787-9",
        date: "28 Nov 2024",
        summary:
            "Aircraft veered left after touchdown in heavy crosswinds, triggering safety review.",
    },
    {
        id: "AAI-UAE-2025-014",
        title: "Engine Surge Event",
        aircraft: "A350-900",
        date: "04 Mar 2025",
        summary:
            "Crew reported repeated engine surges during climb with temporary loss of thrust.",
    },
];

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

const flightDynamicsSamples = [
    {
        time: "00:00",
        altitude: 1200,
        airspeed: 145,
        pitch: 1.2,
        roll: -0.8,
        heading: 92,
    },
    {
        time: "00:10",
        altitude: 1800,
        airspeed: 152,
        pitch: 1.4,
        roll: -0.4,
        heading: 94,
    },
    {
        time: "00:20",
        altitude: 2400,
        airspeed: 160,
        pitch: 1.6,
        roll: 0,
        heading: 96,
    },
    {
        time: "00:30",
        altitude: 2900,
        airspeed: 166,
        pitch: 1.9,
        roll: 0.3,
        heading: 99,
    },
    {
        time: "00:40",
        altitude: 3200,
        airspeed: 170,
        pitch: 2.1,
        roll: 0.6,
        heading: 101,
    },
    {
        time: "00:50",
        altitude: 3600,
        airspeed: 176,
        pitch: 2.4,
        roll: 0.2,
        heading: 102,
    },
    {
        time: "01:00",
        altitude: 4000,
        airspeed: 182,
        pitch: 2.7,
        roll: -0.1,
        heading: 104,
    },
];

const engineSamples = [
    {
        time: "00:00",
        engine1N1: 68,
        engine1EGT: 540,
        engine2N1: 67,
        engine2EGT: 534,
    },
    {
        time: "00:10",
        engine1N1: 70,
        engine1EGT: 553,
        engine2N1: 69,
        engine2EGT: 546,
    },
    {
        time: "00:20",
        engine1N1: 72,
        engine1EGT: 565,
        engine2N1: 71,
        engine2EGT: 559,
    },
    {
        time: "00:30",
        engine1N1: 74,
        engine1EGT: 579,
        engine2N1: 73,
        engine2EGT: 572,
    },
    {
        time: "00:40",
        engine1N1: 75,
        engine1EGT: 586,
        engine2N1: 74,
        engine2EGT: 580,
    },
    {
        time: "00:50",
        engine1N1: 77,
        engine1EGT: 595,
        engine2N1: 76,
        engine2EGT: 588,
    },
    {
        time: "01:00",
        engine1N1: 79,
        engine1EGT: 604,
        engine2N1: 78,
        engine2EGT: 597,
    },
];

const flightControlsSamples = [
    {
        time: "00:00",
        flapPosition: 5,
        spoilerDeployment: 0,
        rudderPosition: -1.5,
        elevatorPosition: 1.1,
    },
    {
        time: "00:10",
        flapPosition: 10,
        spoilerDeployment: 0,
        rudderPosition: -1.1,
        elevatorPosition: 1.3,
    },
    {
        time: "00:20",
        flapPosition: 12,
        spoilerDeployment: 0,
        rudderPosition: -0.6,
        elevatorPosition: 1.5,
    },
    {
        time: "00:30",
        flapPosition: 15,
        spoilerDeployment: 2,
        rudderPosition: -0.3,
        elevatorPosition: 1.8,
    },
    {
        time: "00:40",
        flapPosition: 18,
        spoilerDeployment: 4,
        rudderPosition: 0.1,
        elevatorPosition: 2.1,
    },
    {
        time: "00:50",
        flapPosition: 20,
        spoilerDeployment: 6,
        rudderPosition: 0.4,
        elevatorPosition: 2.4,
    },
    {
        time: "01:00",
        flapPosition: 22,
        spoilerDeployment: 8,
        rudderPosition: 0.2,
        elevatorPosition: 2.6,
    },
];

const detectionTrendSamples = [
    { time: "00:00", altitude: 1200, speed: 145, engine: 68 },
    { time: "00:10", altitude: 1800, speed: 152, engine: 70 },
    { time: "00:20", altitude: 2400, speed: 160, engine: 72 },
    { time: "00:30", altitude: 2900, speed: 166, engine: 74 },
    { time: "00:40", altitude: 3200, speed: 170, engine: 75 },
    { time: "00:50", altitude: 3600, speed: 176, engine: 77 },
    { time: "01:00", altitude: 4000, speed: 182, engine: 79 },
];

const parameterConfig = {
    Altitude: { key: "altitude", color: "#059669" },
    Airspeed: { key: "airspeed", color: "#0ea5e9" },
    "Pitch Angle": { key: "pitch", color: "#f59e0b" },
    "Roll Angle": { key: "roll", color: "#6366f1" },
    Heading: { key: "heading", color: "#334155" },
    "Engine 1 N1": { key: "engine1N1", color: "#10b981" },
    "Engine 1 EGT": { key: "engine1EGT", color: "#34d399" },
    "Engine 2 N1": { key: "engine2N1", color: "#22d3ee" },
    "Engine 2 EGT": { key: "engine2EGT", color: "#0284c7" },
    "Flap Position": { key: "flapPosition", color: "#a855f7" },
    "Spoiler Deployment": { key: "spoilerDeployment", color: "#f97316" },
    "Rudder Position": { key: "rudderPosition", color: "#ef4444" },
    "Elevator Position": { key: "elevatorPosition", color: "#3b82f6" },
};

const categorySamples = {
    "Flight Dynamics": flightDynamicsSamples,
    Engines: engineSamples,
    "Flight Controls": flightControlsSamples,
};

const parameterTableRows = [
    { parameter: "Altitude", unit: "ft", min: 1200, max: 4000 },
    { parameter: "Airspeed", unit: "kts", min: 145, max: 182 },
    { parameter: "Pitch Angle", unit: "deg", min: -2.1, max: 4.5 },
    { parameter: "Engine 1 N1", unit: "%", min: 62, max: 80 },
    { parameter: "Engine 2 N1", unit: "%", min: 61, max: 79 },
];

const phases = [
    "All Phases",
    "Pre-flight",
    "Takeoff",
    "Climb",
    "Cruise",
    "Descent",
    "Approach",
    "Landing",
];

const anomalyTypes = [
    "All Anomaly Types",
    "Exceedance",
    "Deviation",
    "System Fault",
    "Parameter Drift",
];

const severityLevels = [
    "All Severity Levels",
    "Low",
    "Moderate",
    "High",
    "Critical",
];

const detectionResultSummary = {
    anomaliesDetected: 3,
    overallReduction: 48,
    eventsByPhase: [
        { name: "Taxi", value: 4, color: "#6ee7b7" },
        { name: "Takeoff", value: 6, color: "#34d399" },
        { name: "Landing", value: 3, color: "#10b981" },
        { name: "Climb", value: 2, color: "#059669" },
    ],
    anomalyRows: [
        { parameter: "Engine N1", time: "08:12:09", severity: "Moderate" },
        { parameter: "Altitude deviation", time: "08:14:32", severity: "High" },
        { parameter: "Flap asymmetry", time: "08:16:51", severity: "Low" },
    ],
};

export default function FDR({ caseNumber: propCaseNumber }) {
    const { caseNumber: routeCaseNumber } = useParams();
    const caseNumber = propCaseNumber || routeCaseNumber;
    const navigate = useNavigate();
    const [selectedParameters, setSelectedParameters] = useState([
        "Altitude",
        "Airspeed",
        "Engine 1 N1",
    ]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(phases[0]);
    const [selectedAnomalyType, setSelectedAnomalyType] = useState(
        anomalyTypes[0]
    );
    const [selectedSeverity, setSelectedSeverity] = useState(severityLevels[0]);
    const [isRunningDetection, setIsRunningDetection] = useState(false);
    const [workflowStage, setWorkflowStage] = useState(
        caseNumber ? "analysis" : "caseSelection"
    );
    const { recentCases, loading: isRecentLoading, error: recentCasesError } =
        useRecentCases(3);
    const caseSelectionOptions = useMemo(() => {
        const mapped = recentCases
            .map((item) => buildCasePreview(item))
            .filter(Boolean);
        return mapped.length > 0 ? mapped : defaultCaseOptions;
    }, [recentCases]);
    const [linkError, setLinkError] = useState("");
    const lastLinkedCaseRef = useRef(null);

    useEffect(() => {
        if (!caseNumber) {
            lastLinkedCaseRef.current = null;
            return;
        }

        if (lastLinkedCaseRef.current === caseNumber) {
            return;
        }

        if (selectedCase?.id === caseNumber) {
            lastLinkedCaseRef.current = caseNumber;
            setWorkflowStage((prev) => (prev === "caseSelection" ? "analysis" : prev));
            return;
        }

        let isMounted = true;
        setLinkError("");

        fetchCaseByNumber(caseNumber)
            .then((data) => {
                if (!isMounted) {
                    return;
                }

                const preview = buildCasePreview(data);
                setSelectedCase(preview);
                setWorkflowStage("analysis");
                lastLinkedCaseRef.current = caseNumber;
            })
            .catch((err) => {
                if (!isMounted) {
                    return;
                }

                setLinkError(err?.message || "Unable to open the selected case");
                setWorkflowStage("caseSelection");
            });

        return () => {
            isMounted = false;
        };
    }, [caseNumber, selectedCase]);

    const handleNavigateToCases = () => {
        navigate("/cases");
    };


    const toggleParameter = (parameter) => {
        setSelectedParameters((prev) =>
            prev.includes(parameter)
                ? prev.filter((item) => item !== parameter)
                : [...prev, parameter]
        );
    };

    const handleRunDetection = () => {
        setIsRunningDetection(true);

        // Placeholder for future machine learning integration.
        // This simulates a background task and sets a ready state for when
        // a real model is connected to this workflow.
        window.setTimeout(() => {
            setIsRunningDetection(false);
            setWorkflowStage((prev) =>
                prev === "analysis" ? "detectionComplete" : prev
            );
        }, 1500);
    };

    const categoryOrder = parameterGroups.map((group) => group.category);

    const renderCategoryCharts = () =>
        categoryOrder.map((category) => {
            const categoryParameters =
                parameterGroups.find((group) => group.category === category)?.parameters || [];
            const activeParameters = categoryParameters.filter((parameter) =>
                selectedParameters.includes(parameter)
            );
            const chartData = categorySamples[category] || [];

            return (
                <div
                    key={category}
                    className="w-full space-y-4 rounded-2xl border border-gray-200 bg-white/40 p-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">{category}</h3>
                        <span className="text-xs font-medium text-gray-400">
                            {activeParameters.length}/{categoryParameters.length} selected
                        </span>
                    </div>

                    {activeParameters.length > 0 ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {activeParameters.map((parameter) => {
                                    const config = parameterConfig[parameter];
                                    const badgeColor = config?.color ?? "#0f172a";
                                    const badgeBackground = config?.color
                                        ? `${config.color}1a`
                                        : "#e2e8f0";

                                    return (
                                        <span
                                            key={parameter}
                                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                            style={{
                                                backgroundColor: badgeBackground,
                                                color: badgeColor,
                                            }}
                                        >
                                            {parameter}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="time" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip />
                                        {activeParameters.map((parameter) => {
                                            const config = parameterConfig[parameter];
                                            return config ? (
                                                <Line
                                                    key={config.key}
                                                    type="monotone"
                                                    dataKey={config.key}
                                                    stroke={config.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            ) : null;
                                        })}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                            Select {category.toLowerCase()} parameters to visualize trends.
                        </div>
                    )}
                </div>
            );
        });

    const renderSelectField = (label, value, options, onChange) => (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">
                {label}
            </label>
            <div className="relative">
                <select
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                >
                    {options.map((option) => (
                        <option key={option}>{option}</option>
                    ))}
                </select>
                <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );

    if (workflowStage === "caseSelection") {
        return (
            <><div className="max-w-6xl mx-auto space-y-8">
                <header className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-600">FDR Module</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Select a Case to Analyze Flight Data
                    </h1>
                    <p className="text-gray-600 max-w-3xl">
                        Choose the investigation file whose flight data recorder stream you
                        want to explore. Once selected, the system will load available
                        parameters, trend charts, and anomaly detection workflows.
                    </p>
                </header>

                {(recentCasesError || linkError) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {linkError || recentCasesError}
                    </div>
                )}
                {isRecentLoading && recentCases.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                        Loading recent cases...
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseSelectionOptions.map((flightCase) => {
                        const isActive = selectedCase?.id === flightCase.id;
                        return (
                            <button
                                key={flightCase.id}
                                type="button"
                                onClick={() => {
                                    setSelectedCase(flightCase);
                                    setLinkError("");
                                } }
                                className={`text-left rounded-2xl border transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${isActive
                                        ? "border-emerald-300 bg-emerald-50"
                                        : "border-gray-200 bg-white"}`}
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-wide text-gray-400">
                                            Case ID
                                        </span>
                                        <span className="text-sm font-semibold text-emerald-600">
                                            {flightCase.date}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {flightCase.id}
                                        </p>
                                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                                            {flightCase.title}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-gray-600">{flightCase.summary}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Aircraft</span>
                                        <span className="font-medium text-gray-800">
                                            {flightCase.aircraft}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <div className="text-xs font-medium text-emerald-700 bg-emerald-100 inline-flex items-center gap-1 rounded-full px-3 py-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Selected case
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={handleNavigateToCases}
                        className="text-left rounded-2xl border-2 border-dashed border-emerald-200 bg-white transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    >
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-wide text-emerald-600">
                                    Need a different investigation?
                                </span>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Browse older cases
                                </h2>
                            </div>
                            <p className="text-sm text-gray-600">
                                Go to the Cases page to select from the full archive, then choose the analysis module you need.
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                                Go to Cases
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        </div>
                    </button>
                </div>
            </div><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1 text-sm text-gray-500">
                        <p>Select a case to detect anomalies in FDR data.</p>
                    </div>
                    <button
                        type="button"
                        disabled={!selectedCase}
                        onClick={() => selectedCase && setWorkflowStage("analysis")}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-emerald-200"
                    >
                        Continue to parameter selection
                    </button>
                </div></>
        );
    }

    if (workflowStage === "detectionComplete") {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
                <div className="w-full rounded-3xl bg-white p-12 text-center shadow-xl border border-emerald-100">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
                        <svg
                            width="56"
                            height="56"
                            viewBox="0 0 56 56"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-emerald-500"
                        >
                            <circle cx="28" cy="28" r="28" fill="currentColor" opacity="0.1" />
                            <path
                                d="M38 22L26 34L20 28"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
                        FDR Module
                    </p>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900">
                        Analysis Completed
                    </h1>
                    <p className="mt-3 text-gray-600 max-w-md mx-auto">
                        The anomaly detection engine processed the selected parameters for
                        case {selectedCase?.id}. Review the synthesized insights and detailed
                        findings in the results dashboard.
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setWorkflowStage("results")}
                            className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition"
                        >
                            View Results
                        </button>
                        <button
                            type="button"
                            onClick={() => setWorkflowStage("analysis")}
                            className="rounded-xl border border-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:text-emerald-600"
                        >
                            Adjust parameters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (workflowStage === "results") {
        const totalEvents =
            detectionResultSummary.eventsByPhase.reduce(
                (sum, item) => sum + item.value,
                0
            ) || 1;

        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.4em] text-emerald-500">
                            FDR Module
                        </p>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Anomaly Detection Results
                        </h1>
                        <p className="text-gray-600">
                            Generated insights for {selectedCase?.id} · {selectedCase?.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setWorkflowStage("analysis")}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-emerald-200 hover:text-emerald-600"
                        >
                            Back to configuration
                        </button>
                        <button
                            type="button"
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        >
                            Export Report
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                    <section className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Detection of Anomalies
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Comparison of expected baseline vs detected deviations.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span>Actual</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                                        <span>Flight Baseline</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={detectionTrendSamples}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="time" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip />
                                        <Bar dataKey="engine" name="Deviation" fill="#d1fae5" />
                                        <Line
                                            type="monotone"
                                            dataKey="altitude"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={false}
                                            name="Actual"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="speed"
                                            stroke="#38bdf8"
                                            strokeWidth={3}
                                            strokeDasharray="6 4"
                                            dot={false}
                                            name="Flight Baseline"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Anomaly Summary
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Events flagged by the detection model for deeper review.
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {detectionResultSummary.anomaliesDetected} anomalies detected
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase tracking-wide text-gray-500">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-left">Parameter</th>
                                            <th className="px-4 py-3 text-left">Timestamp</th>
                                            <th className="px-4 py-3 text-right">Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {detectionResultSummary.anomalyRows.map((row) => (
                                            <tr key={row.parameter} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {row.parameter}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{row.time}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50">
                                                        {row.severity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Events by Flight Phase
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Distribution of detected deviations across the flight timeline.
                            </p>

                            <div className="mt-6 space-y-4">
                                {detectionResultSummary.eventsByPhase.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="h-2.5 w-8 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {Math.round((item.value / totalEvents) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Anomalies Detected
                            </h2>
                            <p className="text-sm text-gray-500">
                                {detectionResultSummary.overallReduction}% risk reduction
                                compared to baseline.
                            </p>
                            <div className="mt-6 flex h-48 items-center justify-center">
                                <div className="relative">
                                    <div className="h-40 w-40 rounded-full border-[14px] border-emerald-100" />
                                    <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                                        <span className="text-3xl font-bold text-emerald-600">
                                            {detectionResultSummary.overallReduction}%
                                        </span>
                                        <span className="text-xs uppercase tracking-wide text-gray-500">
                                            Saved
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Summaries and contextual observations captured by investigators.
                            </p>
                            <textarea
                                rows={5}
                                className="mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                                placeholder="Add follow-up actions or observations..."
                            />
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    if (workflowStage === "analysis" && !selectedCase) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-600">Preparing analysis workspace</p>
                    <p className="text-sm text-gray-600">
                        Loading the selected case details. This may take a moment.
                    </p>
                </div>
            </div>
        );
    }

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
                            {selectedCase?.id} · {selectedCase?.title}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setWorkflowStage("caseSelection")}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-emerald-200 hover:text-emerald-600"
                    >
                        Change case
                    </button>
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
                    </div>

                    <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                        {renderCategoryCharts()}
                    </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Anomaly Filter</h2>
                        <p className="text-sm text-gray-500">
                            Define the criteria for anomaly detection before running the
                            model.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {renderSelectField("Phase of Flight", selectedPhase, phases, setSelectedPhase)}
                        {renderSelectField(
                            "Anomaly Type",
                            selectedAnomalyType,
                            anomalyTypes,
                            setSelectedAnomalyType
                        )}
                        {renderSelectField(
                            "Severity Level",
                            selectedSeverity,
                            severityLevels,
                            setSelectedSeverity
                        )}
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