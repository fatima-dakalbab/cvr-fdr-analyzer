import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    ChevronRight,
    Download,
    Loader2,
    PlaneTakeoff,
    Workflow,
} from "lucide-react";
import { fetchCaseByNumber } from "../api/cases";
import useRecentCases from "../hooks/useRecentCases";
import { buildCasePreview, getRecorderAvailability } from "../utils/caseDisplay";
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

const FALLBACK_CASES = [
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
        aircraft: "Boeing 737 MAX 8",
        flight: "WY312 - Muscat to Riyadh",
        date: "12 Dec 2024",
        location: "Over Arabian Gulf",
        summary:
            "Cabin pressure anomaly triggered an emergency descent and diversion to Muscat. No injuries reported.",
        timeline: [
            {
                time: "06:12:47",
                speaker: "Cabin",
                role: "System",
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

const defaultCasePreviews = FALLBACK_CASES.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    summary: item.summary,
    aircraft: item.aircraft,
    location: item.location,
    source: item,
    template: item,
    hasFdrData: true,
    hasCvrData: true,
    canCorrelate: true,
}));

const parameterColors = {
    altitude: "#22c55e",
    heading: "#0ea5e9",
    speed: "#ef4444",
};

const emotionBadge = (emotion, color) => (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>{emotion}</span>
);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const hydrateCaseData = (option, templateCandidate) => {
    if (!option) {
        return null;
    }

    const template = templateCandidate || option.template || FALLBACK_CASES[0];
    const source = option.source && typeof option.source === "object" ? option.source : {};

    const sourceTimeline = ensureArray(source.timeline);
    const sourceParameters = ensureArray(source.parameters);

    const timeline = sourceTimeline.length > 0 ? sourceTimeline : ensureArray(template.timeline);
    const parameters =
        sourceParameters.length > 0 ? sourceParameters : ensureArray(template.parameters);

    const highlightedEmotion =
        source.highlightedEmotion || template.highlightedEmotion || {
            speaker: "Correlation Engine",
            emotion: "Awaiting synchronized events.",
            emotionColor: "bg-slate-100 text-slate-600",
        };

    const keyParameters =
        (source.keyParameters && typeof source.keyParameters === "object"
            ? source.keyParameters
            : template.keyParameters) || {};

    const availability = getRecorderAvailability(source);

    const hasFdrData = option.hasFdrData ?? availability.hasFdrData ?? true;
    const hasCvrData = option.hasCvrData ?? availability.hasCvrData ?? true;

    return {
        ...template,
        ...option,
        timeline,
        parameters,
        keyParameters,
        highlightedEmotion,
        hasFdrData,
        hasCvrData,
        canCorrelate: Boolean(option.canCorrelate ?? (hasFdrData && hasCvrData)),
    };
};

const Correlate = ({ caseNumber }) => {
    const [workflowStage, setWorkflowStage] = useState(
        caseNumber ? "loading" : "caseSelection"
    );
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [linkError, setLinkError] = useState("");
    const loadingTimerRef = useRef(null);
    const lastLinkedCaseRef = useRef(null);

    const { recentCases, loading: isRecentLoading, error: recentCasesError } = useRecentCases(3);

    const caseSelectionOptions = useMemo(() => {
        if (!recentCases || recentCases.length === 0) {
            return defaultCasePreviews;
        }

        const mapped = recentCases
            .map((record, index) => {
                const preview = buildCasePreview(record);
                if (!preview) {
                    return null;
                }

                const fallbackTemplate =
                    defaultCasePreviews[index % defaultCasePreviews.length].template;

                return {
                    ...preview,
                    location: preview.location || fallbackTemplate.location,
                    template: fallbackTemplate,
                };
            })
            .filter(Boolean);

        return mapped.length > 0 ? mapped : defaultCasePreviews;
    }, [recentCases]);

    const selectedOption = useMemo(() => {
        if (!selectedCaseId) {
            return null;
        }

        return caseSelectionOptions.find((item) => item.id === selectedCaseId) || null;
    }, [caseSelectionOptions, selectedCaseId]);

    useEffect(() => {
        return () => {
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!caseNumber) {
            lastLinkedCaseRef.current = null;
            setLinkError("");
            setSelectedCaseId(null);
            setSelectedCase(null);
            setWorkflowStage("caseSelection");
            return;
        }

        if (lastLinkedCaseRef.current === caseNumber) {
            return;
        }

        setWorkflowStage("loading");
        setLinkError("");

        fetchCaseByNumber(caseNumber)
            .then((data) => {
                const preview = buildCasePreview(data);
                if (!preview) {
                    throw new Error("Unable to open the selected case.");
                }

                const template =
                    caseSelectionOptions.find((item) => item.id === preview.id)?.template ||
                    FALLBACK_CASES[0];

                const hydrated = hydrateCaseData(preview, template);

                setSelectedCaseId(preview.id);
                setSelectedCase(hydrated);
                lastLinkedCaseRef.current = caseNumber;

                if (!hydrated?.canCorrelate) {
                    setWorkflowStage("caseSelection");
                    setLinkError(
                        "Correlation requires both FDR and CVR data to be uploaded for this case."
                    );
                    return;
                }

                setWorkflowStage("analysis");
            })
            .catch((error) => {
                setLinkError(error?.message || "Unable to open the selected case.");
                setSelectedCaseId(null);
                setSelectedCase(null);
                setWorkflowStage("caseSelection");
                lastLinkedCaseRef.current = null;
            });
    }, [caseNumber, caseSelectionOptions]);

    useEffect(() => {
        if (workflowStage !== "caseSelection") {
            return;
        }

        if (!selectedOption) {
            setSelectedCase(null);
            return;
        }

        const hydrated = hydrateCaseData(selectedOption, selectedOption.template);
        setSelectedCase(hydrated);
    }, [selectedOption, workflowStage]);

    const handleCaseSelect = (option) => {
        setSelectedCaseId(option.id);
        const hydrated = hydrateCaseData(option, option.template);
        setSelectedCase(hydrated);

        if (!hydrated?.canCorrelate) {
            setLinkError("Correlation requires both FDR and CVR data to be uploaded for this case.");
        } else {
            setLinkError("");
        }
    };

    const handleStartCorrelation = () => {
        if (!selectedCase?.canCorrelate) {
            return;
        }

        setWorkflowStage("loading");
        loadingTimerRef.current = setTimeout(() => {
            setWorkflowStage("analysis");
        }, 800);
    };

    const handleNavigateToCases = () => {
        window.dispatchEvent(new Event("navigateToCases"));
    };

    const timeline = ensureArray(selectedCase?.timeline);
    const parameters = ensureArray(selectedCase?.parameters);
    const keyParameters =
        selectedCase?.keyParameters && typeof selectedCase.keyParameters === "object"
            ? selectedCase.keyParameters
            : {};
    const highlightedEmotion = selectedCase?.highlightedEmotion || {
        speaker: "Correlation Engine",
        emotion: "Awaiting synchronized insights.",
        emotionColor: "bg-slate-100 text-slate-600",
    };

    const primaryEvent =
        timeline[3] ||
        timeline[0] || {
            time: "00:00:00",
            transcript: "No synchronized events available yet.",
            fdrEvent: "Correlation pending",
            fdrValue: "Awaiting data",
            emotion: "Neutral",
            emotionColor: "bg-slate-100 text-slate-600",
            speaker: "Correlation Engine",
            role: "",
        };

    const timelineStart = timeline[0]?.time || "Start TBD";
    const timelineEnd = timeline[timeline.length - 1]?.time || "End TBD";

    if (workflowStage === "caseSelection") {
        const missingSources = [];
        if (selectedOption?.hasFdrData === false) {
            missingSources.push("FDR");
        }
        if (selectedOption?.hasCvrData === false) {
            missingSources.push("CVR");
        }

        const missingLabel =
            missingSources.length === 2
                ? "FDR and CVR data uploads"
                : missingSources.length === 1
                ? `${missingSources[0]} data upload`
                : "";

        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-600">Correlation Workspace</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Select a Case to Synchronize FDR &amp; CVR
                    </h1>
                    <p className="text-gray-600 max-w-3xl">
                        Choose the investigation file you want to align first. Once a case is selected, the system will load the
                        cockpit transcript, flight recorder data, and correlation insights for synchronized analysis.
                    </p>
                </header>

                {(recentCasesError || linkError) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {linkError || recentCasesError}
                    </div>
                )}

                {isRecentLoading && caseSelectionOptions.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                        Loading recent cases...
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseSelectionOptions.map((item) => {
                        const isActive = item.id === selectedCaseId;
                        const requiresData = item.hasFdrData === false || item.hasCvrData === false;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleCaseSelect(item)}
                                className={`text-left rounded-2xl border transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                                    isActive ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"
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
                                    {requiresData && (
                                        <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                                            <AlertTriangle className="h-3 w-3" />
                                            {[item.hasFdrData === false ? "FDR" : null, item.hasCvrData === false ? "CVR" : null]
                                                .filter(Boolean)
                                                .join(" & ")}{" "}
                                            data required
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

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-gray-500">
                        Select a case to unlock synchronized analysis of recorder sources.
                    </p>
                    <button
                        type="button"
                        disabled={!selectedCase?.canCorrelate}
                        onClick={handleStartCorrelation}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-50 bg-emerald-600 hover:bg-emerald-700"
                    >
                        Start synchronization
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    {!selectedCase?.canCorrelate && selectedCaseId && (
                        <p className="text-xs font-medium text-amber-600 md:ml-4 md:text-right">
                            Correlation requires {missingLabel}. Please upload the missing data before continuing.
                        </p>
                    )}
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
                        <span className="font-semibold"> {selectedCase?.id || "the selected case"}</span>. Sit tight while we
                        fetch correlation highlights.
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

    if (!selectedCase) {
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

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                            Correlation Workspace
                        </p>
                        <h1 className="text-2xl font-semibold text-gray-900">FDR &amp; CVR Synchronization</h1>
                        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                            Review synchronized cockpit voice and flight recorder data to understand how timeline events align across
                            both sources.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                            <Workflow className="h-4 w-4" /> Analysis ready
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm">
                            <PlaneTakeoff className="h-4 w-4 text-emerald-600" /> {selectedCase.flight || "Flight details pending"}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Highlighted Emotion</p>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                                {highlightedEmotion.speaker?.charAt(0) || "C"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{highlightedEmotion.speaker}</p>
                                <p className="text-sm text-gray-600">{highlightedEmotion.emotion}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Key Parameters</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            {Object.entries(keyParameters).map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs text-gray-500 uppercase">{label}</p>
                                    <p className="text-sm font-semibold text-gray-900">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Primary Synchronized Event</p>
                                <h2 className="text-xl font-semibold text-gray-900">{primaryEvent.transcript}</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Occurred at <span className="font-semibold">{primaryEvent.time}</span> from {primaryEvent.speaker || "Unknown"}
                                </p>
                            </div>
                            {emotionBadge(primaryEvent.emotion, primaryEvent.emotionColor || "bg-slate-100 text-slate-600")}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500 uppercase">FDR Event</p>
                                <p className="text-sm font-semibold text-gray-900">{primaryEvent.fdrEvent}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500 uppercase">Recorded Value</p>
                                <p className="text-sm font-semibold text-gray-900">{primaryEvent.fdrValue}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-xs text-gray-500 uppercase">Timeline Window</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {timelineStart} – {timelineEnd}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Timeline Alignment</p>
                                <h2 className="text-xl font-semibold text-gray-900">Event Correlation</h2>
                                <p className="text-sm text-gray-600">
                                    Review how cockpit interactions align with recorded parameters across the flight window.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {timeline.length} synchronized points
                            </span>
                        </div>

                        <div className="mt-4 space-y-4">
                            {timeline.map((entry) => (
                                <div
                                    key={`${entry.time}-${entry.transcript}`}
                                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                                                {entry.speaker?.charAt(0) || "C"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {entry.speaker || "Unknown speaker"}
                                                </p>
                                                <p className="text-xs text-gray-500">{entry.role || "Timeline Event"}</p>
                                            </div>
                                        </div>
                                        {emotionBadge(
                                            entry.emotion || "Neutral",
                                            entry.emotionColor || "bg-slate-100 text-slate-600"
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm text-gray-700">{entry.transcript}</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg bg-white px-3 py-2">
                                            <p className="text-xs text-gray-500 uppercase">FDR Reference</p>
                                            <p className="text-sm font-semibold text-gray-900">{entry.fdrEvent || "N/A"}</p>
                                        </div>
                                        <div className="rounded-lg bg-white px-3 py-2">
                                            <p className="text-xs text-gray-500 uppercase">Recorder Value</p>
                                            <p className="text-sm font-semibold text-gray-900">{entry.fdrValue || "Not captured"}</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs font-medium text-gray-500">Timestamp: {entry.time}</p>
                                </div>
                            ))}

                            {timeline.length === 0 && (
                                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                                    Correlation timeline will populate once synchronized recorder events are available for this case.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Flight Recorder Trends</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Key parameters extracted from the selected timeline window.
                        </p>
                        <div className="mt-4 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={parameters} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
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
                                Data window aligned from <span className="font-semibold">{timelineStart}</span> to
                                <span className="font-semibold"> {timelineEnd}</span>.
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
            </div>
        </div>
    );
};

export default Correlate;
