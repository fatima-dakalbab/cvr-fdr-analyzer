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
import { runFdrAnomalyDetection } from "../api/anomaly";
import useRecentCases from "../hooks/useRecentCases";
import { buildCasePreview } from "../utils/caseDisplay";
import { evaluateModuleReadiness } from "../utils/analysisAvailability";
import { fetchAttachmentFromObjectStore } from "../utils/storage";
import { fdrParameterMap } from "../config/fdr-parameters";

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

const colorPalette = [
    "#059669",
    "#0ea5e9",
    "#f59e0b",
    "#6366f1",
    "#334155",
    "#10b981",
    "#34d399",
    "#22d3ee",
    "#0284c7",
    "#a855f7",
    "#f97316",
    "#ef4444",
    "#3b82f6",
    "#14b8a6",
    "#f472b6",
];

const normalizeHeader = (value = "") => String(value || "").trim().toLowerCase();

const knownParameterMetadata = fdrParameterMap.map((entry) => ({
    ...entry,
    normalizedId: normalizeHeader(entry.id),
    normalizedLabel: normalizeHeader(entry.label),
}));

const timeColumnExclusions = new Set([
    "session time",
    "system time",
    "gps date & time",
]);

const parameterGroupDefinitions = [
    {
        key: "engines-fuel",
        title: "Engines & Fuel",
        keywords: [
            "rpm",
            "manifold pressure",
            "fuel flow",
            "fuel pressure",
            "fuel level",
            "percent power",
            "egt",
            "cht",
            "thermocouple",
        ],
    },
    {
        key: "flight-dynamics-energy",
        title: "Flight Dynamics – Energy / Kinematics",
        keywords: [
            "indicated airspeed",
            "true airspeed",
            "ground speed",
            "vertical speed",
            "pressure altitude",
            "gps altitude",
            "density altitude",
            "angle of attack",
            "acceleration",
        ],
    },
    {
        key: "flight-dynamics-attitude",
        title: "Flight Dynamics – Attitude",
        keywords: ["pitch", "roll", "turn rate", "magnetic heading"],
    },
    {
        key: "navigation",
        title: "Navigation",
        keywords: [
            "latitude",
            "longitude",
            "ground track",
            "cross track error",
            "bearing",
            "range to destination",
        ],
    },
    {
        key: "environment",
        title: "Environment",
        keywords: ["oat", "wind speed", "wind direction", "barometer setting"],
    },
    {
        key: "autopilot-systems",
        title: "Autopilot/Systems",
        prefixes: ["ap", "cdi", "transponder"],
    },
    {
        key: "other",
        title: "Other / GP Inputs",
        keywords: ["gp input"],
        fallback: true,
    },
];

const defaultVisibleChartsPerGroup = 8;
const maxChartPoints = 400;

const sampleNormalizedRows = [
    {
        time: "00:00",
        "GPS Altitude (feet)": 1200,
        "Pressure Altitude (ft)": 1185,
        "Indicated Airspeed (knots)": 145,
        "Ground Speed (knots)": 140,
        "True Airspeed (knots)": 148,
        "Vertical Speed (ft/min)": 450,
        "Magnetic Heading (deg)": 92,
        "RPM L": 2200,
        "RPM R": 2180,
        "Fuel Flow 1 (gal/hr)": 8.2,
        "OAT (deg C)": 18,
        "Latitude (deg)": 24.45,
        "Longitude (deg)": 54.38,
        "Pitch (deg)": 3,
        "Roll (deg)": 0.2,
    },
    {
        time: "00:10",
"GPS Altitude (feet)": 1800,
        "Pressure Altitude (ft)": 1782,
        "Indicated Airspeed (knots)": 152,
        "Ground Speed (knots)": 149,
        "True Airspeed (knots)": 156,
        "Vertical Speed (ft/min)": 520,
        "Magnetic Heading (deg)": 94,
        "RPM L": 2250,
        "RPM R": 2230,
        "Fuel Flow 1 (gal/hr)": 8.6,
        "OAT (deg C)": 17.5,
        "Latitude (deg)": 24.46,
        "Longitude (deg)": 54.39,
        "Pitch (deg)": 3.4,
        "Roll (deg)": 0.1,
    },
    {
        time: "00:20",
        "GPS Altitude (feet)": 2400,
        "Pressure Altitude (ft)": 2388,
        "Indicated Airspeed (knots)": 160,
        "Ground Speed (knots)": 157,
        "True Airspeed (knots)": 164,
        "Vertical Speed (ft/min)": 580,
        "Magnetic Heading (deg)": 96,
        "RPM L": 2310,
        "RPM R": 2290,
        "Fuel Flow 1 (gal/hr)": 9.1,
        "OAT (deg C)": 17,
        "Latitude (deg)": 24.47,
        "Longitude (deg)": 54.41,
        "Pitch (deg)": 3.9,
        "Roll (deg)": -0.1,
    },
    {
        time: "00:30",
        "GPS Altitude (feet)": 2900,
        "Pressure Altitude (ft)": 2885,
        "Indicated Airspeed (knots)": 166,
        "Ground Speed (knots)": 164,
        "True Airspeed (knots)": 171,
        "Vertical Speed (ft/min)": 540,
        "Magnetic Heading (deg)": 99,
        "RPM L": 2360,
        "RPM R": 2340,
        "Fuel Flow 1 (gal/hr)": 9.4,
        "OAT (deg C)": 16.4,
        "Latitude (deg)": 24.48,
        "Longitude (deg)": 54.42,
        "Pitch (deg)": 4.1,
        "Roll (deg)": -0.3,
    },
    {
        time: "00:40",
        "GPS Altitude (feet)": 3200,
        "Pressure Altitude (ft)": 3190,
        "Indicated Airspeed (knots)": 170,
        "Ground Speed (knots)": 168,
        "True Airspeed (knots)": 176,
        "Vertical Speed (ft/min)": 510,
        "Magnetic Heading (deg)": 101,
        "RPM L": 2385,
        "RPM R": 2365,
        "Fuel Flow 1 (gal/hr)": 9.6,
        "OAT (deg C)": 16,
        "Latitude (deg)": 24.49,
        "Longitude (deg)": 54.43,
        "Pitch (deg)": 4.2,
        "Roll (deg)": -0.6,
    },
    {
        time: "00:50",
        "GPS Altitude (feet)": 3600,
        "Pressure Altitude (ft)": 3592,
        "Indicated Airspeed (knots)": 176,
        "Ground Speed (knots)": 174,
        "True Airspeed (knots)": 181,
        "Vertical Speed (ft/min)": 470,
        "Magnetic Heading (deg)": 102,
        "RPM L": 2410,
        "RPM R": 2388,
        "Fuel Flow 1 (gal/hr)": 9.8,
        "OAT (deg C)": 15.6,
        "Latitude (deg)": 24.5,
        "Longitude (deg)": 54.44,
        "Pitch (deg)": 4.3,
        "Roll (deg)": -0.4,
    },
];

const detectionTrendKeys = [
    "GPS Altitude (feet)",
    "Indicated Airspeed (knots)",
    "RPM L",
    "RPM R",
    "Vertical Speed (ft/min)",
];

const analysisLabel = "Behavioral Anomaly Detection (Unsupervised)";

const toNumber = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const trimmedValue = typeof value === "string" ? value.trim() : value;
    if (trimmedValue === "") {
        return null;
    }

    const numeric = Number(trimmedValue);
    return Number.isFinite(numeric) ? numeric : null;
};

const getKnownParameterMatch = (header = "") => {
    const normalized = normalizeHeader(header);
    return (
        knownParameterMetadata.find(
            (entry) =>
                normalized === entry.normalizedId ||
                normalized === entry.normalizedLabel ||
                normalized.includes(entry.normalizedId)
        ) || null
    );
};

const parseParameterHeader = (header = "") => {
    const match = String(header).match(/\(([^)]+)\)\s*$/);
    const unit = match ? match[1].trim() : "";
    const label = match ? header.replace(match[0], "").trim() : header.trim();
    return { label, unit };
};

const getParameterDisplayMeta = (header = "") => {
    const known = getKnownParameterMatch(header);
    if (known) {
        return { label: known.label || header, unit: known.unit || "" };
    }

    return parseParameterHeader(header);
};

const getParameterLabel = (header) => getParameterDisplayMeta(header).label || header;

const isExcludedTimeColumn = (header = "") =>
    timeColumnExclusions.has(normalizeHeader(header));

const splitCsvLine = (line = "") => {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === "\"") {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            cells.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
};

const parseCsvRows = (text) => {
    if (!text) {
        return { headers: [], rows: [] };
    }

    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        return { headers: [], rows: [] };
    }

    const headers = splitCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
        const cells = splitCsvLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header] = cells[index] || "";
        });

        return row;
    });

    return { headers, rows };
};

const formatSessionTime = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    const seconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const resolveTimeLabel = (row, index) => {
    const systemTime = row["System Time"] || row["GPS Date & Time"];
    if (systemTime) {
        return systemTime;
    }

    const sessionSeconds = toNumber(row["Session Time"]);
    if (sessionSeconds !== null) {
        return formatSessionTime(sessionSeconds);
    }

    return `T+${index}s`;
};

const normalizeFdrRows = (csvText) => {
    const { headers, rows: rawRows } = parseCsvRows(csvText);
    const numericHeaders = headers.filter(
        (header) =>
            !isExcludedTimeColumn(header) &&
            rawRows.some((row) => toNumber(row[header]) !== null)
    );

    const rows = rawRows.map((row, index) => {
        const normalized = { time: resolveTimeLabel(row, index) };

        numericHeaders.forEach((header) => {
            const value = toNumber(row[header]);
            if (value !== null) {
                normalized[header] = value;
            }
        });

        return normalized;
    });

    return { rows, numericHeaders };
};

const hasNumericValue = (row, keys) =>
    keys.some((key) => typeof row[key] === "number" && !Number.isNaN(row[key]));

const truncateSeries = (series, maxPoints = maxChartPoints) =>
    series.length > maxPoints ? series.slice(0, maxPoints) : series;

const deriveAvailableParameters = (rows, orderedHeaders = []) => {
    const available = new Set();

    orderedHeaders.forEach((header) => {
        if (rows.some((row) => hasNumericValue(row, [header]))) {
            available.add(header);
        }
    });

    if (available.size === 0) {
        rows.forEach((row) => {
            Object.entries(row).forEach(([key, value]) => {
                if (key !== "time" && typeof value === "number" && !Number.isNaN(value)) {
                    available.add(key);
                }
            });
        });
    }

    return Array.from(available);
};

const buildParameterTable = (rows, parameters) =>
    parameters
        .map((parameter) => {
            const values = rows
                .map((row) => row[parameter])
                .filter((value) => typeof value === "number" && !Number.isNaN(value));

            if (values.length === 0) {
                return null;
            }

            const min = Math.min(...values);
            const max = Math.max(...values);
            const { label, unit } = getParameterDisplayMeta(parameter);

            return {
                parameter: label || parameter,
                unit: unit || "",
                min: Number(min.toFixed(1)),
                max: Number(max.toFixed(1)),
            };
        })
        .filter(Boolean);

const buildDetectionTrendSeries = (rows) =>
    truncateSeries(
        rows
            .filter((row) => row.time && hasNumericValue(row, detectionTrendKeys))
            .map((row) => {
                const entry = { time: row.time };
                detectionTrendKeys.forEach((key) => {
                    if (row[key] !== undefined) {
                        entry[key] = row[key];
                    }
                });
                return entry;
            }),
        240
    );

const buildScoreTimelineSeries = (timeline) => {
    if (!timeline || !Array.isArray(timeline.time) || !Array.isArray(timeline.score)) {
        return [];
    }

    const length = Math.min(timeline.time.length, timeline.score.length);
    const series = Array.from({ length }, (_, index) => ({
        time: timeline.time[index],
        score: timeline.score[index],
    }));

    return truncateSeries(series, 480);
};

const summarizeSeriesProfile = (data = [], key) => {
    const values = data
        .map((row) => row?.[key])
        .filter((value) => typeof value === "number" && !Number.isNaN(value));

    if (values.length === 0) {
        return { isBinary: false, isLowCardinality: false, isMultiScale: false };
    }

    const uniqueValues = new Set(values);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = max - min;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const isBinary =
        uniqueValues.size <= 2 &&
        Array.from(uniqueValues).every((value) => value === 0 || value === 1);
    const isLowCardinality = uniqueValues.size <= 6;
    const isMultiScale = Math.abs(spread) > Math.max(1000, Math.abs(mean) * 25);

    return { isBinary, isLowCardinality, isMultiScale };
};

const getSeriesRenderConfig = (data = [], key) => {
    const profile = summarizeSeriesProfile(data, key);

    if (profile.isBinary) {
        return { variant: "line", lineType: "stepAfter" };
    }

    if (profile.isLowCardinality) {
        return { variant: "bar" };
    }

    return { variant: "line", lineType: "monotone" };
};

const sampleParameterHeaders = Object.keys(sampleNormalizedRows[0] || {}).filter(
    (key) => key !== "time"
);
const defaultAvailableParameters = deriveAvailableParameters(
    sampleNormalizedRows,
    sampleParameterHeaders
);
const defaultParameterTableRows = buildParameterTable(
    sampleNormalizedRows,
    defaultAvailableParameters
);
const defaultDetectionTrendSamples = buildDetectionTrendSeries(sampleNormalizedRows);

export default function FDR({ caseNumber: propCaseNumber }) {
    const { caseNumber: routeCaseNumber } = useParams();
    const caseNumber = propCaseNumber || routeCaseNumber;
    const navigate = useNavigate();
    const [selectedCase, setSelectedCase] = useState(null);
    const [isRunningDetection, setIsRunningDetection] = useState(false);
    const [detectionTrendData, setDetectionTrendData] = useState(
        defaultDetectionTrendSamples
    );
    const [parameterTableRows, setParameterTableRows] = useState(
        defaultParameterTableRows
    );
    const [availableParameters, setAvailableParameters] = useState(
        defaultAvailableParameters
    );
    const [normalizedRows, setNormalizedRows] = useState(sampleNormalizedRows);
    const [chartFilterText, setChartFilterText] = useState("");
    const [expandedGroups, setExpandedGroups] = useState(() => new Set());
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [anomalyError, setAnomalyError] = useState("");
    const [isLoadingFdrData, setIsLoadingFdrData] = useState(false);
    const [fdrDataError, setFdrDataError] = useState("");
    const isLinkedRoute = Boolean(caseNumber);
    const [workflowStage, setWorkflowStage] = useState(
        isLinkedRoute ? "analysis" : "caseSelection"
    );
    const detectionScopeLabel =
        availableParameters.length > 0
            ? "All numeric parameters"
            : "No numeric parameters were detected in the uploaded file.";
    const parameterDisplayMap = useMemo(() => {
        const map = {};
        (availableParameters || []).forEach((parameter, index) => {
            const display = getParameterDisplayMeta(parameter);
            map[parameter] = {
                ...display,
                label: display.label || parameter,
                color: colorPalette[index % colorPalette.length],
            };
        });
        return map;
    }, [availableParameters]);
    const filteredParameters = useMemo(() => {
        const filter = chartFilterText.trim().toLowerCase();
        if (!filter) {
            return availableParameters;
        }

        return (availableParameters || []).filter((parameter) => {
            const meta = parameterDisplayMap[parameter];
            const label = meta?.label || parameter;
            return (
                label.toLowerCase().includes(filter) ||
                parameter.toLowerCase().includes(filter)
            );
        });
    }, [availableParameters, chartFilterText, parameterDisplayMap]);
    const groupedParameters = useMemo(() => {
        const groups = parameterGroupDefinitions.map((definition) => ({
            ...definition,
            parameters: [],
        }));
        const fallbackGroup = groups.find((group) => group.fallback);

        const matchGroup = (parameter) => {
            const meta = parameterDisplayMap[parameter];
            const label = meta?.label || parameter;
            const normalized = normalizeHeader(`${label} ${parameter}`);

            return (
                groups.find((group) => {
                    if (group.keywords?.length) {
                        return group.keywords.some((keyword) =>
                            normalized.includes(normalizeHeader(keyword))
                        );
                    }

                    if (group.prefixes?.length) {
                        return group.prefixes.some((prefix) => {
                            const normalizedPrefix = normalizeHeader(prefix);
                            return (
                                normalizeHeader(parameter).startsWith(normalizedPrefix) ||
                                normalizeHeader(label).startsWith(normalizedPrefix)
                            );
                        });
                    }

                    return false;
                }) || fallbackGroup
            );
        };

        filteredParameters.forEach((parameter) => {
            const group = matchGroup(parameter);
            if (group) {
                group.parameters.push(parameter);
            }
        });

        return groups.filter((group) => group.parameters.length > 0);
    }, [filteredParameters, parameterDisplayMap]);
    const segments = useMemo(() => {
        if (!anomalyResult) {
            return [];
        }

        const list =
            anomalyResult.segments ||
            anomalyResult.segment ||
            anomalyResult.anomalies ||
            anomalyResult.sampleRows ||
            anomalyResult.samples;

        return Array.isArray(list) ? list : [];
    }, [anomalyResult]);
    const analysisTitle = analysisLabel;
    useEffect(() => {
        if (!anomalyResult) {
            return;
        }

        const anomalyCountForLog =
            anomalyResult.summary?.segments_found ??
            anomalyResult.anomalyCount ??
            anomalyResult.detectedCount ??
            anomalyResult.anomalies?.length ??
            anomalyResult.count ??
            null;

        console.debug("[FDR] Detection result state updated", {
            anomalyCount: anomalyCountForLog,
            segments: segments.length,
            totalRows:
                anomalyResult.summary?.n_rows ??
                anomalyResult.totalRows ??
                anomalyResult.evaluatedRows ??
                anomalyResult.total ??
                anomalyResult.total_rows ??
                (Array.isArray(normalizedRows) ? normalizedRows.length : undefined),
        });
    }, [anomalyResult, normalizedRows, segments.length]);
    const { recentCases, loading: isRecentLoading, error: recentCasesError } =
        useRecentCases(3);
    const caseSelectionOptions = useMemo(() => {
        const mapped = recentCases
            .map((item) => buildCasePreview(item))
            .filter(Boolean);
        return mapped.length > 0 ? mapped : defaultCaseOptions;
    }, [recentCases]);
    const [linkError, setLinkError] = useState("");
    const [missingDataTypes, setMissingDataTypes] = useState([]);
    const lastLinkedCaseRef = useRef(null);

    useEffect(() => {
        if (!caseNumber) {
            lastLinkedCaseRef.current = null;
            setMissingDataTypes([]);
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
        setMissingDataTypes([]);

        fetchCaseByNumber(caseNumber)
            .then((data) => {
                if (!isMounted) {
                    return;
                }

                const evaluation = evaluateModuleReadiness(data, "fdr");
                if (!evaluation.ready) {
                    setLinkError(evaluation.message);
                    setMissingDataTypes(evaluation.missingTypes || []);
                    setSelectedCase(null);
                    setWorkflowStage("analysis");
                    return;
                }

                const preview = buildCasePreview(data);
                setSelectedCase(preview);
                setWorkflowStage("analysis");
                lastLinkedCaseRef.current = caseNumber;
                setLinkError("");
                setMissingDataTypes([]);
            })
            .catch((err) => {
                if (!isMounted) {
                    return;
                }

                setLinkError(err?.message || "Unable to open the selected case");
                setMissingDataTypes([]);
                setSelectedCase(null);
                setWorkflowStage(isLinkedRoute ? "analysis" : "caseSelection");
            });

        return () => {
            isMounted = false;
        };
    }, [caseNumber, navigate, selectedCase, isLinkedRoute]);

    useEffect(() => {
        const caseData = selectedCase?.source;

        if (!caseData) {
            setDetectionTrendData(defaultDetectionTrendSamples);
            setParameterTableRows(defaultParameterTableRows);
            setAvailableParameters(defaultAvailableParameters);
            setFdrDataError("");
            setIsLoadingFdrData(false);
            return;
        }

        const attachments = Array.isArray(caseData.attachments)
            ? caseData.attachments
            : [];

        const fdrAttachment = attachments.find((item) => {
            const type = (item?.type || "").toUpperCase();
            const status = (item?.status || "").toLowerCase();
            const name = (item?.name || "").toLowerCase();
            const storageKey = item?.storage?.objectKey || item?.storage?.key;

            return (
                Boolean(storageKey) &&
                status !== "pending" &&
                !name.includes("pending upload") &&
                (type === "FDR" || name.endsWith(".csv") || name.includes("fdr"))
            );
        });

        if (!fdrAttachment) {
            setDetectionTrendData(defaultDetectionTrendSamples);
            setParameterTableRows(defaultParameterTableRows);
            setAvailableParameters([]);
            setNormalizedRows(sampleNormalizedRows);
            setFdrDataError("The selected case does not include an uploaded FDR file.");
            setIsLoadingFdrData(false);
            return;
        }

        const controller = new AbortController();
        setIsLoadingFdrData(true);
        setFdrDataError("");

        fetchAttachmentFromObjectStore({
            bucket: fdrAttachment.storage?.bucket,
            objectKey: fdrAttachment.storage?.objectKey || fdrAttachment.storage?.key,
            fileName: fdrAttachment.name,
            contentType: fdrAttachment.contentType,
            signal: controller.signal,
        })
            .then((text) => {
                if (controller.signal.aborted) {
                    return;
                }

                const { rows, numericHeaders } = normalizeFdrRows(text);
                if (rows.length === 0) {
                    throw new Error(
                        "The FDR file was downloaded but contained no readable rows."
                    );
                }

                const availability = deriveAvailableParameters(rows, numericHeaders);
                const parameterTable = buildParameterTable(rows, availability);
                const trends = buildDetectionTrendSeries(rows);
                setNormalizedRows(rows);

                setDetectionTrendData(
                    trends.length > 0 ? trends : defaultDetectionTrendSamples
                );

                setParameterTableRows(
                    parameterTable.length > 0
                        ? parameterTable
                        : defaultParameterTableRows
                );

                setAvailableParameters(
                    availability.length > 0
                        ? availability
                        : defaultAvailableParameters
                );
                setFdrDataError("");
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

                setDetectionTrendData(defaultDetectionTrendSamples);
                setParameterTableRows(defaultParameterTableRows);
                setAvailableParameters([]);
                setNormalizedRows(sampleNormalizedRows);
                const status = error?.status ? ` (status ${error.status})` : "";
                setFdrDataError(
                    error?.message
                        ? `${error.message}${status}`
                        : "Unable to load the FDR attachment."
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingFdrData(false);
                }
            });

        return () => controller.abort();
    }, [selectedCase]);

    const handleNavigateToCases = () => {
        navigate("/cases");
    };

    const handleUploadMissingData = () => {
        if (!caseNumber) {
            return;
        }

        const normalizedMissing = missingDataTypes.map((type) => String(type || "").toLowerCase());
        const hasFdr = normalizedMissing.includes("fdr");
        const hasCvr = normalizedMissing.includes("cvr");

        let focusUpload = "";
        if (hasFdr && hasCvr) {
            focusUpload = "both";
        } else if (hasFdr) {
            focusUpload = "fdr";
        } else if (hasCvr) {
            focusUpload = "cvr";
        }

        navigate("/cases", {
            state: {
                editCaseNumber: caseNumber,
                focusUpload,
                attemptedCase: caseNumber,
            },
        });
    };

    const handleChangeCase = () => {
        if (isLinkedRoute) {
            navigate("/cases");
            return;
        }
        setWorkflowStage("caseSelection");
        setLinkError("");
        setMissingDataTypes([]);
    };

    const handleToggleGroup = (groupKey) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    const handleRunDetection = async () => {
        if (availableParameters.length === 0 || !caseNumber) {
            return;
        }

        setIsRunningDetection(true);
        setAnomalyError("");
        setAnomalyResult(null);

        try {
            const result = await runFdrAnomalyDetection(caseNumber, {
                rows: normalizedRows,
            });
            setAnomalyResult(result);
            setWorkflowStage((prev) =>
                prev === "analysis" ? "detectionComplete" : prev
            );
        } catch (error) {
            setAnomalyResult(null);
            setAnomalyError(
                error?.message || "Unable to run anomaly detection for this case."
            );
        } finally {
            setIsRunningDetection(false);
        }
    };

    const totalRows =
        anomalyResult?.summary?.n_rows ??
        anomalyResult?.totalRows ??
        anomalyResult?.evaluatedRows ??
        anomalyResult?.total_rows ??
        anomalyResult?.total ??
        (Array.isArray(normalizedRows) ? normalizedRows.length : null);
    const anomalyCount =
        anomalyResult?.summary?.segments_found ??
        anomalyResult?.segments?.length ??
        anomalyResult?.anomalyCount ??
        anomalyResult?.detectedCount ??
        anomalyResult?.anomalies?.length ??
        anomalyResult?.count ??
        segments.length ??
        null;
    const flaggedRowCount =
        anomalyResult?.summary?.flaggedRowCount ??
        anomalyResult?.summary?.flagged_row_count ??
        anomalyResult?.flaggedRowCount ??
        anomalyResult?.flagged_row_count ??
        null;
    const flaggedPercent =
        anomalyResult?.summary?.flaggedPercent ??
        anomalyResult?.summary?.flagged_percent ??
        anomalyResult?.flaggedPercent ??
        anomalyResult?.flagged_percent ??
        null;
    const noAnomaliesDetected = Boolean(anomalyResult) && anomalyCount === 0;
    const topAnomalyParameters = useMemo(() => {
        if (!anomalyResult) {
            return [];
        }

        const counts = new Map();
        const addCount = (name, value = 1) => {
            if (!name) {
                return;
            }

            const displayName = getParameterLabel(name) || name;
            const increment = Number.isFinite(value) ? value : 1;
            counts.set(displayName, (counts.get(displayName) || 0) + increment);
        };

        const parameterBreakdown =
            anomalyResult.summary?.top_parameters ||
            anomalyResult.topParameters ||
            anomalyResult.top_parameters ||
            anomalyResult.parameterCounts ||
            anomalyResult.parameter_counts ||
            anomalyResult.parameterBreakdown ||
            anomalyResult.parameter_breakdown;

        if (parameterBreakdown) {
            if (Array.isArray(parameterBreakdown)) {
                parameterBreakdown.forEach((item) =>
                    addCount(
                        item?.parameter || item?.name || item?.field,
                        item?.count || item?.anomalies || item?.total
                    )
                );
            } else if (typeof parameterBreakdown === "object") {
                Object.entries(parameterBreakdown).forEach(([key, value]) => {
                    addCount(key, Number(value));
                });
            }
        }

        if (Array.isArray(segments)) {
            segments.forEach((segment) => {
                const drivers = Array.isArray(segment?.top_drivers)
                    ? segment.top_drivers
                    : segment?.drivers;
                if (Array.isArray(drivers)) {
                    drivers.forEach((driver) =>
                        addCount(driver?.parameter || driver?.name || driver?.field)
                    );
                }
            });
        }

        return Array.from(counts.entries())
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [anomalyResult, segments]);
    const displayedTopParameters = useMemo(() => {
        const providedTopParameters =
            anomalyResult?.summary?.top_parameters ||
            anomalyResult?.topParameters ||
            anomalyResult?.top_parameters;

        if (Array.isArray(providedTopParameters) && providedTopParameters.length > 0) {
            const normalizedTopParameters = providedTopParameters
                .map((item) => {
                    const name =
                        item?.parameter || item?.name || item?.field || item?.label;
                    const count = item?.count ?? item?.anomalies ?? item?.total;

                    if (!name) {
                        return null;
                    }

                    return {
                        name: getParameterLabel(name) || name,
                        count: Number.isFinite(Number(count)) ? Number(count) : 0,
                    };
                })
                .filter(Boolean);

            if (normalizedTopParameters.length > 0) {
                return normalizedTopParameters.sort((a, b) => b.count - a.count);
            }
        }

        return topAnomalyParameters;
    }, [anomalyResult, topAnomalyParameters]);
    const scoreTimelineData = useMemo(
        () => buildScoreTimelineSeries(anomalyResult?.timeline),
        [anomalyResult]
    );

    const renderSegmentDrivers = (segment) => {
        const drivers = Array.isArray(segment?.top_drivers)
            ? segment.top_drivers
            : segment?.drivers;
        if (!Array.isArray(drivers) || drivers.length === 0) {
            return "";
        }
        return drivers
            .slice(0, 3)
            .map((driver) => getParameterLabel(driver?.parameter || driver?.name || ""))
            .filter(Boolean)
            .join(", ");
    };
    const anomalyTableRows = useMemo(
        () =>
            segments.slice(0, 10).map((segment, index) => {
                const topDrivers = renderSegmentDrivers(segment);
                const startTime = segment?.start_time ?? segment?.startTime ?? segment?.time;
                const endTime = segment?.end_time ?? segment?.endTime ?? segment?.time;
                const timestamp =
                    startTime !== undefined && endTime !== undefined && startTime !== endTime
                        ? `${startTime} - ${endTime}`
                        : startTime ?? endTime ?? `Segment ${index + 1}`;
                const severity = segment?.severity || "low";

                return {
                    id: `${timestamp}-${index}`,
                    parameter: topDrivers || `Segment ${index + 1}`,
                    time: timestamp,
                    severity,
                    summary: segment?.explanation || "",
                };
            }),
        [segments]
    );

    const renderParameterCard = (parameter) => {
        const meta = parameterDisplayMap[parameter] || {
            label: parameter,
            unit: "",
            color: colorPalette[0],
        };
        const chartData = truncateSeries(
            normalizedRows
                .map((row) => ({
                    time: row.time,
                    value: row[parameter],
                }))
                .filter(
                    (row) =>
                        row.time &&
                        typeof row.value === "number" &&
                        !Number.isNaN(row.value)
                )
        );
        const hasData = chartData.length > 0;
        const renderConfig = getSeriesRenderConfig(chartData, "value");

        return (
            <div
                key={parameter}
                className="flex w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                            {meta.label || parameter}
                        </h3>
                        {meta.unit && (
                            <p className="text-xs text-gray-500">Unit: {meta.unit}</p>
                        )}
                    </div>
                </div>

                {hasData ? (
                    <div className="min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="time" stroke="#94a3b8" minTickGap={20} />
                                <YAxis stroke="#94a3b8" domain={["auto", "auto"]} />
                                <Tooltip cursor={{ stroke: "#cbd5e1" }} />
                                {renderConfig.variant === "bar" ? (
                                    <Bar
                                        dataKey="value"
                                        name={meta.label || parameter}
                                        fill={meta.color}
                                        barSize={18}
                                        isAnimationActive={false}
                                    />
                                ) : (
                                    <Line
                                        type={renderConfig.lineType || "monotone"}
                                        dataKey="value"
                                        name={meta.label || parameter}
                                        stroke={meta.color}
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                        isAnimationActive={false}
                                    />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                        No numeric data available for this parameter.
                    </div>
                )}
            </div>
        );
    };

    if (!isLinkedRoute && workflowStage === "caseSelection") {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-600">FDR Module</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Select a Case to Analyze Flight Data
                    </h1>
                    <p className="text-gray-600 max-w-3xl">
                        Choose the investigation file whose flight data recorder stream you want to explore. Once selected, the
                        system will load available parameters, trend charts, and anomaly detection workflows.
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {caseSelectionOptions.map((flightCase) => {
                        const isActive = selectedCase?.id === flightCase.id;
                        return (
                            <button
                                key={flightCase.id}
                                type="button"
                                onClick={() => {
                                    setSelectedCase(flightCase);
                                    setLinkError("");
                                    setMissingDataTypes([]);
                                }}
                                className={`text-left rounded-2xl border transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                                    isActive ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"
                                }`}
                            >
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-wide text-gray-400">Case ID</span>
                                        <span className="text-sm font-semibold text-emerald-600">{flightCase.date}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{flightCase.id}</p>
                                        <h2 className="mt-1 text-xl font-bold text-gray-900">{flightCase.title}</h2>
                                    </div>
                                    <p className="text-sm text-gray-600">{flightCase.summary}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Aircraft</span>
                                        <span className="font-medium text-gray-800">{flightCase.aircraft}</span>
                                    </div>
                                    {isActive && (
                                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
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

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1 text-sm text-gray-500">
                        <p>Select a case to detect anomalies in FDR data.</p>
                    </div>
                    <button
                        type="button"
                        disabled={!selectedCase}
                        onClick={() => selectedCase && setWorkflowStage("analysis")}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-emerald-200"
                    >
                        Continue to analysis
                    </button>
                </div>
        </div>
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
        if (!anomalyResult) {
            return (
                <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-10 w-10"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                            <circle cx="12" cy="12" r="9" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Detection results unavailable</h2>
                    <p className="text-sm text-gray-600 max-w-md">
                        Run anomaly detection for this case to populate the results dashboard with model insights.
                    </p>
                    <button
                        type="button"
                        onClick={() => setWorkflowStage("analysis")}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                        Back to data overview
                    </button>
                </div>
            );
        }

        const totalEvents =
            displayedTopParameters.reduce((sum, item) => sum + (item?.count || 0), 0) || 1;

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
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {analysisTitle}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setWorkflowStage("analysis")}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-emerald-200 hover:text-emerald-600"
                        >
                            Back to data overview
                        </button>
                        <button
                            type="button"
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        >
                            Export Report
                        </button>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Anomaly Score Timeline
                            </h2>
                            <p className="text-sm text-gray-500">
                                Window-based reconstruction error across the flight.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={scoreTimelineData.length ? scoreTimelineData : detectionTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="time" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey={scoreTimelineData.length ? "score" : "AIRSPEED"}
                                    stroke="#38bdf8"
                                    strokeWidth={3}
                                    dot={false}
                                    name={scoreTimelineData.length ? "Anomaly Score" : "Flight Baseline"}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Key Summary Cards</h2>
                        <p className="text-sm text-gray-500">
                            Unified highlights for the latest Behavioral Anomaly Detection run.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                                Segments flagged
                            </p>
                            <p className="mt-3 text-3xl font-bold text-gray-900">
                                {typeof anomalyCount === "number" ? anomalyCount.toLocaleString() : "—"}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                {typeof totalRows === "number"
                                    ? `${totalRows.toLocaleString()} total rows reviewed`
                                    : "Total rows unavailable"}
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                                Flagged flight timeline
                            </p>
                            <div className="mt-4 flex items-center gap-4">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-[10px] border-emerald-100" />
                                    <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                                        <span className="text-xl font-bold text-emerald-600">
                                            {typeof flaggedPercent === "number"
                                                ? flaggedPercent.toFixed(1)
                                                : "—"}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                            %
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>
                                        {typeof flaggedRowCount === "number"
                                            ? `${flaggedRowCount.toLocaleString()} rows flagged`
                                            : "Rows flagged unavailable"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {typeof totalRows === "number"
                                            ? `Out of ${totalRows.toLocaleString()} total rows`
                                            : "Total rows unavailable"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Top contributing parameters
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Parameters most frequently contributing to flagged segments.
                            </p>
                            <div className="mt-4 space-y-3">
                                {displayedTopParameters.length > 0 ? (
                                    displayedTopParameters.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="h-2.5 w-8 rounded-full bg-emerald-200" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {Math.round((item.count / totalEvents) * 100)}%
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No contributing parameters reported for this run.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-white p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Flagged Events (Evidence View)
                            </h2>
                            <p className="text-sm text-gray-500">
                                Evidence-ready review of flagged intervals and contributing parameters.
                            </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {anomalyCount ?? 0} segments flagged
                            {typeof flaggedPercent === "number"
                                ? ` (${flaggedPercent.toFixed(1)}% of flight)`
                                : ""}
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
                                {anomalyTableRows.length > 0 ? (
                                    anomalyTableRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                <div>{row.parameter}</div>
                                                {row.summary && (
                                                    <p className="text-xs text-gray-500 mt-1 break-words">
                                                        {row.summary}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{row.time}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50">
                                                    {row.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-4 py-4 text-center text-sm text-gray-500"
                                            colSpan={3}
                                        >
                                            No segments returned for this run.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-3xl bg-white p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Summaries and contextual observations captured by investigators.
                    </p>
                    <textarea
                        rows={5}
                        className="mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                        placeholder="Add follow-up actions or observations..."
                    />
                </section>
            </div>
        );
    }
    const canOfferUpload = isLinkedRoute && missingDataTypes.length > 0;
    if (workflowStage === "analysis" && !selectedCase) {
          if (linkError) {
            return (
                <div className="max-w-3xl mx-auto py-24 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-gray-900">Unable to open case</h1>
                        <p className="text-sm text-gray-600">{linkError}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleNavigateToCases}
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                            Back to cases
                        </button>
                        {canOfferUpload ? (
                            <button
                                type="button"
                                onClick={handleUploadMissingData}
                                className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                                Upload required data
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleChangeCase}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Choose another case
                            </button>
                        )}
                    </div>
                </div>
            );
        }
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
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">FDR Module</h1>
                    <p className="text-gray-600">
                        Configure parameters, review recorded data, and launch anomaly
                        detection for the selected flight case.
                    </p>
                </div>
                <div className="flex flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-3 sm:text-right">
                    <div className="sm:text-right">
                        <p className="text-sm text-gray-500">Active Case</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {selectedCase?.id} · {selectedCase?.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleChangeCase}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-emerald-200 hover:text-emerald-600"
                        >
                            Change case
                        </button>
                        <button
                            type="button"
                            onClick={handleRunDetection}
                            disabled={isRunningDetection || availableParameters.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
                        >
                            {isRunningDetection ? "Running..." : "Run Analysis"}
                        </button>
                    </div>
                </div>
            </header>

            {isLoadingFdrData && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Loading FDR data from object storage...
                </div>
            )}
            {fdrDataError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {fdrDataError}
                </div>
            )}

            <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">Anomaly Detection</h2>
                </div>

                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Current scope</p>
                    <p className="font-semibold text-gray-800">{detectionScopeLabel}</p>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {analysisTitle}
                </div>

                {anomalyError && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        {anomalyError}
                    </div>
                )}

                {(isRunningDetection || anomalyResult || anomalyError) && (
                    <div className="rounded-lg border border-gray-200 bg-white/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Detection Summary</p>
                                <p className="text-xs text-gray-500">
                                    Latest run for {selectedCase?.id || caseNumber || "current case"}
                                </p>
                            </div>
                            {isRunningDetection && (
                                <span className="text-xs font-semibold text-emerald-700">Running...</span>
                            )}
                        </div>

                        {anomalyResult && (
                            <>
                                <p className="text-sm text-gray-700">
                                    <span className="text-2xl font-bold text-emerald-600">
                                        {typeof anomalyCount === "number"
                                            ? anomalyCount.toLocaleString()
                                            : "—"}
                                    </span>
                                    <span className="ml-2 text-xs uppercase tracking-wide text-gray-500">
                                        segments flagged
                                    </span>
                                </p>

                                <p className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-800">Analysis:</span>
                                    <span className="ml-1">{analysisTitle}</span>
                                    <span className="ml-3 font-semibold text-gray-800">Total rows:</span>
                                    <span className="ml-1 text-gray-700">
                                        {typeof totalRows === "number" ? totalRows.toLocaleString() : "—"}
                                    </span>
                                </p>

                                {topAnomalyParameters.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        <p className="text-xs font-semibold text-gray-700">
                                            Parameters with most flagged segments
                                        </p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {topAnomalyParameters.map(({ name, count }) => (
                                                <li
                                                    key={`${name}-${count}`}
                                                    className="flex items-center justify-between"
                                                >
                                                    <span>{name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {count} {count === 1 ? "segment" : "segments"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {noAnomaliesDetected && (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                        No segments flagged for the current run.
                                    </div>
                                )}

                                {!noAnomaliesDetected && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-700">Sample segments</p>
                                        {segments.length > 0 ? (
                                            <ul className="space-y-2">
                                                {segments.slice(0, 5).map((segment, index) => {
                                                    const startTime =
                                                        segment?.start_time ??
                                                        segment?.startTime ??
                                                        segment?.time ??
                                                        index + 1;
                                                    const endTime =
                                                        segment?.end_time ??
                                                        segment?.endTime ??
                                                        segment?.time ??
                                                        startTime;
                                                    const severity = segment?.severity || "low";

                                                    return (
                                                        <li
                                                            key={`${startTime}-${endTime}-${index}`}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-gray-800">
                                                                    Segment {index + 1}
                                                                </span>
                                                                {severity && (
                                                                    <span className="text-xs rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                                                                        {severity}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 break-words">
                                                                {segment?.explanation ||
                                                                    `Time ${startTime} - ${endTime}`}
                                                            </p>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                No segments returned for this run.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Flight Parameter Overview
                        </h2>
                        <p className="text-sm text-gray-500">
                            Time series visualization of recorder values for each parameter.
                        </p>
                    </div>
                    <div className="w-full sm:w-64">
                        <label className="text-xs font-semibold text-gray-500" htmlFor="chart-filter">
                            Filter charts by parameter name
                        </label>
                        <input
                            id="chart-filter"
                            type="text"
                            value={chartFilterText}
                            onChange={(event) => setChartFilterText(event.target.value)}
                            placeholder="Search parameters..."
                            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                </div>

                {groupedParameters.length > 0 ? (
                    groupedParameters.map((group) => {
                        const isExpanded = expandedGroups.has(group.key);
                        const visibleParameters = isExpanded
                            ? group.parameters
                            : group.parameters.slice(0, defaultVisibleChartsPerGroup);
                        const canToggle = group.parameters.length > defaultVisibleChartsPerGroup;

                        return (
                            <div key={group.key} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            {group.title}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {group.parameters.length} parameters
                                        </p>
                                    </div>
                                    {canToggle && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleGroup(group.key)}
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                        >
                                            {isExpanded ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {visibleParameters.map((parameter) =>
                                        renderParameterCard(parameter)
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                        No parameters match your filter.
                    </div>
                )}
            </section>

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
