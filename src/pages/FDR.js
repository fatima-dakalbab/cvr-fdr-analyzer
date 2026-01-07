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
    LineChart,
} from "recharts";
import { fetchCaseByNumber } from "../api/cases";
import { runFdrAnomalyDetection } from "../api/anomaly";
import useRecentCases from "../hooks/useRecentCases";
import { buildCasePreview } from "../utils/caseDisplay";
import { evaluateModuleReadiness } from "../utils/analysisAvailability";
import { fetchAttachmentFromObjectStore } from "../utils/storage";
import fdrParameterConfig, { fdrParameterMap } from "../config/fdr-parameters";

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

const parameterMetadata = fdrParameterMap.reduce((acc, entry, index) => {
    acc[entry.id] = {
        ...entry,
        color: colorPalette[index % colorPalette.length],
    };
    return acc;
}, {});

const parameterGroups = fdrParameterConfig.map((category) => ({
    category: category.name,
    key: category.key,
    parameters: category.params.map((param) => param.id),
}));

const defaultSelectedParameters = [
    "GPS Altitude (feet)",
    "Indicated Airspeed (knots)",
    "RPM L",
].filter((key) => parameterMetadata[key]);

const parameterKeys = Object.keys(parameterMetadata);
const getParameterLabel = (key) => parameterMetadata[key]?.label || key;
const formatParameterList = (keys = []) =>
    keys
        .map((key) => getParameterLabel(key))
        .filter(Boolean)
        .join(", ");

const dashboardCards = [
    {
        key: "engines-fuel",
        title: "Engines & Fuel",
        parameters: ["RPM L", "RPM R", "Fuel Flow 1 (gal/hr)"],
    },
    {
        key: "flight-dynamics",
        title: "Flight Dynamics",
        parameters: [
            "GPS Altitude (feet)",
            "Pressure Altitude (ft)",
            "Indicated Airspeed (knots)",
            "Ground Speed (knots)",
            "True Airspeed (knots)",
            "Vertical Speed (ft/min)",
            "Pitch (deg)",
            "Roll (deg)",
            "Magnetic Heading (deg)",
        ],
    },
    {
        key: "navigation",
        title: "Navigation",
        parameters: ["Latitude (deg)", "Longitude (deg)"],
    },
    {
        key: "environment",
        title: "Environment",
        parameters: ["OAT (deg C)"],
    },
];

const flightDynamicsParameterSet = new Set(
    dashboardCards.find((card) => card.key === "flight-dynamics")?.parameters || []
);

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

const algorithmDisplayNames = {
    zscore: "Z-score",
    iqr: "IQR",
    isolation_forest: "Isolation Forest",
};

const normalizeHeader = (value = "") => String(value || "").trim().toLowerCase();


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

const pickNumeric = (row, columnNames = []) => {
    for (const column of columnNames) {
        const value = toNumber(row[column]);
        if (value !== null) {
            return value;
        }
    }

    return null;
};

const buildParameterColumnMap = (headers = []) => {
    const normalizedHeaders = headers.map((header) => ({
        raw: header,
        normalized: normalizeHeader(header),
    }));
    
    const matches = {};

    fdrParameterMap.forEach(({ id, label }) => {
        const normalizedId = normalizeHeader(id);
        const normalizedLabel = normalizeHeader(label);
        const exactMatch = normalizedHeaders.find(
            (header) => header.normalized === normalizedId
        );
        const labelMatch = normalizedHeaders.find(
            (header) => header.normalized === normalizedLabel
        );
        const partialMatch = normalizedHeaders.find((header) =>
            header.normalized.includes(normalizedId)
        );

        const match = exactMatch || labelMatch || partialMatch;
        matches[id] = match ? [match.raw] : [id];
    });

    console.debug("[FDR] Parameter column matches", {
        headers,
        matches,
    });

    return matches;
};

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

    const sessionSeconds = pickNumeric(row, ["Session Time"]);
    if (sessionSeconds !== null) {
        return formatSessionTime(sessionSeconds);
    }

    return `T+${index}s`;
};

const normalizeFdrRows = (csvText) => {
    const { headers, rows: rawRows } = parseCsvRows(csvText);
    const columnMap = buildParameterColumnMap(headers);

    return rawRows.map((row, index) => {
        const normalized = { time: resolveTimeLabel(row, index) };

        fdrParameterMap.forEach(({ id }) => {
            const columnsToTry = columnMap[id]?.length ? columnMap[id] : [id];
            const value = pickNumeric(row, columnsToTry);
            if (value !== null) {
                normalized[id] = value;
            }
        });

        return normalized;
    });
};

const hasNumericValue = (row, keys) =>
    keys.some((key) => typeof row[key] === "number" && !Number.isNaN(row[key]));

const truncateSeries = (series, maxPoints = 500) =>
    series.length > maxPoints ? series.slice(0, maxPoints) : series;

const buildCardSamplesFromRows = (rows) => {
    const groupedSamples = {};

    dashboardCards.forEach(({ key, parameters }) => {
        const samples = truncateSeries(
            rows
                .map((row) => {
                    const entry = { time: row.time };
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

    parameterKeys.forEach((key) => {
        if (rows.some((row) => hasNumericValue(row, [key]))) {
            available.add(key);
        }
    });

    return available;
};

const buildParameterTable = (rows) =>
    fdrParameterMap
        .map((definition) => {
            const values = rows
                .map((row) => row[definition.id])
                .filter((value) => typeof value === "number" && !Number.isNaN(value));

            if (values.length === 0) {
                return null;
            }

            const min = Math.min(...values);
            const max = Math.max(...values);

            return {
                parameter: definition.label,
                unit: definition.unit,
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

const defaultCardSamples = buildCardSamplesFromRows(sampleNormalizedRows);
const defaultAvailableParameters = Array.from(
    deriveAvailableParameters(sampleNormalizedRows)
);
const defaultParameterTableRows = buildParameterTable(sampleNormalizedRows);
const defaultDetectionTrendSamples = buildDetectionTrendSeries(sampleNormalizedRows);

export default function FDR({ caseNumber: propCaseNumber }) {
    const { caseNumber: routeCaseNumber } = useParams();
    const caseNumber = propCaseNumber || routeCaseNumber;
    const navigate = useNavigate();
    const [selectedParameters, setSelectedParameters] =
        useState(defaultSelectedParameters);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState("zscore");
    const [selectedCase, setSelectedCase] = useState(null);
    const [isRunningDetection, setIsRunningDetection] = useState(false);
    const [cardSamples, setCardSamples] = useState(defaultCardSamples);
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
    const [visibleFlightDynamics, setVisibleFlightDynamics] = useState(
        () => new Set(flightDynamicsParameterSet)
    );
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
    const availableParameterSet = useMemo(
        () => new Set(availableParameters || []),
        [availableParameters]
    );
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
            setCardSamples(defaultCardSamples);
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
            setCardSamples(defaultCardSamples);
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

                const rows = normalizeFdrRows(text);
                if (rows.length === 0) {
                    throw new Error(
                        "The FDR file was downloaded but contained no readable rows."
                    );
                }

                const derivedSamples = buildCardSamplesFromRows(rows);
                const availability = deriveAvailableParameters(rows);
                const parameterTable = buildParameterTable(rows);
                const trends = buildDetectionTrendSeries(rows);
                setNormalizedRows(rows);

                const blendedSamples = dashboardCards.reduce((acc, card) => {
                    const derived = derivedSamples[card.key] || [];
                    acc[card.key] = derived.length
                        ? derived
                        : defaultCardSamples[card.key] || [];
                    return acc;
                }, {});

                setCardSamples(blendedSamples);

                setDetectionTrendData(
                    trends.length > 0 ? trends : defaultDetectionTrendSamples
                );

                setParameterTableRows(
                    parameterTable.length > 0
                        ? parameterTable
                        : defaultParameterTableRows
                );

                setAvailableParameters(
                    availability.size > 0
                        ? Array.from(availability)
                        : defaultAvailableParameters
                );
                setFdrDataError("");
            })
            .catch((error) => {
                if (controller.signal.aborted) {
                    return;
                }

            setCardSamples(defaultCardSamples);
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

    const handleToggleFlightDynamics = (parameter) => {
        if (!flightDynamicsParameterSet.has(parameter)) {
            return;
        }

        setVisibleFlightDynamics((prev) => {
            const next = new Set(prev);
            if (next.has(parameter)) {
                next.delete(parameter);
            } else {
                next.add(parameter);
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

    const handleRunDetection = async () => {
        if (availableParameters.length === 0 || !caseNumber) {
            return;
        }

        setIsRunningDetection(true);
        setAnomalyError("");
        setAnomalyResult(null);

        try {
            const result = await runFdrAnomalyDetection(caseNumber, {
                algorithm: selectedAlgorithm,
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

                return {
                    id: `${rowLabel}-${index}`,
                    parameter: parameterLabel || `Row ${rowLabel}`,
                    time: timestamp || `Row ${rowLabel}`,
                    severity: severity || "Flagged",
                    summary: renderSampleValues(row),
                };
            }),
        [sampleRows]
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
                    visibleParameters.forEach((parameter) => {
                        if (typeof row[parameter] === "number" && !Number.isNaN(row[parameter])) {
                            entry[parameter] = row[parameter];
                        }
                    });
                    return entry;
                })
                .filter((row) => row.time && hasNumericValue(row, visibleParameters));
            const hasData = chartData.length > 0 && visibleParameters.length > 0;
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
                            data={chartData}
                            margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="time" stroke="#94a3b8" minTickGap={20} />
                            <YAxis
                                stroke="#94a3b8"
                                allowDataOverflow={hasMultiScaleData}
                                domain={["auto", "auto"]}
                                padding={hasMultiScaleData ? { top: 12, bottom: 12 } : { top: 8, bottom: 8 }}
                            />
                            <Tooltip cursor={{ stroke: "#cbd5e1" }} />
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

                                return (
                                    <Line
                                        key={parameter}
                                        type={renderConfig.lineType || "monotone"}
                                        dataKey={parameter}
                                        name={label}
                                        stroke={stroke}
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
                 {card.key === "flight-dynamics" && selectedForCard.length > 0 && (
                        <div className="flex flex-wrap gap-2 rounded-lg bg-gray-50 p-2">
                            {card.parameters
                                .filter((parameter) => selectedForCard.includes(parameter))
                                .map((parameter) => {
                                    const isVisible = visibleFlightDynamics.has(parameter);
                                    const label = getParameterLabel(parameter);
                                    const disabled = !availableParameterSet.has(parameter);
                                    return (
                                        <label
                                            key={parameter}
                                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                checked={isVisible}
                                                disabled={disabled}
                                                onChange={() => handleToggleFlightDynamics(parameter)}
                                            />
                                            <span className={disabled ? "text-gray-400" : ""}>{label}</span>
                                        </label>
                                    );
                                })}
                        </div>
                    )}


                    {hasData ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {badgeParameters.map((parameter) => {
                                    const config = parameterMetadata[parameter];
                                    const badgeColor = config?.color ?? "#0f172a";
                                    const badgeBackground = config?.color
                                        ? `${config.color}1a`
                                        : "#e2e8f0";
                                    const label = config?.label || parameter;

                                    return (
                                        <span
                                            key={parameter}
                                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                            style={{
                                                backgroundColor: badgeBackground,
                                                color: badgeColor,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>

 {renderTimeSeries()}

                            {canShowScatter && (
                                <div className="min-h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={scatterData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="longitude"
                                                type="number"
                                                stroke="#94a3b8"
                                                label={{ value: "Longitude", position: "insideBottom", offset: -4, fill: "#64748b" }}
                                            />
                                            <YAxis
                                                dataKey="latitude"
                                                type="number"
                                                stroke="#94a3b8"
                                                label={{ value: "Latitude", angle: -90, position: "insideLeft", fill: "#64748b" }}
                                            />
                                            <Tooltip cursor={{ stroke: "#cbd5e1" }} />
                                            <Line
                                                type="monotone"
                                                dataKey="latitude"
                                                stroke={parameterMetadata["Latitude (deg)"]?.color || "#0f172a"}
                                                strokeWidth={2}
                                                dot={{ r: 2 }}
                                                isAnimationActive={false}
                                                name="Position"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                           {emptyMessage}
                        </div>
                    )}
                </div>
            );
        });

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
                        Continue to parameter selection
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
                                    <ComposedChart data={detectionTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="time" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip />
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

            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
                <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Visualization Parameters
                        </h2>
                        <p className="text-sm text-gray-500">
                            Choose the flight data parameters to visualize in charts.
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                            Visualization parameters selected
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                            {selectedParameters.length > 0
                                ? formatParameterList(selectedParameters)
                                : "No parameters selected"}
                        </p>
                    </div>

                    <div className="space-y-5">
                        {parameterGroups.map(({ category, parameters }) => (
                            <div key={category} className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">{category}</p>
                                <div className="space-y-2">
                                    {parameters.map((parameter) => {
                                        const isAvailable = availableParameterSet.has(parameter);
                                        const label = getParameterLabel(parameter);
                                        return (
                                            <label
                                                key={parameter}
                                                className="flex items-center gap-3 text-sm text-gray-600"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={selectedParameters.includes(parameter)}
                                                    disabled={!isAvailable}
                                                    onChange={() => toggleParameter(parameter)}
                                                />
                                                <span
                                                    className={
                                                        isAvailable ? "" : "text-gray-400"
                                                    }
                                                >
                                                    {label}
                                                    {!isAvailable && " (not in file)"}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="space-y-6">
                    <section className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Flight Parameter Overview
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Time series visualization of recorder values for the selected
                                    parameters.
                                </p>
                            </div>
                            <p className="text-xs text-gray-500">
                                Charts resize with available space for clearer trend comparisons.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {renderDashboardCards()}
                        </div>
                    </section>

                    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-gray-900">Anomaly Detection</h2>
                        </div>

                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Current scope</p>
                            <p className="font-semibold text-gray-800">
                                {detectionScopeLabel}
                            </p>
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
                                                    <p className="text-sm text-gray-500">No sample anomalies returned for this run.</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                </div>
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
