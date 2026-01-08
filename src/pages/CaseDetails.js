import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plane,
  Tags,
  FileText,
  AudioLines,
  PlaneTakeoff,
  Workflow,
  Clock3,
  Phone,
  Mail,
} from 'lucide-react';
import { fetchCaseByNumber, updateCase } from '../api/cases';
import { evaluateModuleReadiness } from '../utils/analysisAvailability';
import { CASE_STATUS_COMPLETED, CASE_STATUS_STARTED, CASE_STATUS_NOT_STARTED, normalizeCaseRecord } from '../utils/statuses';
import { deleteAttachmentFromObjectStore } from '../utils/storage';

const statusColors = {
  [CASE_STATUS_COMPLETED]: 'text-emerald-700 bg-emerald-100',
  [CASE_STATUS_STARTED]: 'text-amber-700 bg-amber-100',
  [CASE_STATUS_NOT_STARTED]: 'text-gray-700 bg-gray-100',
};

const analysisIcon = {
  fdr: PlaneTakeoff,
  cvr: AudioLines,
  correlate: Workflow,
};

const CaseDetails = ({ caseNumber: propCaseNumber }) => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const navigate = useNavigate();
  const { caseNumber: routeCaseNumber } = useParams();
  const caseNumber = propCaseNumber || routeCaseNumber;

  const goBack = () => {
    navigate('/cases');
  };

  useEffect(() => {
    const loadCase = async () => {
      if (!caseNumber) {
        setCaseData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setDeleteError('');
      setDeletingKey('');

      try {
        const data = await fetchCaseByNumber(caseNumber);
        setCaseData(normalizeCaseRecord(data));
      } catch (err) {
        setError(err.message || 'Unable to load case details');
        setCaseData(null);
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseNumber]);

  useEffect(() => {
    setAnalysisError('');
  }, [caseNumber]);

  const handleOpenModule = (moduleKey) => {
    if (!caseData) {
      setAnalysisError('Case details are still loading.');
      return;
    }

    const evaluation = evaluateModuleReadiness(caseData, moduleKey);
    if (!evaluation.ready) {
      setAnalysisError(evaluation.message);
      return;
    }

    setAnalysisError('');
    navigate(`/cases/${caseNumber}/${moduleKey}`);
  };

  const handleViewLatestFdrResults = () => {
    if (!caseData) {
      setAnalysisError('Case details are still loading.');
      return;
    }

    const hasLatestFdrRun = Boolean(
      caseData?.fdrAnalysisLatestRun?.createdAt || caseData?.fdrAnalysisUpdatedAt || caseData?.fdrAnalysis
    );

    if (!hasLatestFdrRun) {
      setAnalysisError('No FDR analysis run is available yet.');
      return;
    }

    setAnalysisError('');
    navigate(`/cases/${caseNumber}/fdr`);
  };

  const handleUploadData = (moduleKey, missingTypes) => {
    if (!caseNumber) {
      return;
    }

    setAnalysisError('');

    const normalizedMissing = Array.isArray(missingTypes)
      ? missingTypes.map((type) => String(type || '').toLowerCase())
      : [];

    let focusUpload = '';
    const hasFdr = normalizedMissing.includes('fdr');
    const hasCvr = normalizedMissing.includes('cvr');
    if (hasFdr && hasCvr) {
      focusUpload = 'both';
    } else if (hasFdr) {
      focusUpload = 'fdr';
    } else if (hasCvr) {
      focusUpload = 'cvr';
    }

    navigate('/cases', {
      state: {
        editCaseNumber: caseNumber,
        focusUpload,
        attemptedCase: caseNumber,
      },
    });
  };

  const handleDeleteAttachment = async (attachment) => {
    const objectKey = attachment?.storage?.objectKey || attachment?.storage?.key;
    if (!caseData || !objectKey) {
      return;
    }

    setDeleteError('');
    setDeletingKey(objectKey);

    try {
      await deleteAttachmentFromObjectStore({
        bucket: attachment.storage?.bucket,
        objectKey,
      });

      const nextAttachments = (caseData.attachments || []).filter((item) => {
        const key = item?.storage?.objectKey || item?.storage?.key;
        return key !== objectKey;
      });

      const updated = await updateCase(caseNumber, {
        ...caseData,
        attachments: nextAttachments,
      });

      setCaseData(normalizeCaseRecord(updated));
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete attachment from storage.');
    } finally {
      setDeletingKey('');
    }
  };

  const analysisCards = useMemo(() => {
    const analyses = caseData?.analyses || {};

    return [
      {
        key: 'fdr',
        title: 'FDR Analysis',
        status: analyses.fdr?.status || 'Not Started',
        lastRun: analyses.fdr?.lastRun,
        description: analyses.fdr?.summary || 'No summary available yet.',
        path: `/cases/${caseNumber}/fdr`,
        evaluation: evaluateModuleReadiness(caseData, 'fdr'),
      },
      {
        key: 'cvr',
        title: 'CVR Analysis',
        status: analyses.cvr?.status || 'Not Started',
        lastRun: analyses.cvr?.lastRun,
        description: analyses.cvr?.summary || 'No summary available yet.',
        path: `/cases/${caseNumber}/cvr`,
        evaluation: evaluateModuleReadiness(caseData, 'cvr'),
      },
      {
        key: 'correlate',
        title: 'Correlation',
        status: analyses.correlate?.status || 'Not Started',
        lastRun: analyses.correlate?.lastRun,
        description: analyses.correlate?.summary || 'No summary available yet.',
        path: `/cases/${caseNumber}/correlate`,
        evaluation: evaluateModuleReadiness(caseData, 'correlate'),
      },
    ];
  }, [caseData, caseNumber]);

  const latestFdrRun = caseData?.fdrAnalysisLatestRun;
  const latestFdrRunBy = latestFdrRun?.createdBy?.name || latestFdrRun?.createdBy?.email || '';
  const latestFdrRunTimestamp = (() => {
    const timestamp = latestFdrRun?.createdAt || caseData?.fdrAnalysisUpdatedAt;
    if (!timestamp) {
      return '';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  })();
  const hasLatestFdrRun = Boolean(
    latestFdrRunTimestamp || caseData?.fdrAnalysisLatestRun || caseData?.fdrAnalysisUpdatedAt || caseData?.fdrAnalysis
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </button>
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-sm text-gray-500">Loading case details…</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </button>
        <div className="mt-10 bg-white shadow-md rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Case not found</h2>
          <p className="mt-2 text-gray-600">
            {error || 'The selected case could not be located. Please return to the cases list and select another case.'}
          </p>
        </div>
      </div>
    );
  }

  const tags = Array.isArray(caseData.tags) ? caseData.tags : [];
  const timeline = Array.isArray(caseData.timeline) ? caseData.timeline : [];
  const attachments = Array.isArray(caseData.attachments) ? caseData.attachments : [];
  const investigatorInfo = caseData.investigator || {};
  const aircraftInfo = caseData.aircraft || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Case #{caseData.caseNumber}</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{caseData.caseName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[caseData.status] || 'bg-gray-100 text-gray-700'}`}>
                {caseData.status}
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" /> Last updated {caseData.lastUpdated || '—'}
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Plane className="w-4 h-4" /> {caseData.aircraftType || 'Unknown aircraft'}
              </span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 w-full md:w-72">
            <h2 className="text-sm font-semibold text-emerald-700">Case owner</h2>
            <p className="mt-1 text-lg font-semibold text-emerald-900">{caseData.owner}</p>
            <p className="text-sm text-emerald-700/80">{caseData.organization || '—'}</p>
            <p className="mt-3 text-sm text-emerald-700 flex items-center gap-2">
              <Clock3 className="w-4 h-4" /> Examiner: {caseData.examiner || '—'}
            </p>
            {(investigatorInfo.email || investigatorInfo.phone) && (
              <div className="mt-3 space-y-2 text-sm text-emerald-700">
                {investigatorInfo.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {investigatorInfo.email}
                  </p>
                )}
                {investigatorInfo.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {investigatorInfo.phone}
                  </p>
                )}
              </div>
            )}
            {investigatorInfo.notes && (
              <p className="mt-3 text-xs text-emerald-700/80 bg-white/60 border border-emerald-100 rounded-lg px-3 py-2">
                {investigatorInfo.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Case summary</h2>
            <p className="text-gray-700 leading-relaxed">{caseData.summary || 'No summary provided.'}</p>
          </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Key details</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-600" />
                  <span>Focus: {caseData.module || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{caseData.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Occurrence date: {caseData.date || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span>Tail number: {aircraftInfo.aircraftNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span>Operator: {aircraftInfo.operator || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  <span>Flight number: {aircraftInfo.flightNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-emerald-600" />
                  <span className="flex flex-wrap gap-2">
                  {tags.length > 0
                    ? tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))
                    : 'No tags assigned.'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {analysisError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {analysisError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysisCards.map(({ key, title, status, lastRun, description, evaluation }) => {
            const Icon = analysisIcon[key];
            const ready = evaluation?.ready;
            const missingTypes = evaluation?.missingTypes || [];
            const uploadLabel = (() => {
              if (!missingTypes.length) {
                return 'Upload recorder data';
              }

              if (missingTypes.length === 2) {
                return 'Upload FDR & CVR data';
              }

              if (missingTypes.length === 1) {
                return missingTypes[0] === 'FDR' ? 'Upload FDR data' : 'Upload CVR data';
              }

              return 'Upload recorder data';
            })();
            const isFdrCard = key === 'fdr';

            return (
              <div key={key} className="border border-gray-200 rounded-xl p-4 bg-gray-50/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                      {status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 min-h-[60px]">{description}</p>
                <p className="text-xs text-gray-500">{lastRun ? `Last updated ${lastRun}` : 'No runs yet'}</p>
                {isFdrCard ? (
                  <div className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleViewLatestFdrResults}
                        disabled={!hasLatestFdrRun}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-200"
                      >
                        View latest results
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModule('fdr')}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                      >
                        Open module
                      </button>
                    </div>
                    {hasLatestFdrRun ? (
                      <p className="text-xs text-gray-500">
                        {latestFdrRunTimestamp ? `Latest run ${latestFdrRunTimestamp}` : 'Latest run available.'}
                        {latestFdrRunBy ? ` by ${latestFdrRunBy}` : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">No analysis run yet.</p>
                    )}
                  </div>
                ) : ready ? (
                  <button
                    type="button"
                    onClick={() => handleOpenModule(key)}
                    className="mt-auto text-sm font-semibold text-emerald-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                  >
                    Open module →
                  </button>
                ) : (
                  <div className="mt-auto space-y-2">
                    <button
                      type="button"
                      onClick={() => handleUploadData(key, missingTypes)}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                    >
                      {uploadLabel} →
                    </button>
                    {evaluation?.message && (
                      <p className="text-xs text-emerald-700/90">{evaluation.message}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-500">No timeline events recorded.</p>
            ) : (
              <ol className="space-y-4">
                {timeline.map((item, index) => (
                  <li key={`${item.date}-${item.title}-${index}`} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.date || '—'}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h2>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {deleteError}
              </div>
            )}
            {attachments.length === 0 ? (
              <p className="text-sm text-gray-500">No attachments have been uploaded.</p>
            ) : (
              <ul className="space-y-4">
                {attachments.map((file, index) => {
                  const details = [
                    file.type,
                    file.size,
                    file.status ? `Status: ${file.status}` : null,
                    file.uploadedBy ? `Uploaded by ${file.uploadedBy}` : null,
                  ]
                    .filter(Boolean)
                    .join(' • ');
                  const objectKey = file?.storage?.objectKey || file?.storage?.key;
                  const isDeleting = deletingKey === objectKey;

                  return (
                    <li key={`${file.name}-${index}`} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                          <p className="text-xs text-gray-500">{details || 'No additional metadata'}</p>
                          {file.notes && (
                            <p className="text-xs text-gray-500 mt-1">{file.notes}</p>
                          )}
                        </div>
                      </div>
                      {objectKey && (
                        <div className="flex gap-2 sm:ml-8">
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(file)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isDeleting ? 'Deleting…' : 'Delete from MinIO'}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
