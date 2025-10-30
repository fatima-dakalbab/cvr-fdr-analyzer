import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_ANALYSES = {
  fdr: { status: 'Not Started', lastRun: null, summary: '' },
  cvr: { status: 'Not Started', lastRun: null, summary: '' },
  correlate: { status: 'Not Started', lastRun: null, summary: '' },
};

const modules = ['CVR', 'FDR', 'CVR & FDR', 'Correlation'];
const statuses = [
  'Data Incomplete',
  'Not Started',
  'Analysis Not Started',
  'In Progress',
  'FDR Analyzed',
  'CVR Analyzed',
  'Correlation Analyzed',
  'Pending Review',
  'Paused',
  'Complete',
  'Completed',
  'Data Required',
];

const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) {
    return '';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

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
  status: 'Data Incomplete',
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
      error: '',
      resetKey: 0,
    },
    cvr: {
      file: null,
      notes: '',
      existingAttachment: null,
      error: '',
      resetKey: 0,
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
}) => {
  const [formValues, setFormValues] = useState(() => createDefaultValues());
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      const defaults = createDefaultValues();
      const attachments = Array.isArray(initialValues?.attachments) ? initialValues.attachments : [];
      const mapUpload = (type) => {
        const existing = attachments.find((item) => item?.type === type);
        return {
          ...defaults.uploads[type.toLowerCase()],
          notes: existing?.notes || '',
          existingAttachment: existing || null,
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
        analyses:
          initialValues?.analyses && typeof initialValues.analyses === 'object'
            ? {
                ...DEFAULT_ANALYSES,
                ...initialValues.analyses,
              }
            : DEFAULT_ANALYSES,
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

  const handleFileUploadChange = (type) => (event) => {
    const file = event.target.files?.[0] || null;
    const extensions = type === 'fdr' ? FDR_EXTENSIONS : CVR_EXTENSIONS;
    const isValid = !file || extensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      event.target.value = '';
    }

    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          file: isValid ? file : null,
          error: !isValid
            ? `Please upload a valid ${type.toUpperCase()} file (${extensions.join(', ')}).`
            : '',
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

  const handleClearUpload = (type) => () => {
    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          file: null,
          error: '',
          resetKey: Date.now(),
        },
      },
    }));
  };

  const buildAttachments = (investigatorName) => {
    const uploads = formValues.uploads || {};
    const existingAttachments = Array.isArray(formValues.attachments)
      ? formValues.attachments
      : [];
    const otherAttachments = existingAttachments.filter(
      (item) => item && item.type && !['FDR', 'CVR'].includes(item.type),
    );
    const existingFdr =
      uploads.fdr?.existingAttachment || existingAttachments.find((item) => item?.type === 'FDR');
    const existingCvr =
      uploads.cvr?.existingAttachment || existingAttachments.find((item) => item?.type === 'CVR');

    const attachments = [...otherAttachments];

    const handleType = (type, upload, existing) => {
      const hasExistingData = Boolean(existing && existing.status !== 'Pending');
      const hasNewUpload = Boolean(upload?.file);
      const uploadedBy =
        existing?.uploadedBy || investigatorName || formValues.owner || 'Unknown Investigator';
      const notes = upload?.notes ?? existing?.notes ?? '';

      if (hasNewUpload) {
        attachments.push({
          type,
          name: upload.file.name,
          size: formatFileSize(upload.file.size),
          uploadedBy,
          notes,
        });
        return;
      }

      if (hasExistingData) {
        attachments.push({
          ...existing,
          notes,
        });
        return;
      }

      if (notes || existing) {
        attachments.push({
          type,
          name: existing?.name || `${type} data pending upload`,
          size: existing?.size || '',
          uploadedBy,
          notes,
          status: 'Pending',
        });
      }
    };

    handleType('FDR', uploads.fdr, existingFdr);
    handleType('CVR', uploads.cvr, existingCvr);

    const hasFdrData = Boolean(
      (uploads.fdr && uploads.fdr.file) || (existingFdr && existingFdr.status !== 'Pending'),
    );
    const hasCvrData = Boolean(
      (uploads.cvr && uploads.cvr.file) || (existingCvr && existingCvr.status !== 'Pending'),
    );

    return { attachments, hasFdrData, hasCvrData };
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

    const investigatorName = formValues.investigator?.name || '';
    const ownerValue = formValues.owner || investigatorName;

    if (!formValues.caseNumber || !formValues.caseName || !investigatorName || !ownerValue) {
      setLocalError('Case number, case name, and investigator name are required.');
      return;
    }

    if (formValues.uploads.fdr?.error || formValues.uploads.cvr?.error) {
      setLocalError('Please resolve the file upload errors before saving the case.');
      return;
    }

    try {
      const { attachments, hasFdrData, hasCvrData } = buildAttachments(investigatorName);
      const analyses = updateAnalyses(hasFdrData, hasCvrData);

      const tags = Array.isArray(formValues.tags)
        ? formValues.tags
        : (formValues.tags || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

      const { uploads, ...restFormValues } = formValues;

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
        ...restFormValues,
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
        lastUpdated: formatDateInput(formValues.lastUpdated) || null,
        date: formatDateInput(formValues.date) || null,
      });
      setLocalError('');
    } catch (error) {
      setLocalError(error.message);
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
              Upload the recorder datasets directly. Existing files remain available until you replace them.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">FDR Data</p>
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: .csv, .xls, .xlsx</p>
                  {fdrUpload.existingAttachment && (
                    <p className="text-xs text-emerald-700 mt-2">
                      Current: {fdrUpload.existingAttachment.name}
                      {fdrUpload.existingAttachment.status === 'Pending' ? ' (pending)' : ''}
                      {fdrUpload.existingAttachment.size
                        ? ` • ${fdrUpload.existingAttachment.size}`
                        : ''}
                    </p>
                  )}
                  {fdrUpload.file && (
                    <p className="text-xs text-emerald-700 mt-2">
                      Selected: {fdrUpload.file.name} • {formatFileSize(fdrUpload.file.size)}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Upload file
                    <input
                      key={`fdr-input-${fdrUpload.resetKey ?? 0}`}
                      type="file"
                      accept={FDR_EXTENSIONS.join(',')}
                      onChange={handleFileUploadChange('fdr')}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700"
                    />
                  </label>
                  {fdrUpload.file && (
                    <button
                      type="button"
                      onClick={handleClearUpload('fdr')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove selected file
                    </button>
                  )}
                  {fdrUpload.error && (
                    <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                      {fdrUpload.error}
                    </p>
                  )}
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={fdrUpload.notes || ''}
                      onChange={handleUploadNotesChange('fdr')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Add helpful reminders about this dataset"
                    />
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">CVR Data</p>
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: .wav, .mp3</p>
                  {cvrUpload.existingAttachment && (
                    <p className="text-xs text-emerald-700 mt-2">
                      Current: {cvrUpload.existingAttachment.name}
                      {cvrUpload.existingAttachment.status === 'Pending' ? ' (pending)' : ''}
                      {cvrUpload.existingAttachment.size
                        ? ` • ${cvrUpload.existingAttachment.size}`
                        : ''}
                    </p>
                  )}
                  {cvrUpload.file && (
                    <p className="text-xs text-emerald-700 mt-2">
                      Selected: {cvrUpload.file.name} • {formatFileSize(cvrUpload.file.size)}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Upload file
                    <input
                      key={`cvr-input-${cvrUpload.resetKey ?? 0}`}
                      type="file"
                      accept={CVR_EXTENSIONS.join(',')}
                      onChange={handleFileUploadChange('cvr')}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700"
                    />
                  </label>
                  {cvrUpload.file && (
                    <button
                      type="button"
                      onClick={handleClearUpload('cvr')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove selected file
                    </button>
                  )}
                  {cvrUpload.error && (
                    <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                      {cvrUpload.error}
                    </p>
                  )}
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={cvrUpload.notes || ''}
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
            <h3 className="text-lg font-semibold text-gray-800">Case Tracking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Confirm the module coverage and current workflow status after updating recorder data.
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
              <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                Status
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
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
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-semibold shadow-md"
              style={{ backgroundColor: '#019348' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseFormModal;
