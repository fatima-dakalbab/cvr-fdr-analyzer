import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  FileText,
  Mic2,
  Sparkles,
  Users,
} from "lucide-react";

const caseOptions = [
  {
    id: "AAI-UAE-2025-009",
    title: "Abu Dhabi Mid-Air Near Miss",
    aircraft: "A320-214",
    date: "12 Feb 2025",
    summary:
      "Tower intervention prevented loss of separation between two aircraft departing from adjacent runways.",
  },
  {
    id: "AAI-UAE-2024-031",
    title: "Runway Excursion Investigation",
    aircraft: "Boeing 787-9",
    date: "28 Nov 2024",
    summary:
      "Flight crew reported directional control difficulties during landing roll in gusty crosswind conditions.",
  },
  {
    id: "AAI-UAE-2025-014",
    title: "Engine Surge Event",
    aircraft: "A350-900",
    date: "04 Mar 2025",
    summary:
      "Repeated compressor stalls captured on CVR prompted deep-dive analysis into cockpit coordination and alerts.",
  },
];

const speakerChannels = [
  {
    id: "captain",
    name: "Captain",
    color: "#7c3aed",
    audioSrc: "/audio/case09-captain-separated.wav",
    downloadName: "case09-captain-separated.wav",
  },
  {
    id: "firstOfficer",
    name: "First Officer",
    color: "#0ea5e9",
    audioSrc: "/audio/case09-first-officer-separated.wav",
    downloadName: "case09-first-officer-separated.wav",
  },
  {
    id: "observer",
    name: "Observer",
    color: "#10b981",
    audioSrc: "/audio/case09-observer-separated.wav",
    downloadName: "case09-observer-separated.wav",
  },
  {
    id: "ambient",
    name: "Area Mic",
    color: "#f97316",
    audioSrc: "/audio/case09-area-mic-separated.wav",
    downloadName: "case09-area-mic-separated.wav",
  },
];

const speakerEmotionSummaries = {
  captain: { emotion: "Stressed/Fear", confidence: "0.84", intensity: 86 },
  firstOfficer: { emotion: "Neutral", confidence: "0.81", intensity: 74 },
  observer: { emotion: "Happy", confidence: "0.73", intensity: 62 },
  ambient: { emotion: "Disgusted", confidence: "0.69", intensity: 58 },
};

const channelSeparationData = [
  {
    time: "00:00",
    captain: 32,
    firstOfficer: 18,
    observer: 5,
    ambient: 12,
  },
  {
    time: "00:15",
    captain: 40,
    firstOfficer: 24,
    observer: 8,
    ambient: 16,
  },
  {
    time: "00:30",
    captain: 58,
    firstOfficer: 33,
    observer: 14,
    ambient: 19,
  },
  {
    time: "00:45",
    captain: 46,
    firstOfficer: 36,
    observer: 11,
    ambient: 22,
  },
  {
    time: "01:00",
    captain: 64,
    firstOfficer: 42,
    observer: 16,
    ambient: 25,
  },
  {
    time: "01:15",
    captain: 72,
    firstOfficer: 50,
    observer: 20,
    ambient: 30,
  },
  {
    time: "01:30",
    captain: 82,
    firstOfficer: 62,
    observer: 28,
    ambient: 35,
  },
];

const transcriptionSnippets = [
  {
    time: "00:00:12",
    speaker: "Captain",
    text: "Engine vibration increasing — let's monitor closely.",
    confidence: "0.92",
  },
  {
    time: "00:00:28",
    speaker: "First Officer",
    text: "Copy, I'll adjust the climb profile and run the checklist.",
    confidence: "0.89",
  },
  {
    time: "00:00:46",
    speaker: "Observer",
    text: "Alert light just triggered again, capturing screenshots now.",
    confidence: "0.86",
  },
  {
    time: "00:01:04",
    speaker: "Captain",
    text: "Requesting vectors back to the field, declaring PAN-PAN.",
    confidence: "0.93",
  },
];

const analysisAudioComparisons = [
  {
    id: "original",
    title: "Original Cockpit Mix",
    description: "Raw CVR capture prior to enhancement.",
    src: "/audio/case09-cockpit-original.wav",
    downloadName: "case09-cockpit-original.wav",
  },
  {
    id: "enhanced",
    title: "Enhanced Output",
    description: "Noise-reduced mix emphasising crew dialogue.",
    src: "/audio/case09-cockpit-enhanced.wav",
    downloadName: "case09-cockpit-enhanced.wav",
  },
];

const fullTranscript = `Captain: Engine vibration increasing — let's monitor closely.\nFirst Officer: Copy, I'll adjust the climb profile and run the checklist.\nObserver: Alert light just triggered again, capturing screenshots now.\nCaptain: Requesting vectors back to the field, declaring PAN-PAN.`;
const transcriptDownloadHref = "/transcripts/case09-full-transcript.txt";

const analysisStages = [
  {
    label: "Audio Conditioning",
    description: "Stabilizing gain levels and removing broadband noise.",
  },
  {
    label: "Speaker Separation",
    description: "Isolating cockpit roles into individual voice tracks.",
  },
  {
    label: "Transcription",
    description: "Producing diarized script with ATC phraseology checks.",
  },
  {
    label: "Emotion Analysis",
    description: "Scoring tonal cues for safety-relevant emotions.",
  },
];

const emotionTimeline = [
  {
    time: "00:00",
    happy: 0.14,
    neutral: 0.52,
    stressedFear: 0.2,
    sad: 0.08,
    disgusted: 0.06,
  },
  {
    time: "00:15",
    happy: 0.16,
    neutral: 0.5,
    stressedFear: 0.22,
    sad: 0.07,
    disgusted: 0.05,
  },
  {
    time: "00:30",
    happy: 0.18,
    neutral: 0.46,
    stressedFear: 0.25,
    sad: 0.07,
    disgusted: 0.04,
  },
  {
    time: "00:45",
    happy: 0.17,
    neutral: 0.41,
    stressedFear: 0.3,
    sad: 0.08,
    disgusted: 0.04,
  },
  {
    time: "01:00",
    happy: 0.15,
    neutral: 0.36,
    stressedFear: 0.35,
    sad: 0.09,
    disgusted: 0.05,
  },
  {
    time: "01:15",
    happy: 0.13,
    neutral: 0.33,
    stressedFear: 0.38,
    sad: 0.1,
    disgusted: 0.06,
  },
  {
    time: "01:30",
    happy: 0.12,
    neutral: 0.3,
    stressedFear: 0.42,
    sad: 0.1,
    disgusted: 0.06,
  },
];

const momentsOfInterest = [
  {
    time: "00:00:46",
    title: "Checklist deviation",
    description: "First Officer requests alternate engine checklist path.",
  },
  {
    time: "00:01:04",
    title: "Priority declaration",
    description: "Captain elevates urgency to PAN-PAN due to engine vibration.",
  },
  {
    time: "00:01:18",
    title: "Cabin advisory",
    description: "Observer relays cabin crew observation about unusual odor.",
  },
];

const StepBadge = ({ status }) => {
  if (status === "complete") {
    return (
      <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
        <CheckCircle2 className="w-6 h-6" />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
        <Clock className="w-5 h-5" />
      </span>
    );
  }

  return (
    <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
      <CircleDashed className="w-5 h-5" />
    </span>
  );
};

const ProgressStep = ({ label, description, status }) => (
  <div className="flex flex-col items-center text-center flex-1">
    <StepBadge status={status} />
    <p className="mt-3 text-sm font-semibold text-gray-800">{label}</p>
    <p className="mt-1 text-xs text-gray-500 max-w-[160px]">{description}</p>
  </div>
);

const EmotionLegend = () => (
  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} /> Happy
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6366f1" }} /> Neutral
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }} /> Stressed/Fear
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} /> Sad
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a855f7" }} /> Disgusted
    </div>
  </div>
);

const TabButton = ({ isActive, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
      isActive
        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
        : "border-gray-200 text-gray-500 hover:text-emerald-600"
    }`}
  >
    {children}
  </button>
);

export default function CVR() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [workflowStage, setWorkflowStage] = useState("caseSelection");
  const [progressIndex, setProgressIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");

  useEffect(() => {
    if (workflowStage === "caseSelection") {
      setProgressIndex(0);
      setShowResults(false);
    }
  }, [workflowStage]);

  useEffect(() => {
    if (workflowStage !== "analysis") {
      return;
    }

    setProgressIndex(0);
    setShowResults(false);

    let completionTimeout;
    const interval = setInterval(() => {
      setProgressIndex((prev) => {
        const next = Math.min(prev + 1, analysisStages.length);

        if (next === analysisStages.length) {
          clearInterval(interval);
          completionTimeout = setTimeout(() => {
            setProgressIndex(analysisStages.length);
            setWorkflowStage("complete");
          }, 400);
        }

        return next;
      });
    }, 1600);

    return () => {
      clearInterval(interval);
      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }
    };
  }, [workflowStage]);

  useEffect(() => {
    if (workflowStage === "complete" && progressIndex !== analysisStages.length) {
      setProgressIndex(analysisStages.length);
    }
  }, [workflowStage, progressIndex]);

  const progressSteps = analysisStages.map((stage, index) => {
    let status = "upcoming";

    if (workflowStage === "complete") {
      status = "complete";
    } else if (workflowStage === "analysis") {
      if (index < progressIndex) {
        status = "complete";
      } else if (index === progressIndex) {
        status = "current";
      }
    }

    return { ...stage, status };
  });

  const currentStage = progressSteps.find((step) => step.status === "current");
  const progressPercent =
    workflowStage === "complete"
      ? 100
      : Math.min(Math.round((progressIndex / analysisStages.length) * 100), 99);

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    setWorkflowStage("caseSelection");
    setActiveTab("analysis");
    setShowResults(false);
  };

  const handleStartAnalysis = () => {
    if (!selectedCase) return;
    setWorkflowStage("analysis");
  };

  const handleViewResults = () => {
    setShowResults(true);
    setActiveTab("analysis");
  };

  const handleChangeCase = () => {
    setSelectedCase(null);
    setWorkflowStage("caseSelection");
    setProgressIndex(0);
    setShowResults(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">CVR Module</p>
            <h1 className="text-3xl font-bold text-gray-900">Cockpit Voice Investigation</h1>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Choose the case you want to process, watch the AI pipeline work, then review the enhanced insights.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">AI Assisted Analysis</p>
              <p className="text-xs text-emerald-600">
                Noise reduction · Speaker separation · Transcription · Emotion cues
              </p>
            </div>
          </div>
        </div>
      </header>

      {workflowStage === "caseSelection" && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-900">Select a CVR case</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {caseOptions.map((caseItem) => {
                  const isSelected = selectedCase?.id === caseItem.id;
                  return (
                    <button
                      key={caseItem.id}
                      type="button"
                      onClick={() => handleCaseSelect(caseItem)}
                      className={`text-left rounded-2xl border px-4 py-4 transition shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
                        <span>Case ID</span>
                        <span className="font-semibold text-emerald-600">{caseItem.date}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-800">{caseItem.id}</p>
                      <h3 className="mt-1 text-lg font-bold text-gray-900">{caseItem.title}</h3>
                      <p className="mt-3 text-sm text-gray-600">{caseItem.summary}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>{caseItem.aircraft}</span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Selected
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border border-dashed border-emerald-200 rounded-2xl p-5 bg-emerald-50/40 min-h-[200px]">
              {selectedCase ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">Briefing</p>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCase.title}</h3>
                  <p className="text-sm text-gray-600">{selectedCase.summary}</p>
                  <dl className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <dt className="font-semibold text-gray-800">Case ID</dt>
                      <dd className="mt-1 text-gray-900">{selectedCase.id}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-800">Aircraft</dt>
                      <dd className="mt-1 text-gray-900">{selectedCase.aircraft}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-800">Date</dt>
                      <dd className="mt-1 text-gray-900">{selectedCase.date}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-center text-sm text-emerald-700">
                  <p>Select a case to review cockpit voice reconstruction in real time.</p>
                  <p className="mt-2 text-emerald-600/80">
                    The pipeline will only begin once a case is confirmed.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedCase ? `Ready to analyse ${selectedCase.id}.` : "Pick a case to enable the analysis controls."}
            </div>
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!selectedCase}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-emerald-200"
            >
              Start CVR analysis
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {workflowStage === "analysis" && selectedCase && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Running pipeline</p>
              <h2 className="text-2xl font-semibold text-gray-900">{selectedCase.id}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedCase.title}</p>
            </div>
            <button
              type="button"
              onClick={handleChangeCase}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600"
            >
              Change case
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Pipeline progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {currentStage && (
              <p className="mt-2 text-sm font-medium text-emerald-600">Currently: {currentStage.label}</p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-4">
            {progressSteps.map((step, index) => (
              <React.Fragment key={step.label}>
                <ProgressStep {...step} />
                {index < progressSteps.length - 1 && (
                  <div className="hidden lg:block h-px flex-1 bg-gray-200" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="border border-emerald-100 rounded-2xl bg-emerald-50/70 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-full bg-white text-emerald-500 flex items-center justify-center shadow-sm">
                <CircleDashed className="w-6 h-6 animate-spin" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-emerald-700">Processing audio intelligence</h3>
                <p className="text-sm text-emerald-600">
                  The CVR engine is enhancing clarity, isolating speakers, generating transcripts, and profiling emotions.
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-600/80">Estimated time ~{analysisStages.length * 6}s</div>
          </div>
        </section>
      )}

      {workflowStage === "complete" && selectedCase && (
        <>
          {!showResults && (
            <section className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">CVR pipeline</p>
                <h2 className="text-3xl font-bold text-gray-900">Analysis Ready</h2>
                <p className="text-sm text-gray-600 max-w-xl mx-auto">
                  The cockpit voice processing for {selectedCase.id} completed all four stages. Review the enhanced audio, separated speakers, transcript, and emotion insights.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleViewResults}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  View CVR results
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleChangeCase}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-2 text-sm font-semibold text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600"
                >
                  Analyze another case
                </button>
              </div>
            </section>
          )}

          {showResults && (
            <section className="bg-white border border-gray-200 rounded-2xl">
              <div className="border-b border-gray-200 px-6 pt-6 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      CVR results · {selectedCase.id}
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900">Cockpit Voice Insights</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TabButton isActive={activeTab === "analysis"} onClick={() => setActiveTab("analysis")}>
                      Audio Enhancement
                    </TabButton>
                    <TabButton isActive={activeTab === "separation"} onClick={() => setActiveTab("separation")}>
                      Speaker Separation
                    </TabButton>
                    <TabButton isActive={activeTab === "transcription"} onClick={() => setActiveTab("transcription")}>
                      Transcript
                    </TabButton>
                    <TabButton isActive={activeTab === "emotion"} onClick={() => setActiveTab("emotion")}>
                      Emotions
                    </TabButton>
                  </div>
                </div>
              </div>

              {activeTab === "analysis" && (
                <div className="px-6 py-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {analysisAudioComparisons.map((track) => (
                      <div key={track.id} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{track.title}</h4>
                            <p className="text-xs text-gray-500">{track.description}</p>
                          </div>
                          <a
                            href={track.src}
                            download={track.downloadName}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                          >
                            <FileText className="w-4 h-4" /> WAV
                          </a>
                        </div>
                        <audio
                          controls
                          preload="none"
                          src={track.src}
                          className="mt-4 w-full rounded-xl border border-gray-200"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ))}
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50/60 rounded-2xl p-5 text-sm text-emerald-700">
                    Enhanced mix applies adaptive noise gating, rebalances speech bands, and restores high-frequency clarity for downstream review.
                  </div>
                </div>
              )}

              {activeTab === "separation" && (
                <div className="px-6 py-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {speakerChannels.map((channel) => (
                      <div key={channel.id} className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{channel.name}</h4>
                            <p className="text-xs text-gray-500">Separated voice track</p>
                          </div>
                          <a
                            href={channel.audioSrc}
                            download={channel.downloadName}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                          >
                            <FileText className="w-4 h-4" /> WAV
                          </a>
                        </div>
                        <audio
                          controls
                          preload="none"
                          src={channel.audioSrc}
                          className="w-full rounded-xl border border-gray-200"
                        >
                          Your browser does not support the audio element.
                        </audio>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={channelSeparationData}>
                              <defs>
                                <linearGradient id={`${channel.id}Gradient`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={channel.color} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={channel.color} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                              <YAxis stroke="#9ca3af" fontSize={12} width={30} />
                              <Tooltip
                                formatter={(value) => [`${value} dB`, "Signal level"]}
                                labelStyle={{ color: "#374151" }}
                                contentStyle={{ borderRadius: "0.75rem", borderColor: "#e5e7eb" }}
                              />
                              <Area
                                type="monotone"
                                dataKey={channel.id}
                                stroke={channel.color}
                                fill={`url(#${channel.id}Gradient)`}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "transcription" && (
                <div className="px-6 py-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900">Full cockpit transcript</h4>
                    <a
                      href={transcriptDownloadHref}
                      download="case09-transcript.txt"
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                    >
                      <FileText className="w-4 h-4" /> Download transcript
                    </a>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-800">
                    {fullTranscript}
                  </pre>
                  <div className="grid md:grid-cols-2 gap-4">
                    {transcriptionSnippets.map((snippet) => (
                      <div key={snippet.time} className="border border-gray-200 rounded-xl bg-white p-4 text-sm text-gray-700">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{snippet.time}</p>
                        <p className="mt-1 font-semibold text-gray-900">{snippet.speaker}</p>
                        <p className="mt-1">{snippet.text}</p>
                        <p className="mt-2 text-xs text-gray-400">Confidence {snippet.confidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "emotion" && (
                <div className="px-6 py-6 space-y-6">
                  <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Emotion detection timeline</h4>
                        <p className="text-xs text-gray-500">
                          Probability of safety-relevant emotions across the recording
                        </p>
                      </div>
                      <EmotionLegend />
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={emotionTimeline}>
                          <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                          <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                          <YAxis stroke="#9ca3af" fontSize={12} width={30} domain={[0, 0.6]} />
                          <Tooltip
                            labelStyle={{ color: "#374151" }}
                            contentStyle={{ borderRadius: "0.75rem", borderColor: "#e5e7eb" }}
                          />
                          <Legend wrapperStyle={{ fontSize: "12px" }} />
                          <Line type="monotone" dataKey="happy" stroke="#22c55e" strokeWidth={2} name="Happy" />
                          <Line type="monotone" dataKey="neutral" stroke="#6366f1" strokeWidth={2} name="Neutral" />
                          <Line type="monotone" dataKey="stressedFear" stroke="#f97316" strokeWidth={2} name="Stressed/Fear" />
                          <Line type="monotone" dataKey="sad" stroke="#ef4444" strokeWidth={2} name="Sad" />
                          <Line type="monotone" dataKey="disgusted" stroke="#a855f7" strokeWidth={2} name="Disgusted" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
                    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Speaker sentiment summary</p>
                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        {speakerChannels.map((channel) => (
                          <div key={channel.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">{channel.name}</p>
                              <span
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${channel.color}15`, color: channel.color }}
                              >
                                <Mic2 className="w-4 h-4" />
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Primary detected emotion</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                              {speakerEmotionSummaries[channel.id].emotion}
                            </p>
                            <div className="mt-3 h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${speakerEmotionSummaries[channel.id].intensity}%`,
                                  backgroundColor: channel.color,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-gray-400">
                              Confidence {speakerEmotionSummaries[channel.id].confidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Moments of interest</p>
                      <div className="mt-4 space-y-4">
                        {momentsOfInterest.map((moment) => (
                          <div key={moment.time} className="border border-gray-200 rounded-xl bg-white p-4">
                            <p className="text-xs text-gray-400">{moment.time}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{moment.title}</p>
                            <p className="mt-1 text-xs text-gray-500">{moment.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}