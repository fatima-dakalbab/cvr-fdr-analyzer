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
import fdrParameterMap from "../config/fdr-parameter-map";

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

const buildParameterGroups = (entries) => {
    const groups = entries.reduce((acc, entry) => {
        const groupName = entry.group || "Other";
        if (!acc[groupName]) {
            acc[groupName] = [];
        }

        acc[groupName].push(entry.key);
        return acc;
    }, {});

    return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, parameters]) => ({
            category,
            parameters: parameters.sort((a, b) => {
                const labelA = fdrParameterMap[a]?.label || a;
                const labelB = fdrParameterMap[b]?.label || b;
                return labelA.localeCompare(labelB);
            }),
        }));
};

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

const parameterEntries = Object.entries(fdrParameterMap).map(
    ([key, metadata], index) => ({
        key,
        ...metadata,
        color: colorPalette[index % colorPalette.length],
    })
);

const parameterMetadata = parameterEntries.reduce((acc, entry) => {
    acc[entry.key] = entry;
    return acc;
}, {});

const parameterMatchingKeywords = {
    ALTITUDE: ["altitude"],
    AIRSPEED: ["airspeed", "speed"],
    PERCENT_POWER: ["n1", "percent power"],
};

const parameterGroups = buildParameterGroups(parameterEntries);
const defaultSelectedParameters = ["ALTITUDE", "AIRSPEED", "ENGINE_RPM_L"].filter(
    (key) => parameterMetadata[key]
);
const parameterKeys = Object.keys(parameterMetadata);
const getParameterLabel = (key) => parameterMetadata[key]?.label || key;
const formatParameterList = (keys = []) =>
    keys
        .map((key) => getParameterLabel(key))
        .filter(Boolean)
        .join(", ");

const sampleNormalizedRows = [
    {
        time: "00:00",
        ALTITUDE: 1200,
        PRESSURE_ALTITUDE: 1185,
        AIRSPEED: 145,
        VERTICAL_SPEED: 450,
        HEADING: 92,
        PERCENT_POWER: 68,
        ENGINE_RPM_L: 2200,
        ENGINE_RPM_R: 2180,
        FUEL_FLOW_1: 8.2,
        FUEL_LEVEL_L: 46,
        FUEL_LEVEL_R: 47,
        OAT: 18,
        LATITUDE: 24.45,
        LONGITUDE: 54.38,
    },
    {
        time: "00:10",
        ALTITUDE: 1800,
        PRESSURE_ALTITUDE: 1782,
        AIRSPEED: 152,
        VERTICAL_SPEED: 520,
        HEADING: 94,
        PERCENT_POWER: 70,
        ENGINE_RPM_L: 2250,
        ENGINE_RPM_R: 2230,
        FUEL_FLOW_1: 8.6,
        FUEL_LEVEL_L: 45.6,
        FUEL_LEVEL_R: 46.8,
        OAT: 17.5,
        LATITUDE: 24.46,
        LONGITUDE: 54.39,
    },
    {
        time: "00:20",
        ALTITUDE: 2400,
        PRESSURE_ALTITUDE: 2388,
        AIRSPEED: 160,
        VERTICAL_SPEED: 580,
        HEADING: 96,
        PERCENT_POWER: 73,
        ENGINE_RPM_L: 2310,
        ENGINE_RPM_R: 2290,
        FUEL_FLOW_1: 9.1,
        FUEL_LEVEL_L: 45.1,
        FUEL_LEVEL_R: 46.2,
        OAT: 17,
        LATITUDE: 24.47,
        LONGITUDE: 54.41,
    },
    {
        time: "00:30",
        ALTITUDE: 2900,
        PRESSURE_ALTITUDE: 2885,
        AIRSPEED: 166,
        VERTICAL_SPEED: 540,
        HEADING: 99,
        PERCENT_POWER: 75,
        ENGINE_RPM_L: 2360,
        ENGINE_RPM_R: 2340,
        FUEL_FLOW_1: 9.4,
        FUEL_LEVEL_L: 44.7,
        FUEL_LEVEL_R: 45.9,
        OAT: 16.4,
        LATITUDE: 24.48,
        LONGITUDE: 54.42,
    },
    {
        time: "00:40",
        ALTITUDE: 3200,
        PRESSURE_ALTITUDE: 3190,
        AIRSPEED: 170,
        VERTICAL_SPEED: 510,
        HEADING: 101,
        PERCENT_POWER: 76,
        ENGINE_RPM_L: 2385,
        ENGINE_RPM_R: 2365,
        FUEL_FLOW_1: 9.6,
        FUEL_LEVEL_L: 44.2,
        FUEL_LEVEL_R: 45.5,
        OAT: 16,
        LATITUDE: 24.49,
        LONGITUDE: 54.43,
    },
    {
        time: "00:50",
        ALTITUDE: 3600,
        PRESSURE_ALTITUDE: 3592,
        AIRSPEED: 176,
        VERTICAL_SPEED: 470,
        HEADING: 102,
        PERCENT_POWER: 78,
        ENGINE_RPM_L: 2410,
        ENGINE_RPM_R: 2388,
        FUEL_FLOW_1: 9.8,
        FUEL_LEVEL_L: 43.8,
        FUEL_LEVEL_R: 45.1,
        OAT: 15.6,
        LATITUDE: 24.5,
        LONGITUDE: 54.44,
    },
];

const detectionTrendKeys = [
    "ALTITUDE",
    "AIRSPEED",
    "PERCENT_POWER",
    "ENGINE_RPM_L",
    "ENGINE_RPM_R",
    "VERTICAL_SPEED",
];

const algorithmDisplayNames = {
    zscore: "Z-score",
    iqr: "IQR",
    isolation_forest: "Isolation Forest",
};

const toNumber = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const numeric = Number.parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    return Number.isNaN(numeric) ? null : numeric;
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

const findMatchingHeader = (headers = [], csvKey = "", keywords = []) => {
    const normalizedHeaders = headers.map((header) => ({
        raw: header,
        value: String(header || "").toLowerCase(),
    }));
    const normalizedKeywords = [csvKey, ...keywords]
        .map((keyword) => String(keyword || "").toLowerCase())
        .filter(Boolean);

    for (const keyword of normalizedKeywords) {
        const exact = normalizedHeaders.find((header) => header.value === keyword);
        if (exact) {
            return exact.raw;
        }
    }

    for (const keyword of normalizedKeywords) {
        const partial = normalizedHeaders.find((header) =>
            header.value.includes(keyword)
        );

        if (partial) {
            return partial.raw;
        }
    }

    return null;
};

const buildParameterColumnMap = (headers = []) => {
    const matches = {};

    parameterEntries.forEach(({ key, csvKey }) => {
        const keywordHints = parameterMatchingKeywords[key] || [];
        const match = findMatchingHeader(headers, csvKey, keywordHints);

        if (match) {
            matches[key] = [match];
        } else if (csvKey) {
            matches[key] = [csvKey];
        } else {
            matches[key] = [];
        }
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

        parameterEntries.forEach(({ key, csvKey }) => {
            const columnsToTry = columnMap[key]?.length
                ? columnMap[key]
                : [csvKey].filter(Boolean);
            const value = pickNumeric(row, columnsToTry);
            if (value !== null) {
                normalized[key] = value;
            }
        });

        return normalized;
    });
};

const hasNumericValue = (row, keys) =>
    keys.some((key) => typeof row[key] === "number" && !Number.isNaN(row[key]));

const truncateSeries = (series, maxPoints = 500) =>
    series.length > maxPoints ? series.slice(0, maxPoints) : series;

const buildCategorySamplesFromRows = (rows) => {
    const groupedSamples = {};

    parameterGroups.forEach(({ category, parameters }) => {
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

        groupedSamples[category] = samples;
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
    parameterEntries
        .map((definition) => {
            const values = rows
                .map((row) => row[definition.key])
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

const defaultCategorySamples = buildCategorySamplesFromRows(sampleNormalizedRows);
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
    const [categorySamples, setCategorySamples] = useState(defaultCategorySamples);
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
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [anomalyError, setAnomalyError] = useState("");
    const [isLoadingFdrData, setIsLoadingFdrData] = useState(false);
    const [fdrDataError, setFdrDataError] = useState("");
    const isLinkedRoute = Boolean(caseNumber);
    const [workflowStage, setWorkflowStage] = useState(
        isLinkedRoute ? "analysis" : "caseSelection"
    );
    const availableParameterSet = useMemo(
        () => new Set(availableParameters || []),
        [availableParameters]
    );
    const activeDetectionParameters = useMemo(
        () =>
            selectedParameters.length > 0
                ? selectedParameters
                : availableParameters,
        [availableParameters, selectedParameters]
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

        const normalized =
            typeof sourceAlgorithm === "string"
                ? sourceAlgorithm.toLowerCase()
                : sourceAlgorithm;

        return algorithmDisplayNames[normalized] || sourceAlgorithm || null;
    }, [anomalyResult, selectedAlgorithm]);
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
            setCategorySamples(defaultCategorySamples);
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
            setCategorySamples(defaultCategorySamples);
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

                const derivedCategories = buildCategorySamplesFromRows(rows);
                const availability = deriveAvailableParameters(rows);
                const parameterTable = buildParameterTable(rows);
                const trends = buildDetectionTrendSeries(rows);
                setNormalizedRows(rows);

                setCategorySamples({
                    "Flight Dynamics":
                        derivedCategories["Flight Dynamics"]?.length > 0
                            ? derivedCategories["Flight Dynamics"]
                            : defaultCategorySamples["Flight Dynamics"],
                    Engines:
                        derivedCategories.Engines?.length > 0
                            ? derivedCategories.Engines
                            : defaultCategorySamples.Engines,
                    "Flight Controls":
                        derivedCategories["Flight Controls"]?.length > 0
                            ? derivedCategories["Flight Controls"]
                            : defaultCategorySamples["Flight Controls"],
                });

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

                setCategorySamples(defaultCategorySamples);
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
        const detectionParameters = activeDetectionParameters;

        if (detectionParameters.length === 0 || !caseNumber) {
            return;
        }

        if (selectedParameters.length === 0) {
            setSelectedParameters(detectionParameters);
        }

        setIsRunningDetection(true);
        setAnomalyError("");
        setAnomalyResult(null);

        try {
            const result = await runFdrAnomalyDetection(caseNumber, {
                parameters: detectionParameters,
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

    const categoryOrder = parameterGroups.map((group) => group.category);
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

    const renderSampleValues = (row) => {
        if (!row || typeof row !== "object") {
            return String(row ?? "");
        }

        const base = row.parameters || row.values || row.metrics || row;
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

    const renderCategoryCharts = () =>
        categoryOrder.map((category) => {
            const categoryParameters = (
                parameterGroups.find((group) => group.category === category)?.parameters || []
            ).filter((parameter) => availableParameterSet.has(parameter));
            const activeParameters = categoryParameters.filter((parameter) =>
                selectedParameters.includes(parameter)
            );
            const chartData = categorySamples[category] || [];
            const hasData = chartData.length > 0 && activeParameters.length > 0;
            const noMatches =
                categoryParameters.length > 0 && chartData.length === 0;

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

                    {hasData ? (
                        <>
                            <div className="flex flex-wrap gap-2">
                                {activeParameters.map((parameter) => {
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

                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="time" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip />
                                        {activeParameters.map((parameter) => {
                                            const config = parameterMetadata[parameter];
                                            const stroke = config?.color ?? "#0f172a";
                                            const label = config?.label || parameter;

                                            return (
                                                <Line
                                                    key={parameter}
                                                    type="monotone"
                                                    dataKey={parameter}
                                                    name={label}
                                                    stroke={stroke}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            );
                                        })}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                            {noMatches
                                ? "No matching numeric column found for this selection."
                                : categoryParameters.length === 0
                                  ? "No recorded parameters for this category in the uploaded file."
                                  : `Select ${category.toLowerCase()} parameters to visualize trends.`}
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
                        onClick={handleChangeCase}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-emerald-200 hover:text-emerald-600"
                    >
                        Change case
                    </button>
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
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-gray-900">Anomaly Detection</h2>
                        <p className="text-sm text-gray-500">
                            Use the parameter selector to control both the charts and anomaly analysis. If nothing is
                            selected, all available numeric parameters will be included automatically.
                        </p>
                    </div>

                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 space-y-2 text-sm text-gray-700">
                        <p>
                            Detection runs on the parameters selected in the left panel. If none are selected, all available
                            numeric parameters will be analyzed.
                        </p>
                        <p className="text-xs text-gray-500">
                            Current scope: {activeDetectionParameters.length > 0
                                ? formatParameterList(activeDetectionParameters)
                                : "No numeric parameters were detected in the uploaded file."}
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

                    <button
                        type="button"
                        onClick={handleRunDetection}
                        disabled={isRunningDetection || availableParameters.length === 0}
                        className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                        style={{ backgroundColor: "#019348" }}
                    >
                        {isRunningDetection ? "Running..." : "Run Anomaly Detection"}
                    </button>

                    {anomalyError && (
                        <p className="text-sm text-red-600">{anomalyError}</p>
                    )}

                    <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
                        Machine learning output will populate anomaly summaries and visualizations once integrated with the
                        detection pipeline.
                    </div>

                    {(isRunningDetection || anomalyResult || anomalyError) && (
                        <div className="rounded-lg border border-gray-200 bg-white/60 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Detection Summary
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Latest run for {selectedCase?.id || caseNumber || "current case"}
                                    </p>
                                </div>
                                {isRunningDetection && (
                                    <span className="text-xs font-semibold text-emerald-700">
                                        Running...
                                    </span>
                                )}
                            </div>

                            {anomalyError && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    {anomalyError}
                                </div>
                            )}

                            {!anomalyError && !anomalyResult && isRunningDetection && (
                                <p className="text-sm text-gray-600">
                                    Running anomaly detection. This may take a few moments.
                                </p>
                            )}

                            {!anomalyError && anomalyResult && (
                                <>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <p className="text-xs text-gray-500">Total rows</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {totalRows ?? "—"}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <p className="text-xs text-gray-500">Anomalies</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {anomalyCount ?? sampleRows.length ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {algorithmUsed && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Algorithm: {" "}
                                            <span className="font-semibold text-gray-700">
                                                {algorithmUsed}
                                            </span>
                                        </p>
                                    )}

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
                                            No anomalies detected for the selected parameters.
                                        </div>
                                    )}

                                    {!noAnomaliesDetected && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-700">
                                                Sample anomalous rows
                                            </p>
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