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
      willUploadLater: true,
      fileName: '',
      notes: '',
    },
    cvr: {
      willUploadLater: true,
      fileName: '',
      notes: '',
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
        if (!existing) {
          return { ...defaults.uploads[type.toLowerCase()] };
        }

        const isPending = existing.status === 'Pending';
        return {
          willUploadLater: isPending,
          fileName: isPending ? '' : existing.name || '',
          notes: existing.notes || '',
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

  const handleUploadToggle = (type) => (event) => {
    const { checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          willUploadLater: checked,
          ...(checked
            ? {
                fileName: '',
              }
            : {}),
        },
      },
    }));
  };

  const handleUploadFieldChange = (type, field) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [type]: {
          ...prev.uploads[type],
          [field]: value,
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
    const existingFdr = existingAttachments.find((item) => item?.type === 'FDR');
    const existingCvr = existingAttachments.find((item) => item?.type === 'CVR');

    const attachments = [...otherAttachments];

    const hasFdrData = !uploads.fdr?.willUploadLater && Boolean(uploads.fdr?.fileName);
    const hasCvrData = !uploads.cvr?.willUploadLater && Boolean(uploads.cvr?.fileName);

    if (hasFdrData) {
      attachments.push({
        type: 'FDR',
        name: uploads.fdr.fileName,
        size: existingFdr?.size || '',
        uploadedBy: existingFdr?.uploadedBy || investigatorName || formValues.owner,
        notes: uploads.fdr.notes || existingFdr?.notes || '',
        ...(existingFdr?.status && existingFdr.status !== 'Pending'
          ? { status: existingFdr.status }
          : {}),
      });
    } else if (uploads.fdr?.notes || uploads.fdr?.willUploadLater || existingFdr) {
      attachments.push({
        type: 'FDR',
        name: 'FDR data pending upload',
        size: existingFdr?.size || '',
        uploadedBy: existingFdr?.uploadedBy || investigatorName || formValues.owner,
        notes: uploads.fdr?.notes || existingFdr?.notes || '',
        status: 'Pending',
      });
    }

    if (hasCvrData) {
      attachments.push({
        type: 'CVR',
        name: uploads.cvr.fileName,
        size: existingCvr?.size || '',
        uploadedBy: existingCvr?.uploadedBy || investigatorName || formValues.owner,
        notes: uploads.cvr.notes || existingCvr?.notes || '',
        ...(existingCvr?.status && existingCvr.status !== 'Pending'
          ? { status: existingCvr.status }
          : {}),
      });
    } else if (uploads.cvr?.notes || uploads.cvr?.willUploadLater || existingCvr) {
      attachments.push({
        type: 'CVR',
        name: 'CVR data pending upload',
        size: existingCvr?.size || '',
        uploadedBy: existingCvr?.uploadedBy || investigatorName || formValues.owner,
        notes: uploads.cvr?.notes || existingCvr?.notes || '',
        status: 'Pending',
      });
    }

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

    if (!formValues.uploads.fdr.willUploadLater && !formValues.uploads.fdr.fileName) {
      setLocalError('Please provide a file name for the uploaded FDR data or mark it to upload later.');
      return;
    }

    if (!formValues.uploads.cvr.willUploadLater && !formValues.uploads.cvr.fileName) {
      setLocalError('Please provide a file name for the uploaded CVR data or mark it to upload later.');
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
              Track the availability of FDR and CVR datasets and capture any pending follow-up notes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">FDR Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Provide the uploaded file name or leave marked for a later upload.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={formValues.uploads.fdr.willUploadLater}
                      onChange={handleUploadToggle('fdr')}
                    />
                    Upload later
                  </label>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    File name
                    <input
                      type="text"
                      value={formValues.uploads.fdr.fileName}
                      onChange={handleUploadFieldChange('fdr', 'fileName')}
                      disabled={formValues.uploads.fdr.willUploadLater}
                      placeholder="e.g. flight-fdr-data.dat"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={formValues.uploads.fdr.notes}
                      onChange={handleUploadFieldChange('fdr', 'notes')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Add helpful reminders about this dataset"
                    />
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">CVR Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Provide the uploaded file name or leave marked for a later upload.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={formValues.uploads.cvr.willUploadLater}
                      onChange={handleUploadToggle('cvr')}
                    />
                    Upload later
                  </label>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    File name
                    <input
                      type="text"
                      value={formValues.uploads.cvr.fileName}
                      onChange={handleUploadFieldChange('cvr', 'fileName')}
                      disabled={formValues.uploads.cvr.willUploadLater}
                      placeholder="e.g. flight-cvr-audio.zip"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
                    Notes
                    <textarea
                      rows={3}
                      value={formValues.uploads.cvr.notes}
                      onChange={handleUploadFieldChange('cvr', 'notes')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Add helpful reminders about this dataset"
                    />
                  </label>
                </div>
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
