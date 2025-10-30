import React, { useEffect, useMemo, useState } from 'react';

const defaultValues = {
  caseNumber: '',
  caseName: '',
  module: 'CVR & FDR',
  status: 'Not Started',
  owner: '',
  organization: '',
  examiner: '',
  aircraftType: '',
  location: '',
  summary: '',
  lastUpdated: '',
  date: '',
  tags: '',
};

const modules = ['CVR', 'FDR', 'CVR & FDR'];
const statuses = ['Not Started', 'In Progress', 'Pending Review', 'Complete', 'Data Required'];

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

const CaseFormModal = ({
  isOpen,
  mode = 'create',
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = '',
}) => {
  const [formValues, setFormValues] = useState(defaultValues);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      setFormValues((prev) => ({
        ...prev,
        ...defaultValues,
        ...initialValues,
        lastUpdated: formatDateInput(initialValues?.lastUpdated),
        date: formatDateInput(initialValues?.date),
        tags: Array.isArray(initialValues?.tags)
          ? initialValues.tags.join(', ')
          : initialValues?.tags || '',
      }));
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.caseNumber || !formValues.caseName || !formValues.owner) {
      setLocalError('Case number, case name, and owner are required.');
      return;
    }

    try {
      await onSubmit({
        ...formValues,
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
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
              Aircraft Type
              <input
                name="aircraftType"
                type="text"
                value={formValues.aircraftType}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
              Location
              <input
                name="location"
                type="text"
                value={formValues.location}
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

          <label className="text-sm font-medium text-gray-700 flex flex-col gap-2">
            Summary
            <textarea
              name="summary"
              value={formValues.summary}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          {(localError || errorMessage) && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {localError || errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3">
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
