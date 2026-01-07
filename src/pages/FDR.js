import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
        sessionTimeSeconds: 0,
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
        sessionTimeSeconds: 10,
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
        sessionTimeSeconds: 20,
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
        sessionTimeSeconds: 30,
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
        sessionTimeSeconds: 40,
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
        sessionTimeSeconds: 50,
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

const algorithmDisplayNames = {
    zscore: "Z-score",
    iqr: "IQR",
    isolation_forest: "Isolation Forest",
};

const normalizeHeader = (value = "") => String(value || "").trim().toLowerCase();

const parseTimeToSeconds = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const tPlusMatch = trimmed.match(/^T\+(\d+)(?:s)?$/i);
    if (tPlusMatch) {
        return Number(tPlusMatch[1]);
    }

    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
        const [, hoursOrMinutes, minutesOrSeconds, seconds] = timeMatch;
        if (seconds !== undefined) {
            const hours = Number(hoursOrMinutes);
            const minutes = Number(minutesOrSeconds);
            const secs = Number(seconds);
            return hours * 3600 + minutes * 60 + secs;
        }
        return Number(hoursOrMinutes) * 60 + Number(minutesOrSeconds);
    }

    return null;
};

const TIME_WINDOW_PADDING_SECONDS = 8;


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

    return rawRows.map((row, index) => {
        const sessionTimeSeconds = pickNumeric(row, ["Session Time"]);
        const normalized = { time: resolveTimeLabel(row, index) };

        if (sessionTimeSeconds !== null) {
            normalized.sessionTimeSeconds = sessionTimeSeconds;
        }

        fdrParameterMap.forEach(({ id }) => {
            const columnsToTry = columnMap[id]?.length ? columnMap[id] : [id];
            const value = pickNumeric(row, columnsToTry);
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

const buildCardSamplesFromRows = (rows) => {
    const groupedSamples = {};

    dashboardCards.forEach(({ key, parameters }) => {
        const samples = truncateSeries(
            rows
                .map((row) => {
                    const entry = { time: row.time };
                    if (Number.isFinite(row.sessionTimeSeconds)) {
                        entry.sessionTimeSeconds = row.sessionTimeSeconds;
                    }
                    parameters.forEach((parameter) => {
                        if (row[parameter] !== undefined) {
                            entry[parameter] = row[parameter];
                        }
                    });
                    return entry;
                })
                .filter((row) => row.time && hasNumericValue(row, parameters)),
            400
        );

        groupedSamples[key] = samples;
    });

    return groupedSamples;
};

const deriveAvailableParameters = (rows) => {
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
                if (Number.isFinite(row.sessionTimeSeconds)) {
                    entry.sessionTimeSeconds = row.sessionTimeSeconds;
                }
                detectionTrendKeys.forEach((key) => {
                    if (row[key] !== undefined) {
                        entry[key] = row[key];
                    }
                });
                return entry;
            }),
        240
    );

const applyTimeWindow = (series, timeWindow, timeKey) => {
    if (!timeWindow || !Array.isArray(series) || series.length === 0) {
        return series;
    }

    const startTime = Number(timeWindow.startTime);
    const endTime = Number(timeWindow.endTime);

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
        return series;
    }

    const paddedStart = Math.max(0, Math.min(startTime, endTime) - TIME_WINDOW_PADDING_SECONDS);
    const paddedEnd = Math.max(startTime, endTime) + TIME_WINDOW_PADDING_SECONDS;

    if (timeKey === "sessionTimeSeconds") {
        const hasCompleteTime = series.every((row) =>
            Number.isFinite(row?.[timeKey])
        );
        if (!hasCompleteTime) {
            return series.filter((row) => {
                const parsedTime = parseTimeToSeconds(row?.time);
                if (parsedTime === null) {
                    return true;
                }
                return parsedTime >= paddedStart && parsedTime <= paddedEnd;
            });
        }

        const lowerBound = (value) => {
            let low = 0;
            let high = series.length;
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                const midValue = series[mid]?.[timeKey];
                if (!Number.isFinite(midValue)) {
                    return 0;
                }
                if (midValue < value) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            return low;
        };

        const startIndex = lowerBound(paddedStart);
        const endIndex = lowerBound(paddedEnd + 0.0001);
        return series.slice(startIndex, endIndex);
    }

    return series.filter((row) => {
        const parsedTime = parseTimeToSeconds(row?.[timeKey]);
        if (parsedTime === null) {
            return true;
        }
        return parsedTime >= paddedStart && parsedTime <= paddedEnd;
    });
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
    const [selectedAlgorithm, setSelectedAlgorithm] = useState("zscore");
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
    const [activeWindow, setActiveWindow] = useState(null);
    const [selectedAnomalyId, setSelectedAnomalyId] = useState(null);
    const [hasAnalysisRun, setHasAnalysisRun] = useState(false);
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
    const sampleRows = useMemo(() => {
        if (!anomalyResult) {
            return [];
        }

        const rows =
            anomalyResult.sampleRows ||
            anomalyResult.samples ||
            anomalyResult.anomalies;

        return Array.isArray(rows) ? rows : [];
    }, [anomalyResult]);
    const algorithmUsed = useMemo(() => {
        const sourceAlgorithm = anomalyResult?.algorithm || selectedAlgorithm;

        if (!sourceAlgorithm) {
            return null;
        }

        if (typeof sourceAlgorithm === "string") {
            const normalized = sourceAlgorithm.toLowerCase();
            return algorithmDisplayNames[normalized] || sourceAlgorithm;
        }

        if (typeof sourceAlgorithm === "object") {
            const name = sourceAlgorithm.name || sourceAlgorithm.type;
            if (typeof name === "string") {
                const normalized = name.toLowerCase();
                return algorithmDisplayNames[normalized] || name;
            }

            try {
                return JSON.stringify(sourceAlgorithm);
            } catch (error) {
                return String(sourceAlgorithm);
            }
        }

        return String(sourceAlgorithm)
    }, [anomalyResult, selectedAlgorithm]);
    useEffect(() => {
        if (!anomalyResult) {
            return;
        }

        const anomalyCountForLog =
            anomalyResult.anomalyCount ??
            anomalyResult.detectedCount ??
            anomalyResult.anomalies?.length ??
            anomalyResult.count ??
            null;
        const rawCount =
            anomalyResult.rawAnomalyCount ??
            anomalyResult.raw_anomaly_count ??
            (anomalyResult.parameterCounts
                ? Object.values(anomalyResult.parameterCounts).reduce(
                      (sum, value) => sum + (value || 0),
                      0
                  )
                : null);

        console.debug("[FDR] Detection result state updated", {
            algorithm: anomalyResult.algorithm || selectedAlgorithm,
            anomalyCount: anomalyCountForLog,
            rawAnomalyCount: rawCount ?? undefined,
            sampleRows: sampleRows.length,
            totalRows:
                anomalyResult.totalRows ??
                anomalyResult.evaluatedRows ??
                anomalyResult.total ??
                anomalyResult.total_rows ??
                (Array.isArray(normalizedRows) ? normalizedRows.length : undefined),
        });
    }, [anomalyResult, normalizedRows, sampleRows.length, selectedAlgorithm]);
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
    const visualizationRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const timeAxisKey = useMemo(() => {
        if (!Array.isArray(normalizedRows) || normalizedRows.length === 0) {
            return "time";
        }
        return normalizedRows.some((row) => Number.isFinite(row.sessionTimeSeconds))
            ? "sessionTimeSeconds"
            : "time";
    }, [normalizedRows]);

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

    useEffect(() => {
        if (!Array.isArray(availableParameters) || availableParameters.length === 0) {
            setSelectedParameters([]);
            return;
        }

        setSelectedParameters((prev) => {
            const filtered = prev.filter((item) => availableParameters.includes(item));
            if (filtered.length > 0) {
                return filtered;
            }

            return availableParameters.slice(0, Math.min(3, availableParameters.length));
        });
    }, [availableParameters]);

    useEffect(() => {
        if (!selectedCase) {
            return;
        }
        setActiveWindow(null);
        setSelectedAnomalyId(null);
        setHasAnalysisRun(false);
    }, [selectedCase]);

    useEffect(() => {
        if (!pendingScrollRef.current || workflowStage !== "analysis") {
            return;
        }

        const target = visualizationRef.current;
        if (target) {
            pendingScrollRef.current = false;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [workflowStage, activeWindow]);

    const resolveTimeValue = useCallback((value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        return parseTimeToSeconds(value);
    }, []);

    const buildWindowFromRow = useCallback(
        (row, fallbackIndex) => {
            if (!row) {
                return null;
            }

            const startRaw =
                row?.start_time ?? row?.startTime ?? row?.start ?? row?.from ?? row?.window_start;
            const endRaw =
                row?.end_time ?? row?.endTime ?? row?.end ?? row?.to ?? row?.window_end;
            const startValue = resolveTimeValue(startRaw);
            const endValue = resolveTimeValue(endRaw);

            if (startValue !== null && endValue !== null) {
                return {
                    startTime: Math.min(startValue, endValue),
                    endTime: Math.max(startValue, endValue),
                };
            }

            const timestamp =
                row?.timestamp || row?.time || row?.TIME || row?.datetime || row?.recorded_at;
            const timestampValue = resolveTimeValue(timestamp);
            if (timestampValue !== null) {
                return {
                    startTime: timestampValue,
                    endTime: timestampValue,
                };
            }

            const indexValue = resolveTimeValue(fallbackIndex);
            if (indexValue !== null) {
                const directRow = normalizedRows[indexValue];
                const fallbackRow =
                    directRow || normalizedRows[Math.max(0, indexValue - 1)];
                const rowValue =
                    fallbackRow?.sessionTimeSeconds ??
                    resolveTimeValue(fallbackRow?.time);
                if (rowValue !== null) {
                    return { startTime: rowValue, endTime: rowValue };
                }
            }

            return null;
        },
        [normalizedRows, resolveTimeValue]
    );

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

    const toggleParameter = (parameter) => {
        if (!availableParameters.includes(parameter)) {
            return;
        }

        setSelectedParameters((prev) =>
            prev.includes(parameter)
                ? prev.filter((item) => item !== parameter)
                : [...prev, parameter]
        );
    };

    const handleResetZoom = () => {
        setActiveWindow(null);
        setSelectedAnomalyId(null);
    };

    const handleJumpToInterval = (row) => {
        const window =
            row?.timeWindow ||
            buildWindowFromRow(
                row,
                row?.rowIndex ?? row?.row_number ?? row?.index ?? row?.row
            );
        if (!window) {
            return;
        }
        setActiveWindow(window);
        setSelectedAnomalyId(row.id);
        pendingScrollRef.current = true;
        if (workflowStage !== "analysis") {
            setWorkflowStage("analysis");
            return;
        }

        const target = visualizationRef.current;
        if (target) {
            pendingScrollRef.current = false;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleRunDetection = async () => {
        if (availableParameters.length === 0 || !caseNumber) {
            return;
        }

        setIsRunningDetection(true);
        setAnomalyError("");
        setAnomalyResult(null);
        setHasAnalysisRun(false);

        try {
            const result = await runFdrAnomalyDetection(caseNumber, {
                algorithm: selectedAlgorithm,
                rows: normalizedRows,
            });
            setAnomalyResult(result);
            setHasAnalysisRun(true);
            setWorkflowStage((prev) =>
                prev === "analysis" ? "detectionComplete" : prev
            );
        } catch (error) {
            setAnomalyResult(null);
            setAnomalyError(
                error?.message || "Unable to run anomaly detection for this case."
            );
            setHasAnalysisRun(false);
        } finally {
            setIsRunningDetection(false);
        }
    };

    const totalRows =
        anomalyResult?.totalRows ??
        anomalyResult?.evaluatedRows ??
        anomalyResult?.total_rows ??
        anomalyResult?.total ??
        (Array.isArray(normalizedRows) ? normalizedRows.length : null);
    const anomalyCount =
        anomalyResult?.anomalyCount ??
        anomalyResult?.detectedCount ??
        anomalyResult?.anomalies?.length ??
        anomalyResult?.count ??
        sampleRows.length ??
        null;
    const anomalyPercentage =
        anomalyResult?.anomalyPercentage ??
        anomalyResult?.anomaly_percentage ??
        (totalRows && typeof anomalyCount === "number" && totalRows > 0
            ? (anomalyCount / totalRows) * 100
            : null);
    const noAnomaliesDetected = Boolean(anomalyResult) && anomalyCount === 0;
    const formattedActiveWindow = useMemo(() => {
        if (!activeWindow || !hasAnalysisRun) {
            return null;
        }
        const start = Number(activeWindow.startTime);
        const end = Number(activeWindow.endTime);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return null;
        }
        const duration = Math.max(0, end - start);
        return {
            startLabel: formatSessionTime(start),
            endLabel: formatSessionTime(end),
            duration,
        };
    }, [activeWindow]);
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

        if (Array.isArray(anomalyResult.anomalies)) {
            anomalyResult.anomalies.forEach((item) =>
                addCount(item?.parameter || item?.field || item?.metric)
            );
        }

        return Array.from(counts.entries())
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }, [anomalyResult]);
    const displayedTopParameters = useMemo(() => {
        const providedTopParameters =
            anomalyResult?.topParameters || anomalyResult?.top_parameters;

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
    const filteredDetectionTrendData = useMemo(() => {
        if (!hasAnalysisRun) {
            return detectionTrendData;
        }
        return applyTimeWindow(detectionTrendData, activeWindow, timeAxisKey);
    }, [detectionTrendData, activeWindow, hasAnalysisRun, timeAxisKey]);

    const renderSampleValues = (row) => {
        if (!row || typeof row !== "object") {
            return String(row ?? "");
        }

        const base =
            (row?.values && typeof row.values === "object" && row.values) ||
            (row?.metrics && typeof row.metrics === "object" && row.metrics) ||
            (row?.parameters &&
                typeof row.parameters === "object" &&
                !Array.isArray(row.parameters) &&
                row.parameters) ||
            row;
        const entries = Object.entries(base).filter(
            ([key]) =>
                !["rowIndex", "row_number", "index", "row", "severity", "score"].includes(
                    key
                )
        );

        if (entries.length === 0) {
            return JSON.stringify(base);
        }

        return entries
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" · ");
    };
    const anomalyTableRows = useMemo(
        () =>
            sampleRows.slice(0, 10).map((row, index) => {
                const parameters = Array.isArray(row?.parameters)
                    ? row.parameters
                    : Object.keys(row?.values || row || {}).filter(
                          (key) =>
                              ![
                                  "rowIndex",
                                  "row_number",
                                  "index",
                                  "row",
                                  "severity",
                                  "score",
                                  "parameters",
                              ].includes(key)
                      );
                const parameterLabel = parameters
                    .slice(0, 3)
                    .map((param) => getParameterLabel(param) || param)
                    .join(", ");

                const rowLabel =
                    row?.rowIndex ?? row?.row_number ?? row?.index ?? row?.row ?? index + 1;
                const timestamp =
                    row?.timestamp || row?.time || row?.TIME || row?.datetime || row?.recorded_at;
                const severity = row?.severity || row?.score;
                const timeWindow = buildWindowFromRow(row, rowLabel);

                return {
                    id: `${rowLabel}-${index}`,
                    parameter: parameterLabel || `Row ${rowLabel}`,
                    time: timestamp || `Row ${rowLabel}`,
                    severity: severity || "Flagged",
                    summary: renderSampleValues(row),
                    timeWindow,
                };
            }),
        [buildWindowFromRow, sampleRows]
    );

        const renderDashboardCards = () =>
        dashboardCards.map((card) => {
            const selectedForCard = selectedParameters.filter((parameter) =>
                card.parameters.includes(parameter)
            );
            const visibleParameters = (
                card.key === "flight-dynamics"
                    ? selectedForCard.filter((parameter) =>
                          visibleFlightDynamics.has(parameter)
                      )
                    : selectedForCard
            ).filter((parameter) => availableParameterSet.has(parameter));
            const chartData = (cardSamples[card.key] || [])
                .map((row) => {
                    const entry = { time: row.time };
                    if (Number.isFinite(row.sessionTimeSeconds)) {
                        entry.sessionTimeSeconds = row.sessionTimeSeconds;
                    }
                    visibleParameters.forEach((parameter) => {
                        if (typeof row[parameter] === "number" && !Number.isNaN(row[parameter])) {
                            entry[parameter] = row[parameter];
                        }
                    });
                    return entry;
                })
                .filter((row) => row.time && hasNumericValue(row, visibleParameters));
            const filteredChartData = hasAnalysisRun
                ? applyTimeWindow(chartData, activeWindow, timeAxisKey)
                : chartData;
            const hasData = filteredChartData.length > 0 && visibleParameters.length > 0;
            const showNoMatch =
                selectedForCard.length > 0 &&
                (visibleParameters.length === 0 || chartData.length === 0);
            const hasMultiScaleData = visibleParameters.some((parameter) =>
                summarizeSeriesProfile(chartData, parameter).isMultiScale
            );
             const badgeParameters = visibleParameters;

            const scatterData =
                card.key === "navigation"
                    ? (cardSamples[card.key] || [])
                          .map((row) => ({
                              latitude: Number(row["Latitude (deg)"]),
                              longitude: Number(row["Longitude (deg)"]),
                          }))
                          .filter(
                              (point) =>
                                  Number.isFinite(point.latitude) &&
                                  Number.isFinite(point.longitude)
                          )
                    : [];
            const canShowScatter =
                card.key === "navigation" &&
                scatterData.length > 0 &&
                ["Latitude (deg)", "Longitude (deg)"].every((parameter) =>
                    visibleParameters.includes(parameter)
                );

            const renderTimeSeries = () => (
                <div className="min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={filteredChartData}
                            margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey={timeAxisKey}
                                stroke="#94a3b8"
                                minTickGap={20}
                                tickFormatter={
                                    timeAxisKey === "sessionTimeSeconds"
                                        ? (value) => formatSessionTime(value)
                                        : undefined
                                }
                            />
                            <YAxis
                                stroke="#94a3b8"
                                allowDataOverflow={hasMultiScaleData}
                                domain={["auto", "auto"]}
                                padding={hasMultiScaleData ? { top: 12, bottom: 12 } : { top: 8, bottom: 8 }}
                            />
                            <Tooltip
                                cursor={{ stroke: "#cbd5e1" }}
                                labelFormatter={
                                    timeAxisKey === "sessionTimeSeconds"
                                        ? (value) => formatSessionTime(value)
                                        : undefined
                                }
                            />
                            {visibleParameters.map((parameter) => {
                                const config = parameterMetadata[parameter];
                                const stroke = config?.color ?? "#0f172a";
                                const label = config?.label || parameter;
                                const renderConfig = getSeriesRenderConfig(
                                    chartData,
                                    parameter
                                );

                                if (renderConfig.variant === "bar") {
                                    return (
                                        <Bar
                                            key={parameter}
                                            dataKey={parameter}
                                            name={label}
                                            fill={stroke}
                                            barSize={18}
                                            isAnimationActive={false}
                                        />
                                    );
                                }

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
                                );
                            })}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            );

            const emptyMessage = showNoMatch
                ? "No matching numeric column found for this selection."
                : hasAnalysisRun && activeWindow
                  ? "No data points fall within the selected interval."
                : "Select parameters from the left to visualize this card.";

            return (
                <div
                    key={card.key}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">{card.title}</h3>
                            <p className="text-xs text-gray-500">
                                {card.key === "flight-dynamics"
                                    ? "Energy, kinematics, and attitude traces."
                                    : card.key === "navigation"
                                      ? "Track geospatial progress alongside a longitude/latitude trace."
                                      : card.key === "engines-fuel"
                                        ? "Engine RPM with fuel flow rate overlays."
                                        : "Environmental readings captured by the recorder."}
                            </p>
                        </div>
                        <span className="text-xs font-medium text-gray-400">
                            {visibleParameters.length}/{card.parameters.length} displayed
                        </span>
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
                        Run anomaly detection for this case to populate the results dashboard with algorithm-specific insights.
                    </p>
                    <button
                        type="button"
                        onClick={() => setWorkflowStage("analysis")}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                        Return to configuration
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
                            Algorithm used: {algorithmUsed || "Not specified"}
                        </div>
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
                                    <ComposedChart data={filteredDetectionTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey={timeAxisKey}
                                            stroke="#94a3b8"
                                            tickFormatter={
                                                timeAxisKey === "sessionTimeSeconds"
                                                    ? (value) => formatSessionTime(value)
                                                    : undefined
                                            }
                                        />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            labelFormatter={
                                                timeAxisKey === "sessionTimeSeconds"
                                                    ? (value) => formatSessionTime(value)
                                                    : undefined
                                            }
                                        />
                                        <Bar
                                            dataKey="PERCENT_POWER"
                                            name="Percent Power"
                                            fill="#d1fae5"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ALTITUDE"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={false}
                                            name="Actual"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="AIRSPEED"
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
                                    {anomalyCount ?? 0} anomalies detected
                                    {typeof anomalyPercentage === "number"
                                        ? ` (${anomalyPercentage.toFixed(1)}%)`
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
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {anomalyTableRows.length > 0 ? (
                                            anomalyTableRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className={`hover:bg-gray-50 ${
                                                        row.id === selectedAnomalyId
                                                            ? "bg-emerald-50/70"
                                                            : ""
                                                    }`}
                                                >
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
                                                    <td className="px-4 py-3 text-right">
                                                        {hasAnalysisRun && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleJumpToInterval(row)}
                                                                disabled={!row.timeWindow}
                                                                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                                    row.timeWindow
                                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                View in charts
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    className="px-4 py-4 text-center text-sm text-gray-500"
                                                    colSpan={4}
                                                >
                                                    No sample anomalies returned for this run.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Top anomalous parameters
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Parameters most frequently flagged by the selected algorithm.
                            </p>

                            <div className="mt-6 space-y-4">
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
                                        No anomalous parameters reported for this run.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Anomalies Detected
                            </h2>
                            <p className="text-sm text-gray-500">
                                Share of FDR rows flagged by the detection algorithm.
                            </p>
                            <div className="mt-6 flex h-48 items-center justify-center">
                                <div className="relative">
                                    <div className="h-40 w-40 rounded-full border-[14px] border-emerald-100" />
                                    <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                                        <span className="text-3xl font-bold text-emerald-600">
                                            {typeof anomalyPercentage === "number"
                                                ? anomalyPercentage.toFixed(1)
                                                : "—"}
                                        </span>
                                        <span className="text-xs uppercase tracking-wide text-gray-500">
                                            % of rows
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
                            {isRunningDetection ? "Running..." : "Run Anomaly Detection"}
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

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-800" htmlFor="algorithm-select">
                        Algorithm
                    </label>
                    <select
                        id="algorithm-select"
                        value={selectedAlgorithm}
                        onChange={(event) => setSelectedAlgorithm(event.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                        <option value="zscore">Z-score (default)</option>
                        <option value="iqr">IQR</option>
                        <option value="isolation_forest">Isolation Forest (beta)</option>
                    </select>
                </div>

                {anomalyError && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        {anomalyError}
                    </div>
                )}

                <div className="space-y-6">
                    <section
                        ref={visualizationRef}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                    >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Detection Summary</p>
                                <p className="text-xs text-gray-500">
                                    Latest run for {selectedCase?.id || caseNumber || "current case"}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-xs text-gray-500">
                                    Charts resize with available space for clearer trend comparisons.
                                </p>
                                {hasAnalysisRun && (
                                    <button
                                        type="button"
                                        onClick={handleResetZoom}
                                        disabled={!activeWindow}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                            activeWindow
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        Reset to full flight
                                    </button>
                                )}
                            </div>
                        </div>

                        {formattedActiveWindow && hasAnalysisRun && (
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                                <span>
                                    Viewing interval: {formattedActiveWindow.startLabel} –{" "}
                                    {formattedActiveWindow.endLabel} (
                                    {Math.round(formattedActiveWindow.duration)}s)
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResetZoom}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                                >
                                    Reset to full flight
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {renderDashboardCards()}
                        </div>
                    </section>

                                <p className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-800">Algorithm:</span>
                                    <span className="ml-1">{algorithmUsed || "Unknown"}</span>
                                    <span className="ml-3 font-semibold text-gray-800">Total rows:</span>
                                    <span className="ml-1 text-gray-700">
                                        {typeof totalRows === "number" ? totalRows.toLocaleString() : "—"}
                                    </span>
                                </p>

                                {topAnomalyParameters.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        <p className="text-xs font-semibold text-gray-700">
                                            Parameters with most anomalies
                                        </p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {topAnomalyParameters.map(({ name, count }) => (
                                                <li
                                                    key={`${name}-${count}`}
                                                    className="flex items-center justify-between"
                                                >
                                                    <span>{name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {count} {count === 1 ? "anomaly" : "anomalies"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {noAnomaliesDetected && (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                        No anomalies detected for the current run.
                                    </div>
                                )}

                                {!noAnomaliesDetected && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-700">Sample anomalous rows</p>
                                        {sampleRows.length > 0 ? (
                                            <ul className="space-y-2">
                                                {sampleRows.slice(0, 5).map((row, index) => {
                                                    const rowLabel =
                                                        row?.rowIndex ||
                                                        row?.row_number ||
                                                        row?.index ||
                                                        row?.row ||
                                                        index + 1;
                                                    const severity = row?.severity || row?.score;

                                                    return (
                                                        <li
                                                            key={`${rowLabel}-${index}`}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-gray-800">
                                                                    Row {rowLabel}
                                                                </span>
                                                                {severity && (
                                                                    <span className="text-xs rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                                                                        {severity}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 break-words">
                                                                {renderSampleValues(row)}
                                                            </p>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                No sample anomalies returned for this run.
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

                                {anomalyResult && (
                                    <>
                                        <p className="text-sm text-gray-700">
                                            <span className="text-2xl font-bold text-emerald-600">
                                                {typeof anomalyCount === "number"
                                                    ? anomalyCount.toLocaleString()
                                                    : "—"}
                                            </span>
                                            <span className="ml-2 text-xs uppercase tracking-wide text-gray-500">
                                                anomalies detected
                                            </span>
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            <span className="font-semibold text-gray-800">Algorithm:</span>
                                            <span className="ml-1">
                                                {algorithmUsed || "Unknown"}
                                            </span>
                                            <span className="ml-3 font-semibold text-gray-800">Total rows:</span>
                                            <span className="ml-1 text-gray-700">
                                                {typeof totalRows === "number" ? totalRows.toLocaleString() : "—"}
                                            </span>
                                        </p>

                                        {topAnomalyParameters.length > 0 && (
                                            <div className="space-y-1 mt-2">
                                                <p className="text-xs font-semibold text-gray-700">
                                                    Parameters with most anomalies
                                                </p>
                                                <ul className="text-sm text-gray-700 space-y-1">
                                                    {topAnomalyParameters.map(({ name, count }) => (
                                                        <li
                                                            key={`${name}-${count}`}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span>{name}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {count} {count === 1 ? "anomaly" : "anomalies"}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {noAnomaliesDetected && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                                No anomalies detected for the current run.
                                            </div>
                                        )}

                                        {!noAnomaliesDetected && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-gray-700">Sample anomalous rows</p>
                                                {sampleRows.length > 0 ? (
                                                    <ul className="space-y-2">
                                                {sampleRows.slice(0, 5).map((row, index) => {
                                                    const rowLabel =
                                                        row?.rowIndex ||
                                                        row?.row_number ||
                                                        row?.index ||
                                                        row?.row ||
                                                        index + 1;
                                                    const severity = row?.severity || row?.score;
                                                    const timeWindow = buildWindowFromRow(row, rowLabel);

                                                    return (
                                                        <li
                                                            key={`${rowLabel}-${index}`}
                                                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-gray-800">
                                                                    Row {rowLabel}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    {severity && (
                                                                        <span className="text-xs rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                                                                            {severity}
                                                                        </span>
                                                                    )}
                                                                    {hasAnalysisRun && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleJumpToInterval({
                                                                                ...row,
                                                                                id: `sample-${rowLabel}-${index}`,
                                                                                timeWindow,
                                                                            })}
                                                                            disabled={!timeWindow}
                                                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                                                                                timeWindow
                                                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                            }`}
                                                                        >
                                                                            View in charts
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-gray-600 break-words">
                                                                {renderSampleValues(row)}
                                                            </p>
                                                        </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">No sample anomalies returned for this run.</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
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
