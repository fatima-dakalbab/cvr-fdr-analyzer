import React, { useEffect, useMemo, useState } from 'react';
import { formatFileSize } from '../utils/files';
import { deriveCaseStatus } from '../utils/statuses';
import { uploadAttachmentToObjectStore } from '../utils/storage';

const DEFAULT_ANALYSES = {
  fdr: { status: 'Not Started', lastRun: null, summary: '' },
  cvr: { status: 'Not Started', lastRun: null, summary: '' },
  correlate: { status: 'Not Started', lastRun: null, summary: '' },
};

const modules = ['CVR', 'FDR', 'Correlation'];

const FDR_EXTENSIONS = ['.csv', '.xls', '.xlsx'];
const CVR_EXTENSIONS = ['.wav', '.mp3'];

const formatDateInput = (value) => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const createDefaultValues = () => ({
  caseNumber: '',
  caseName: '',
  module: 'CVR & FDR',
  status: deriveCaseStatus(),
  owner: '',
  organization: '',
  examiner: '',
  aircraftType: '',
  location: '',
  summary: '',
  lastUpdated: '',
  date: '',
  tags: '',
  investigator: {
    name: '',
    organization: '',
    phone: '',
    email: '',
    notes: '',
  },
  aircraft: {
    aircraftNumber: '',
    aircraftType: '',
    operator: '',
    flightNumber: '',
    location: '',
    dateOfFlight: '',
  },
  uploads: {
    fdr: {
      file: null,
      notes: '',
      existingAttachment: null,
    },
    cvr: {
      file: null,
      notes: '',
      existingAttachment: null,
    },
  },
  attachments: [],
  analyses: {
    fdr: { ...DEFAULT_ANALYSES.fdr },
    cvr: { ...DEFAULT_ANALYSES.cvr },
    correlate: { ...DEFAULT_ANALYSES.correlate },
  },
  timeline: [],
});

const CaseFormModal = ({
  isOpen,
  mode = 'create',
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = '',
  initialUploadFocus = '',
}) => {
  const [formValues, setFormValues] = useState(() => createDefaultValues());
  const [localError, setLocalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      const defaults = createDefaultValues();
      const attachments = Array.isArray(initialValues?.attachments) ? initialValues.attachments : [];
      const mergedAnalyses =
        initialValues?.analyses && typeof initialValues.analyses === 'object'
          ? {
            fdr: { ...DEFAULT_ANALYSES.fdr, ...(initialValues?.analyses?.fdr || {}) },
            cvr: { ...DEFAULT_ANALYSES.cvr, ...(initialValues?.analyses?.cvr || {}) },
            correlate: { ...DEFAULT_ANALYSES.correlate, ...(initialValues?.analyses?.correlate || {}) },
          }
          : { ...DEFAULT_ANALYSES };
      const mapUpload = (type) => {
        const existing = attachments.find((item) => item?.type === type);
        if (!existing) {
          return { ...defaults.uploads[type.toLowerCase()] };
        }

        return {
          file: null,
          notes: existing.notes || '',
          existingAttachment: existing,
        };
      };

      setFormValues({
        ...defaults,
        ...initialValues,
        owner: initialValues?.owner || initialValues?.investigator?.name || '',
        organization: initialValues?.organization || '',
        examiner: initialValues?.examiner || initialValues?.investigator?.name || '',
        aircraftType:
          initialValues?.aircraftType || initialValues?.aircraft?.aircraftType || defaults.aircraftType,
        location: initialValues?.location || initialValues?.aircraft?.location || defaults.location,
        lastUpdated: formatDateInput(initialValues?.lastUpdated),
        date: formatDateInput(initialValues?.date),
        tags: Array.isArray(initialValues?.tags)
          ? initialValues.tags.join(', ')
          : initialValues?.tags || '',
        investigator: {
          ...defaults.investigator,
          ...(initialValues?.investigator || {}),
        },
        aircraft: {
          ...defaults.aircraft,
          ...(initialValues?.aircraft || {}),
          dateOfFlight: formatDateInput(initialValues?.aircraft?.dateOfFlight),
        },
        uploads: {
          fdr: mapUpload('FDR'),
          cvr: mapUpload('CVR'),
        },
        attachments,
        analyses: mergedAnalyses,
        status: deriveCaseStatus({ attachments, analyses: mergedAnalyses }),
        timeline: Array.isArray(initialValues?.timeline) ? initialValues.timeline : [],
      });
    }
  }, [initialValues, isOpen]);

  const title = useMemo(() => (mode === 'edit' ? 'Edit Case' : 'Create New Case'), [mode]);

  if (!isOpen) {
    return null;
  }

  const fdrUpload = formValues.uploads?.fdr || {};
  const cvrUpload = formValues.uploads?.cvr || {};
  const normalizedFocus = (initialUploadFocus || '').toLowerCase();
  const highlightFdr = normalizedFocus === 'fdr' || normalizedFocus === 'both';
  const highlightCvr = normalizedFocus === 'cvr' || normalizedFocus === 'both';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleInvestigatorChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      investigator: {
        ...prev.investigator,
        [name]: value,
      },
    }));
  };

  const handleAircraftChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      aircraft: {
        ...prev.aircraft,
        [name]: value,
      },
      ...(name === 'aircraftType' ? { aircraftType: value } : {}),
      ...(name === 'location' ? { location: value } : {}),
    }));
  };

  const handleFileChange = (type) => (event) => {
    const file = event.target.files?.[0] || null;
    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          file,
        },
      },
    }));
  };

  const handleUploadNotesChange = (type) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          notes: value,
        },
      },
    }));
  };

  const attachmentHasStoredData = (attachment) => {
    if (!attachment || typeof attachment !== 'object') {
      return false;
    }

    if (attachment.storage && attachment.storage.objectKey) {
      return true;
    }

    const status = typeof attachment.status === 'string' ? attachment.status.toLowerCase() : '';
    const name = typeof attachment.name === 'string' ? attachment.name.toLowerCase() : '';

    if (status === 'pending' || name.includes('pending upload')) {
      return false;
    }

    return Boolean(attachment.name);
  };

  const buildAttachments = async (investigatorName) => {
    const uploads = formValues.uploads || {};
    const existingAttachments = Array.isArray(formValues.attachments)
      ? formValues.attachments
      : [];
    const otherAttachments = existingAttachments.filter(
      (item) => item && item.type && !['FDR', 'CVR'].includes(item.type),
    );

    const attachments = [...otherAttachments];
    const ownerValue = investigatorName || formValues.owner || '';

    const processUpload = async (key, label) => {
      const upload = uploads[key] || {};
      const existing =
        upload.existingAttachment ||
        existingAttachments.find((item) => item?.type === label);
      const file = upload.file;
      const notes = upload.notes ?? existing?.notes ?? '';
      const uploadedBy = existing?.uploadedBy || ownerValue || investigatorName || 'Unknown';

      if (file) {
        const result = await uploadAttachmentToObjectStore({
          caseNumber: formValues.caseNumber,
          attachmentType: label,
          file,
          existingAttachments: [...attachments, ...existingAttachments],
        });

        attachments.push({
          type: label,
          name: file.name,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          uploadedBy,
          notes,
          status: 'Uploaded',
          storage: result.storage,
          contentType: result.contentType,
          uploadedAt: result.uploadedAt,
          checksum: result.checksum,
        });
        return { hasData: true, uploadedNow: true };

      }

      if (existing) {
        attachments.push({
          ...existing,
          notes,
        });

        return {
          hasData: attachmentHasStoredData(existing),
          uploadedNow: false,
        };
      }

      if (notes) {
        attachments.push({
          type: label,
          name: `${label} data pending upload`,
          size: '',
          uploadedBy,
          notes,
          status: 'Pending',
        });
      }

      return { hasData: false, uploadedNow: false };
    };

    const fdrResult = await processUpload('fdr', 'FDR');
    const cvrResult = await processUpload('cvr', 'CVR');

    return {
      attachments,
      hasFdrData: fdrResult.hasData,
      hasCvrData: cvrResult.hasData,
      fdrUploadedNow: fdrResult.uploadedNow,
      cvrUploadedNow: cvrResult.uploadedNow,
    };
  };

  const updateAnalyses = (hasFdrData, hasCvrData) => {
    const existing = formValues.analyses && typeof formValues.analyses === 'object'
      ? formValues.analyses
      : DEFAULT_ANALYSES;

    const next = {
      fdr: { ...DEFAULT_ANALYSES.fdr, ...existing.fdr },
      cvr: { ...DEFAULT_ANALYSES.cvr, ...existing.cvr },
      correlate: { ...DEFAULT_ANALYSES.correlate, ...existing.correlate },
    };

    const promoteIfReady = (analysis, type) => ({
      ...analysis,
      status:
        !analysis.status ||
          analysis.status === 'Data Not Uploaded' ||
          analysis.status === 'Not Started'
          ? 'Ready for Analysis'
          : analysis.status,
      summary:
        analysis.status === 'Data Not Uploaded' || !analysis.summary
          ? `${type} data uploaded and ready for analysis.`
          : analysis.summary,
    });

    const markPending = (analysis) => ({
      ...analysis,
      status:
        !analysis.status ||
          analysis.status === 'Ready for Analysis' ||
          analysis.status === 'Not Started' ||
          analysis.status === 'Data Not Uploaded'
          ? 'Data Not Uploaded'
          : analysis.status,
      summary:
        analysis.status === 'Ready for Analysis' ||
          analysis.status === 'Not Started' ||
          analysis.status === 'Data Not Uploaded'
          ? 'Upload required before analysis can begin.'
          : analysis.summary,
    });

    next.fdr = hasFdrData ? promoteIfReady(next.fdr, 'FDR') : markPending(next.fdr);
    next.cvr = hasCvrData ? promoteIfReady(next.cvr, 'CVR') : markPending(next.cvr);

    const correlateReady = hasFdrData && hasCvrData;
    next.correlate = correlateReady
      ? {
        ...next.correlate,
        status: next.correlate.status === 'Blocked' ? 'Not Started' : next.correlate.status,
        summary:
          next.correlate.status === 'Blocked'
            ? 'Correlation can begin once initial analyses are completed.'
            : next.correlate.summary,
      }
      : {
        ...next.correlate,
        status:
          !next.correlate.status ||
            next.correlate.status === 'Not Started' ||
            next.correlate.status === 'Blocked'
            ? 'Blocked'
            : next.correlate.status,
        summary:
          !next.correlate.summary || next.correlate.status === 'Blocked'
            ? 'Requires both FDR and CVR datasets to proceed.'
            : next.correlate.summary,
      };

    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isProcessing) {
      return;
    }

    const investigatorName = formValues.investigator?.name || '';
    const ownerValue = formValues.owner || investigatorName;

    if (!formValues.caseNumber || !formValues.caseName || !investigatorName || !ownerValue) {
      setLocalError('Case number, case name, and investigator name are required.');
      return;
    }

    try {
      setIsProcessing(true);
      setLocalError('');

      const {
        attachments,
        hasFdrData,
        hasCvrData,
        fdrUploadedNow,
        cvrUploadedNow,
      } = await buildAttachments(investigatorName);
      const analyses = updateAnalyses(hasFdrData, hasCvrData);
      const uploadedNow = fdrUploadedNow || cvrUploadedNow;
      const derivedStatus = deriveCaseStatus({ attachments, analyses });
      const currentDate = new Date().toISOString().slice(0, 10);
      const normalizedLastUpdated = uploadedNow
        ? currentDate
        : formatDateInput(formValues.lastUpdated) || null;

      setFormValues((prev) => ({
        ...prev,
        status: derivedStatus,
        lastUpdated: uploadedNow ? currentDate : prev.lastUpdated,
      }));
      const sanitizedUploads = {
        fdr: {
          notes: formValues.uploads?.fdr?.notes || '',
          existingAttachment: formValues.uploads?.fdr?.existingAttachment || null,
          ...(formValues.uploads?.fdr?.file
            ? {
              selectedFileName: formValues.uploads.fdr.file.name,
              selectedFileSize: formValues.uploads.fdr.file.size,
            }
            : {}),
        },
        cvr: {
          notes: formValues.uploads?.cvr?.notes || '',
          existingAttachment: formValues.uploads?.cvr?.existingAttachment || null,
          ...(formValues.uploads?.cvr?.file
            ? {
              selectedFileName: formValues.uploads.cvr.file.name,
              selectedFileSize: formValues.uploads.cvr.file.size,
            }
            : {}),
        },
      };

      const tags = Array.isArray(formValues.tags)
        ? formValues.tags
        : (formValues.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

      const aircraft = {
        ...createDefaultValues().aircraft,
        ...formValues.aircraft,
        aircraftType: formValues.aircraft?.aircraftType || formValues.aircraftType || '',
        location: formValues.aircraft?.location || formValues.location || '',
        dateOfFlight: formatDateInput(formValues.aircraft?.dateOfFlight) || null,
      };

      const investigator = {
        ...createDefaultValues().investigator,
        ...formValues.investigator,
      };

      await onSubmit({
        ...formValues,
        status: derivedStatus,
        uploads: sanitizedUploads,
        owner: ownerValue,
        examiner: formValues.examiner || investigatorName,
        aircraftType: aircraft.aircraftType,
        location: aircraft.location,
        investigator,
        aircraft,
        attachments,
        analyses,
        timeline: Array.isArray(formValues.timeline) ? formValues.timeline : [],
        tags,
        lastUpdated: normalizedLastUpdated,
        date: formatDateInput(formValues.date) || null,
      });
    } catch (error) {
      setLocalError(error.message || 'Unable to save case changes.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">
              Provide key details about the investigation case.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-8 overflow-y-auto max-h-[75vh] pr-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Case Overview</h3>
            <p className="text-sm text-gray-500 mb-4">
              Update the essential details for this investigation case.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Case Number
                <input
                  name="caseNumber"
                  type="text"
                  value={formValues.caseNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={mode === 'edit'}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Case Name
                <input
                  name="caseName"
                  type="text"
                  value={formValues.caseName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Owner
                <input
                  name="owner"
                  type="text"
                  value={formValues.owner}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Organization
                <input
                  name="organization"
                  type="text"
                  value={formValues.organization}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Examiner
                <input
                  name="examiner"
                  type="text"
                  value={formValues.examiner}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Last Updated
                <input
                  name="lastUpdated"
                  type="date"
                  value={formValues.lastUpdated}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Occurrence Date
                <input
                  name="date"
                  type="date"
                  value={formValues.date}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2 md:col-span-2">
                Tags
                <input
                  name="tags"
                  type="text"
                  value={formValues.tags}
                  onChange={handleChange}
                  placeholder="Comma separated keywords"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
            <textarea
              name="summary"
              value={formValues.summary}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Investigator Information</h3>
            <p className="text-sm text-gray-500 mb-4">Keep the primary contact for this case up to date.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Name
                <input
                  name="name"
                  type="text"
                  value={formValues.investigator.name}
                  onChange={handleInvestigatorChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Organization
                <input
                  name="organization"
                  type="text"
                  value={formValues.investigator.organization}
                  onChange={handleInvestigatorChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Phone
                <input
                  name="phone"
                  type="text"
                  value={formValues.investigator.phone}
                  onChange={handleInvestigatorChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Email
                <input
                  name="email"
                  type="email"
                  value={formValues.investigator.email}
                  onChange={handleInvestigatorChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700 flex flex-col gap-2 mt-4">
              Notes
              <textarea
                name="notes"
                value={formValues.investigator.notes}
                onChange={handleInvestigatorChange}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Aircraft Information</h3>
            <p className="text-sm text-gray-500 mb-4">Capture the aircraft context for this case.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Tail Number
                <input
                  name="aircraftNumber"
                  type="text"
                  value={formValues.aircraft.aircraftNumber}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Aircraft Type
                <input
                  name="aircraftType"
                  type="text"
                  value={formValues.aircraft.aircraftType}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Operator
                <input
                  name="operator"
                  type="text"
                  value={formValues.aircraft.operator}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Flight Number
                <input
                  name="flightNumber"
                  type="text"
                  value={formValues.aircraft.flightNumber}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Location
                <input
                  name="location"
                  type="text"
                  value={formValues.aircraft.location}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Date of Flight
                <input
                  name="dateOfFlight"
                  type="date"
                  value={formValues.aircraft.dateOfFlight}
                  onChange={handleAircraftChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Data Uploads</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload the latest FDR and CVR datasets and add any supporting notes.
            </p>
            {(highlightFdr || highlightCvr) && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {highlightFdr && highlightCvr
                  ? 'Upload both the FDR and CVR datasets to enable analysis for this case.'
                  : highlightFdr
                    ? 'Upload the FDR dataset to unlock FDR-related analysis.'
                    : 'Upload the CVR dataset to unlock CVR-related analysis.'}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                className={`border rounded-xl p-4 ${
                  highlightFdr
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/40'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">FDR Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload the recorded flight data file for this case.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                      Upload file
                      <input
                        type="file"
                        accept={FDR_EXTENSIONS.join(',')}
                        onChange={handleFileChange('fdr')}
                        className="block w-full text-sm text-gray-700 border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700"
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Accepted formats: {FDR_EXTENSIONS.map((ext) => ext.replace('.', '').toUpperCase()).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fdrUpload.file
                        ? `Selected file: ${fdrUpload.file.name} (${formatFileSize(fdrUpload.file.size)})`
                        : fdrUpload.existingAttachment
                          ? `Current file: ${fdrUpload.existingAttachment.name || 'Pending upload'}${fdrUpload.existingAttachment.size ? ` (${fdrUpload.existingAttachment.size})` : ''
                          }`
                          : 'No file uploaded yet.'}
                    </p>
                  </div>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={formValues.uploads.fdr.notes}
                      onChange={handleUploadNotesChange('fdr')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Add helpful reminders about this dataset"
                    />
                  </label>
                </div>
              </div>

              <div
                className={`border rounded-xl p-4 ${
                  highlightCvr
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/40'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">CVR Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload the cockpit voice recording associated with this case.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                      Upload file
                      <input
                        type="file"
                        accept={CVR_EXTENSIONS.join(',')}
                        onChange={handleFileChange('cvr')}
                        className="block w-full text-sm text-gray-700 border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-emerald-700"
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Accepted formats: {CVR_EXTENSIONS.map((ext) => ext.replace('.', '').toUpperCase()).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cvrUpload.file
                        ? `Selected file: ${cvrUpload.file.name} (${formatFileSize(cvrUpload.file.size)})`
                        : cvrUpload.existingAttachment
                          ? `Current file: ${cvrUpload.existingAttachment.name || 'Pending upload'}${cvrUpload.existingAttachment.size ? ` (${cvrUpload.existingAttachment.size})` : ''
                          }`
                          : 'No file uploaded yet.'}
                    </p>
                  </div>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={formValues.uploads.cvr.notes}
                      onChange={handleUploadNotesChange('cvr')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Add helpful reminders about this dataset"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800">Case Settings</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose the appropriate module. Case status updates automatically based on uploaded data
              and analysis progress.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Module
                <select
                  name="module"
                  value={formValues.module}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {modules.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Status (automatic)
                <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                  {formValues.status || 'Data Required'}
                </span>
              </div>
            </div>
          </div>

          {(localError || errorMessage) && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {localError || errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              disabled={isSubmitting || isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-semibold shadow-md"
              style={{ backgroundColor: '#019348' }}
              disabled={isSubmitting || isProcessing}
            >
              {isProcessing
                ? 'Uploading…'
                : isSubmitting
                  ? 'Saving…'
                  : mode === 'edit'
                    ? 'Save Changes'
                    : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseFormModal;
