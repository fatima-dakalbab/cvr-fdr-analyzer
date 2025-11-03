import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlaneTakeoff, AlertTriangle, Workflow, Download, ArrowRight, Loader2, ChevronRight } from "lucide-react";
import { fetchCaseByNumber } from "../api/cases";
import useRecentCases from "../hooks/useRecentCases";
import { buildCasePreview } from "../utils/caseDisplay";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const CASES = [
    {
        id: "AAI-UAE-2025-001",
        title: "Runway excursion during initial climb",
        aircraft: "Boeing 777-300ER",
        flight: "EK431 - Dubai to Singapore",
        date: "18 May 2025",
        location: "Dubai International Airport (OMDB)",
        summary:
            "Transient loss of thrust on engine #2 prompted a rejected takeoff and subsequent runway excursion.",
        timeline: [
            {
                time: "12:45:01",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Engine start confirmed.",
                emotion: "Calm",
                emotionColor: "bg-emerald-100 text-emerald-700",
                fdrEvent: "Engine N1",
                fdrValue: "98%",
            },
            {
                time: "12:45:35",
                speaker: "ATC",
                role: "Tower",
                transcript: "Cleared for takeoff runway 30R.",
                emotion: "Neutral",
                emotionColor: "bg-slate-100 text-slate-700",
                fdrEvent: "Brake Pressure",
                fdrValue: "Released",
            },
            {
                time: "12:46:18",
                speaker: "First Officer",
                role: "Pilot Monitoring",
                transcript: "Power set, maintain V1.",
                emotion: "Focused",
                emotionColor: "bg-blue-100 text-blue-700",
                fdrEvent: "Airspeed",
                fdrValue: "142 kts",
            },
            {
                time: "12:46:34",
                speaker: "Engine #2",
                role: "Warning System",
                transcript: "Engine 2 fault detected.",
                emotion: "Alert",
                emotionColor: "bg-amber-100 text-amber-700",
                fdrEvent: "EGT",
                fdrValue: "890°C spike",
            },
            {
                time: "12:46:39",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Abort takeoff, deploying reversers.",
                emotion: "Assertive",
                emotionColor: "bg-purple-100 text-purple-700",
                fdrEvent: "Thrust Reverser",
                fdrValue: "Deployed",
            },
            {
                time: "12:47:02",
                speaker: "ATC",
                role: "Tower",
                transcript: "Emergency vehicles en route.",
                emotion: "Supportive",
                emotionColor: "bg-indigo-100 text-indigo-700",
                fdrEvent: "Ground Speed",
                fdrValue: "12 kts",
            },
        ],
        parameters: [
            { time: "12:45", altitude: 0, heading: 302, speed: 0 },
            { time: "12:45:30", altitude: 200, heading: 302, speed: 65 },
            { time: "12:46", altitude: 600, heading: 302, speed: 138 },
            { time: "12:46:20", altitude: 780, heading: 305, speed: 150 },
            { time: "12:46:40", altitude: 720, heading: 305, speed: 118 },
            { time: "12:47", altitude: 120, heading: 310, speed: 34 },
        ],
        keyParameters: {
            altitude: "780 ft",
            heading: "305°",
            speed: "150 kts",
            event: "Initial climb with engine fault",
        },
        highlightedEmotion: {
            speaker: "First Officer",
            emotion: "Heightened stress detected at 12:46:34 during engine #2 fault callout.",
        },
    },
    {
        id: "AAI-UAE-2025-013",
        title: "Hard landing during crosswind",
        aircraft: "Airbus A321neo",
        flight: "XY218 - Abu Dhabi to Muscat",
        date: "04 June 2025",
        location: "Muscat International Airport (OOMS)",
        summary:
            "Aircraft experienced crosswind shear on short final resulting in a hard touchdown and minor gear inspection.",
        timeline: [
            {
                time: "08:14:12",
                speaker: "ATC",
                role: "Approach",
                transcript: "Expect ILS runway 26, winds 240 at 22 gusting 30.",
                emotion: "Neutral",
                emotionColor: "bg-slate-100 text-slate-700",
                fdrEvent: "Wind Component",
                fdrValue: "+18 kts cross",
            },
            {
                time: "08:15:05",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Correcting drift, maintain glide path.",
                emotion: "Focused",
                emotionColor: "bg-blue-100 text-blue-700",
                fdrEvent: "Pitch Angle",
                fdrValue: "4.5° nose up",
            },
            {
                time: "08:15:38",
                speaker: "First Officer",
                role: "Pilot Monitoring",
                transcript: "Sink rate, 900 feet per minute.",
                emotion: "Concerned",
                emotionColor: "bg-amber-100 text-amber-700",
                fdrEvent: "Vertical Speed",
                fdrValue: "-920 fpm",
            },
            {
                time: "08:16:01",
                speaker: "Aircraft",
                role: "Warning System",
                transcript: "Retard, retard.",
                emotion: "Alert",
                emotionColor: "bg-red-100 text-red-700",
                fdrEvent: "Radio Altimeter",
                fdrValue: "30 ft",
            },
            {
                time: "08:16:08",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Holding centerline, flare now.",
                emotion: "Determined",
                emotionColor: "bg-purple-100 text-purple-700",
                fdrEvent: "Bank Angle",
                fdrValue: "7° right",
            },
            {
                time: "08:16:18",
                speaker: "FDR",
                role: "Data",
                transcript: "Touchdown confirmed.",
                emotion: "Neutral",
                emotionColor: "bg-slate-100 text-slate-700",
                fdrEvent: "Vertical Acceleration",
                fdrValue: "2.1g",
            },
        ],
        parameters: [
            { time: "08:14", altitude: 3200, heading: 255, speed: 178 },
            { time: "08:14:30", altitude: 2600, heading: 252, speed: 170 },
            { time: "08:15", altitude: 2000, heading: 248, speed: 166 },
            { time: "08:15:30", altitude: 1400, heading: 245, speed: 158 },
            { time: "08:16", altitude: 900, heading: 242, speed: 152 },
            { time: "08:16:18", altitude: 0, heading: 240, speed: 138 },
        ],
        keyParameters: {
            altitude: "900 ft",
            heading: "242°",
            speed: "152 kts",
            event: "Short final with gust correction",
        },
        highlightedEmotion: {
            speaker: "First Officer",
            emotion: "Elevated stress noted during high sink rate callout at 08:15:38.",
        },
    },
    {
        id: "AAI-UAE-2024-022",
        title: "Emergency descent after cabin pressure loss",
        aircraft: "Boeing 737-8 MAX",
        flight: "GT312 - Sharjah to Cairo",
        date: "19 Sep 2024",
        location: "En-route over the Arabian Gulf",
        summary:
            "Rapid cabin depressurization during climb triggered oxygen mask deployment and an immediate return to departure airport.",
        timeline: [
            {
                time: "06:12:08",
                speaker: "First Officer",
                role: "Pilot Monitoring",
                transcript: "Climb checklist complete.",
                emotion: "Calm",
                emotionColor: "bg-emerald-100 text-emerald-700",
                fdrEvent: "Cabin Rate",
                fdrValue: "500 ft/min",
            },
            {
                time: "06:14:20",
                speaker: "ATC",
                role: "Departure",
                transcript: "Climb and maintain flight level 360.",
                emotion: "Neutral",
                emotionColor: "bg-slate-100 text-slate-700",
                fdrEvent: "Altitude",
                fdrValue: "18,000 ft",
            },
            {
                time: "06:15:42",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Setting climb power, keep an eye on cabin altitude.",
                emotion: "Focused",
                emotionColor: "bg-blue-100 text-blue-700",
                fdrEvent: "Cabin Altitude",
                fdrValue: "6,500 ft",
            },
            {
                time: "06:16:18",
                speaker: "Warning System",
                role: "Aircraft",
                transcript: "Cabin altitude warning.",
                emotion: "Alert",
                emotionColor: "bg-amber-100 text-amber-700",
                fdrEvent: "Pressurization",
                fdrValue: "Fault detected",
            },
            {
                time: "06:16:33",
                speaker: "Captain",
                role: "Pilot Flying",
                transcript: "Masks on, initiating emergency descent.",
                emotion: "Assertive",
                emotionColor: "bg-purple-100 text-purple-700",
                fdrEvent: "Vertical Speed",
                fdrValue: "-4,200 fpm",
            },
            {
                time: "06:17:05",
                speaker: "First Officer",
                role: "Pilot Monitoring",
                transcript: "Mayday declared, coordinating vectors with Muscat ATC.",
                emotion: "Urgent",
                emotionColor: "bg-red-100 text-red-700",
                fdrEvent: "Heading",
                fdrValue: "Turned to 180°",
            },
        ],
        parameters: [
            { time: "06:12", altitude: 8000, heading: 128, speed: 250 },
            { time: "06:13", altitude: 12000, heading: 130, speed: 270 },
            { time: "06:14", altitude: 17000, heading: 132, speed: 290 },
            { time: "06:15", altitude: 21500, heading: 135, speed: 305 },
            { time: "06:16", altitude: 19000, heading: 160, speed: 290 },
            { time: "06:17", altitude: 14000, heading: 180, speed: 260 },
        ],
        keyParameters: {
            altitude: "21,500 ft",
            heading: "135°",
            speed: "305 kts",
            event: "Emergency descent initiated after cabin warning",
        },
        highlightedEmotion: {
            speaker: "Captain",
            emotion: "Decisive command issued during emergency descent call at 06:16:33.",
        },
    },
];

const defaultCasePreviews = CASES.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    summary: item.summary,
    aircraft: item.aircraft,
    location: item.location,
    source: item,
    template: item,
}));

const parameterColors = {
    altitude: "#22c55e",
    heading: "#0ea5e9",
    speed: "#ef4444",
};

const emotionBadge = (emotion, color) => (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>{emotion}</span>
);

const Correlate = ({ caseNumber: propCaseNumber }) => {
    const { caseNumber: routeCaseNumber } = useParams();
    const caseNumber = propCaseNumber || routeCaseNumber;
    const navigate = useNavigate();
    const [workflowStage, setWorkflowStage] = useState(
        caseNumber ? "loading" : "caseSelection"
    );
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const { recentCases, loading: isRecentLoading, error: recentCasesError } =
        useRecentCases(3);
    const caseSelectionOptions = useMemo(() => {
        const mapped = recentCases
            .map((item, index) => {
                const preview = buildCasePreview(item);
                if (!preview) {
                    return null;
                }

                const template = CASES[index % CASES.length];

                return {
                    ...preview,
                    location: preview.location || template?.location || '',
                    template,
                };
            })
            .filter(Boolean);

        return mapped.length > 0 ? mapped : defaultCasePreviews;
    }, [recentCases]);
    const [linkError, setLinkError] = useState("");
    const lastLinkedCaseRef = useRef(null);

    useEffect(() => {
        if (workflowStage !== "loading") {
            return undefined;
        }

        const timeoutId = setTimeout(() => {
            setWorkflowStage("analysis");
        }, 1600);

        return () => clearTimeout(timeoutId);
    }, [workflowStage]);

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
            if (workflowStage === "caseSelection") {
                setWorkflowStage("loading");
            }
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
                if (!preview) {
                    throw new Error("Unable to open the selected case");
                }

                const template =
                    (preview.source && preview.source.timeline
                        ? preview.source
                        : caseSelectionOptions.find((option) => option.id === preview.id)?.template) ||
                    CASES[0];

                const merged = {
                    ...(template || {}),
                    id: preview.id,
                    title: preview.title,
                    summary: preview.summary,
                    aircraft: preview.aircraft,
                    date: preview.date,
                };

                setSelectedCaseId(preview.id);
                setSelectedCase(merged);
                setWorkflowStage("loading");
                lastLinkedCaseRef.current = caseNumber;
            })
            .catch((err) => {
                if (!isMounted) {
                    return;
                }

                setLinkError(err?.message || "Unable to open the selected case");
                setSelectedCase(null);
                setSelectedCaseId(null);
                setWorkflowStage("caseSelection");
            });

        return () => {
            isMounted = false;
        };
    }, [caseNumber, selectedCase, workflowStage, caseSelectionOptions]);

    const mergeWithTemplate = (option) => {
        if (!option) {
            return null;
        }

        const template = option.source?.timeline ? option.source : option.template || CASES[0];

        return {
            ...(template || {}),
            id: option.id,
            title: option.title,
            summary: option.summary,
            aircraft: option.aircraft,
            date: option.date,
            location: option.location ?? template?.location ?? "",
        };
    };

    const primaryEvent = selectedCase?.timeline?.[3] || selectedCase?.timeline?.[0];

    const handleNavigateToCases = () => {
        navigate("/cases");
    };

    const handleCaseSelect = (option) => {
        setSelectedCaseId(option.id);
        setSelectedCase(mergeWithTemplate(option));
        setLinkError("");
    };


    if (workflowStage === "caseSelection") {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-600">Correlation Workspace</p>
                    <h1 className="text-3xl font-bold text-gray-900">Select a Case to Synchronize FDR &amp; CVR</h1>
                    <p className="text-gray-600 max-w-3xl">
                        Choose the investigation file you want to align first. Once a case is selected, the system will load the cockpit
                        transcript, flight recorder data, and correlation insights for synchronized analysis.
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
                    {caseSelectionOptions.map((item) => {
                        const isActive = item.id === selectedCaseId;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleCaseSelect(item)}
                                className={`text-left rounded-2xl border transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${isActive ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"
                                    }`}
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-wide text-gray-400">Case ID</span>
                                        <span className="text-sm font-semibold text-emerald-600">{item.date}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{item.id}</p>
                                        <h2 className="mt-1 text-xl font-bold text-gray-900">{item.title}</h2>
                                    </div>
                                    <p className="text-sm text-gray-600">{item.summary}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Aircraft</span>
                                        <span className="font-medium text-gray-800">{item.aircraft}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Location</span>
                                        <span className="font-medium text-gray-800">{item.location}</span>
                                    </div>
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
                                <h2 className="text-xl font-bold text-gray-900">Browse older cases</h2>
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

                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Select a case to unlock synchronized analysis of recorder sources.
                    </p>
                    <button
                        type="button"
                        disabled={!selectedCaseId}
                        onClick={() => selectedCaseId && setWorkflowStage("loading")}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-50 bg-emerald-600 hover:bg-emerald-700"
                    >
                        Start synchronization
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (workflowStage !== "caseSelection" && !selectedCase) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-600">Preparing correlation workspace</p>
                    <p className="text-sm text-gray-600">
                        Loading the selected case details. Analysis will begin shortly.
                    </p>
                </div>
            </div>
        );
    }

    if (workflowStage === "loading") {
        return (
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Correlation Workspace</p>
                    <h1 className="text-3xl font-bold text-gray-900">Preparing synchronized analysis</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        We&apos;re aligning cockpit voice recordings with flight recorder parameters for
                        <span className="font-semibold"> {selectedCase.id}</span>. Sit tight while we fetch correlation highlights.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["Cockpit Voice Recorder", "Flight Data Recorder"].map((label) => (
                        <div
                            key={label}
                            className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center gap-4"
                        >
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Analyzing</p>
                                <p className="text-base font-semibold text-gray-900">{label}</p>
                            </div>
                            <p className="text-sm text-gray-600">
                                Extracting key events, timestamps, and anomaly markers to build synchronized playback.
                            </p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-gray-500">This may take a few seconds.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                            Correlation Workspace
                        </p>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            FDR & CVR Synchronization
                        </h1>
                        <p className="text-gray-600 mt-1 max-w-2xl">
                            Select an incident case to align cockpit conversations with flight data records,
                            visualize critical parameters and highlight notable correlation points.
                        </p>
                    </div>
                    <div className="w-full md:w-80 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="block text-sm font-medium text-gray-700">Case reference</p>
                            <button
                                type="button"
                                onClick={() => setWorkflowStage("caseSelection")}
                                className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 transition hover:border-emerald-200 hover:text-emerald-600"
                            >
                                Change case
                            </button>
                        </div>
                        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">{selectedCase.id}</p>
                            <p className="text-xs text-gray-500 mt-1">{selectedCase.title}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <PlaneTakeoff className="w-10 h-10 text-emerald-600" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-700 uppercase">Flight Event</p>
                                <h2 className="text-lg font-semibold text-emerald-900">{selectedCase.title}</h2>
                            </div>
                        </div>
                        <p className="text-sm text-emerald-800 mt-3">{selectedCase.summary}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Aircraft</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{selectedCase.aircraft}</p>
                        <p className="text-xs text-gray-500 mt-4 uppercase font-semibold">Flight</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedCase.flight}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs uppercase text-gray-500 font-semibold">Date</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{selectedCase.date}</p>
                        <p className="text-xs text-gray-500 mt-4 uppercase font-semibold">Location</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedCase.location}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Correlation Timeline</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Events are chronologically synchronized so that cockpit audio cues align with
                                recorded flight parameters.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 text-sm">
                            <Workflow className="w-4 h-4" />
                            Live sync offset: <span className="font-semibold">±0.3s</span>
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden border border-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Speaker
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Transcript
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Emotion
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        FDR Alignment
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-sm">
                                {selectedCase.timeline.map((entry, index) => (
                                    <tr key={`${entry.time}-${index}`} className="hover:bg-emerald-50/60 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-700">{entry.time}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900">{entry.speaker}</p>
                                            <p className="text-xs text-gray-500">{entry.role}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{entry.transcript}</td>
                                        <td className="px-4 py-3">{emotionBadge(entry.emotion, entry.emotionColor)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{entry.fdrEvent}</span>
                                                <span className="text-xs text-gray-500">{entry.fdrValue}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                            <div>
                                <p className="text-xs uppercase font-semibold text-amber-600">Highlighted Moment</p>
                                <h3 className="text-lg font-semibold text-gray-900">{primaryEvent.transcript}</h3>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">Timestamp</span>
                                <span className="font-mono text-gray-900">{primaryEvent.time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">Emotion Response</span>
                                {emotionBadge(primaryEvent.emotion, primaryEvent.emotionColor)}
                            </div>
                            <div className="border-t border-dashed border-gray-200 pt-3 text-sm text-gray-600">
                                <p className="font-semibold text-gray-900">FDR Insight</p>
                                <p className="mt-1 text-gray-700">
                                    {primaryEvent.fdrEvent} recorded <span className="font-semibold">{primaryEvent.fdrValue}</span>
                                    , triggering crew response.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Transcript &amp; Emotion</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedCase.highlightedEmotion.speaker}: {selectedCase.highlightedEmotion.emotion}
                        </p>
                        <div className="mt-4 space-y-3 text-sm text-gray-700">
                            {selectedCase.timeline.slice(0, 3).map((entry, index) => (
                                <div key={`${entry.time}-insight`} className="p-3 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-900">{entry.speaker}</span>
                                        <span className="font-mono text-gray-500">{entry.time}</span>
                                    </div>
                                    <p className="mt-2 text-gray-700">“{entry.transcript}”</p>
                                    <div className="mt-2">{emotionBadge(entry.emotion, entry.emotionColor)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Flight Parameters</h3>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(selectedCase.keyParameters).map(([label, value]) => (
                                <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="uppercase text-xs font-semibold text-gray-500">{label}</p>
                                    <p className="text-gray-900 font-medium mt-1">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Parameter Trends</h2>
                        <p className="text-sm text-gray-600">
                            Overlay of altitude, heading, and speed values to highlight deviations during the
                            correlated timeframe.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        {Object.entries(parameterColors).map(([parameter, color]) => (
                            <div key={parameter} className="flex items-center gap-2">
                                <span
                                    className="inline-block w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                {parameter.charAt(0).toUpperCase() + parameter.slice(1)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedCase.parameters} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={parameterColors.altitude} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={parameterColors.altitude} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="headingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={parameterColors.heading} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={parameterColors.heading} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={parameterColors.speed} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={parameterColors.speed} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: "0.75rem", borderColor: "#d1d5db" }}
                                labelStyle={{ color: "#111827", fontWeight: 600 }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Area
                                type="monotone"
                                dataKey="altitude"
                                name="Altitude (ft)"
                                stroke={parameterColors.altitude}
                                fill="url(#altitudeGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="heading"
                                name="Heading (°)"
                                stroke={parameterColors.heading}
                                fill="url(#headingGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="speed"
                                name="Speed (kts)"
                                stroke={parameterColors.speed}
                                fill="url(#speedGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-600">
                        Data window aligned from <span className="font-semibold">{selectedCase.timeline[0].time}</span> to
                        <span className="font-semibold"> {selectedCase.timeline[selectedCase.timeline.length - 1].time}</span>.
                    </p>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium shadow-sm hover:bg-emerald-700"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Correlate;