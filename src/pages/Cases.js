import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import CaseFormModal from '../components/CaseFormModal';
import NewCaseWizard from '../components/NewCaseWizard';
import {
  fetchCases,
  fetchCaseByNumber,
  createCase,
  updateCase,
  deleteCase,
} from '../api/cases';
import { evaluateModuleReadiness } from '../utils/analysisAvailability';

import { CASE_STATUS_OPTIONS, CASE_STATUS_NOT_STARTED, CASE_STATUS_STARTED, CASE_STATUS_COMPLETED, normalizeCaseRecord } from '../utils/statuses';

const FALLBACK_MODULE_LABEL = 'No Data Uploaded';

const formatDateString = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return typeof value === 'string' ? value : null;
  }

  return parsed.toISOString().slice(0, 10);
};

const statusStyles = {
  [CASE_STATUS_COMPLETED]: 'bg-emerald-100 text-emerald-700',
  [CASE_STATUS_STARTED]: 'bg-amber-100 text-amber-700',
  [CASE_STATUS_NOT_STARTED]: 'bg-gray-200 text-gray-700',
};

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [moduleCheck, setModuleCheck] = useState('');
  const [uploadFocus, setUploadFocus] = useState('');
  const [pendingEditRequest, setPendingEditRequest] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState([]);
  const [moduleFilters, setModuleFilters] = useState([]);

  const sortCasesByRecency = useCallback((list) => {
    if (!Array.isArray(list)) {
      return [];
    }

    const toTimestamp = (value) => {
      if (!value) {
        return null;
      }

      const parsed = new Date(value);
      const time = parsed.getTime();
      return Number.isNaN(time) ? null : time;
    };

    return [...list].sort((a, b) => {
      const aTimes = [a.lastUpdated, a.updatedAt, a.createdAt]
        .map(toTimestamp)
        .filter((item) => item !== null);
      const bTimes = [b.lastUpdated, b.updatedAt, b.createdAt]
        .map(toTimestamp)
        .filter((item) => item !== null);

      const aTime = aTimes.length > 0 ? Math.max(...aTimes) : 0;
      const bTime = bTimes.length > 0 ? Math.max(...bTimes) : 0;

      return bTime - aTime;
    });
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadCases = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCases();
        const normalizedCases = (Array.isArray(data) ? data : []).map(normalizeCaseRecord);
        setCases(sortCasesByRecency(normalizedCases));
      } catch (err) {
        setError(err.message || 'Unable to load cases');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [sortCasesByRecency]);

  useEffect(() => {
    const state = location.state || {};
    if (state.openNewCase) {
      setIsWizardOpen(true);
      setCreateError('');
      setIsCreating(false);
    }

    if (state.editCaseNumber) {
      setPendingEditRequest({
        caseNumber: state.editCaseNumber,
        focusUpload: state.focusUpload || '',
      });
    }

    const shouldCleanState =
      state.openNewCase ||
      state.editCaseNumber ||
      state.focusUpload ||
      (!state.openNewCase &&
        !state.editCaseNumber &&
        !state.focusUpload &&
        state.attemptedCase &&
        Object.keys(state).length > 1);

    if (shouldCleanState) {
      const nextState = state.attemptedCase ? { attemptedCase: state.attemptedCase } : null;
      const currentStateMatchesNext =
        (nextState === null && Object.keys(state).length === 0) ||
        (nextState !== null &&
          Object.keys(state).length === 1 &&
          Object.prototype.hasOwnProperty.call(state, 'attemptedCase') &&
          state.attemptedCase === nextState.attemptedCase);

      if (!currentStateMatchesNext) {
        navigate(location.pathname, { replace: true, state: nextState || undefined });
      }
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!pendingEditRequest || cases.length === 0) {
      return;
    }

    const match = cases.find((caseItem) => caseItem.caseNumber === pendingEditRequest.caseNumber);
    if (!match) {
      setAnalysisError('The requested case could not be found. It may have been removed.');
      setPendingEditRequest(null);
      return;
    }

    setSelectedCaseNumber(match.caseNumber);
    openEditForm(match, pendingEditRequest.focusUpload);
    setPendingEditRequest(null);
  }, [cases, pendingEditRequest]);

  const selectedCase = useMemo(
    () => cases.find((caseItem) => caseItem.caseNumber === selectedCaseNumber) || null,
    [cases, selectedCaseNumber],
  );

  useEffect(() => {
    if (selectedCaseNumber) {
      setAnalysisError('');
    }
  }, [selectedCaseNumber]);

  const availableStatuses = useMemo(() => {
    const discovered = new Set(CASE_STATUS_OPTIONS);
    cases
      .map((item) => item.status)
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .forEach((value) => discovered.add(value));

    const extraStatuses = Array.from(discovered)
      .filter((status) => !CASE_STATUS_OPTIONS.includes(status))
      .sort((a, b) => a.localeCompare(b));

    return [...CASE_STATUS_OPTIONS, ...extraStatuses];
  }, [cases]);

  const availableModules = useMemo(() => {
    const unique = new Set();
    cases.forEach((item) => {
      const value = typeof item.module === 'string' && item.module.trim().length > 0
        ? item.module
        : FALLBACK_MODULE_LABEL;
      unique.add(value);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesSearch = !normalizedSearch
        ? true
        : [
          item.caseName,
          item.caseNumber,
          item.owner,
          item.organization,
          item.examiner,
        ]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) {
        return false;
      }

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(item.status);

      if (!matchesStatus) {
        return false;
      }

      const moduleLabel =
        typeof item.module === 'string' && item.module.trim().length > 0
          ? item.module
          : FALLBACK_MODULE_LABEL;
      const matchesModule =
        moduleFilters.length === 0 || moduleFilters.includes(moduleLabel);;
      return matchesModule;
    });
  }, [cases, searchTerm, statusFilters, moduleFilters]);

  const activeFilterCount = statusFilters.length + moduleFilters.length;

  const toggleStatusFilter = (value) => {
    setStatusFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const toggleModuleFilter = (value) => {
    setModuleFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setModuleFilters([]);
  };

  const openCreateWizard = () => {
    setIsWizardOpen(true);
    setCreateError('');
    setFeedback('');
    setIsCreating(false);
    setUploadFocus('');
  };

  const openEditForm = (caseItem, focus = '') => {
    setEditingCase(caseItem);
    setIsFormOpen(true);
    setFormError('');
    setFeedback('');
    setUploadFocus(focus || '');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCase(null);
    setFormError('');
    setIsSubmitting(false);
    setUploadFocus('');
  };

  const handleCreateCase = async (formValues) => {
    setIsCreating(true);
    setCreateError('');
    try {
      const payload = {
        ...formValues,
        timeline: Array.isArray(formValues.timeline) ? formValues.timeline : [],
        attachments: Array.isArray(formValues.attachments) ? formValues.attachments : [],
      };
      const created = normalizeCaseRecord(await createCase(payload));
      setCases((prev) =>
        sortCasesByRecency([
          created,
          ...prev.filter((item) => item.caseNumber !== created.caseNumber),
        ]),
      );
      setSelectedCaseNumber(created.caseNumber);
      setFeedback('Case created successfully.');
      setIsWizardOpen(false);
      setCreateError('');
    } catch (err) {
      const message = err.message || 'Unable to create case';
      setCreateError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCase = async (formValues) => {
    if (!editingCase) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        ...editingCase,
        ...formValues,
      };
      const updated = normalizeCaseRecord(await updateCase(editingCase.caseNumber, payload));
      if (!updated) {
        throw new Error('Case not found');
      }
      setCases((prev) =>
        sortCasesByRecency(
          prev.map((item) => (item.caseNumber === updated.caseNumber ? updated : item)),
        ),
      );
      setSelectedCaseNumber(updated.caseNumber);
      setFeedback('Case updated successfully.');
      closeForm();
      setUploadFocus('');
    } catch (err) {
      setFormError(err.message || 'Unable to update case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (caseNumber) => {
    if (!window.confirm('Are you sure you want to delete this case?')) {
      return;
    }

    try {
      await deleteCase(caseNumber);
      setCases((prev) =>
        sortCasesByRecency(prev.filter((item) => item.caseNumber !== caseNumber)),
      );
      if (selectedCaseNumber === caseNumber) {
        setSelectedCaseNumber(null);
      }
      setFeedback('Case deleted successfully.');
    } catch (err) {
      setFeedback(err.message || 'Unable to delete case');
    }
  };

  const handleModuleNavigate = async (moduleKey) => {
    if (!selectedCase) {
      setAnalysisError('Select a case before opening an analysis module.');
      return;
    }

    if (moduleCheck) {
      return;
    }

    setAnalysisError('');
    setModuleCheck(moduleKey);

    try {
      const latest = normalizeCaseRecord(await fetchCaseByNumber(selectedCase.caseNumber));

      if (!latest) {
        setAnalysisError('The selected case could not be found. Please refresh and try again.');
        return;
      }

      setCases((prev) => {
        const exists = prev.some((item) => item.caseNumber === latest.caseNumber);
        if (!exists) {
          return prev;
        }

        const next = prev.map((item) => (item.caseNumber === latest.caseNumber ? latest : item));
        return sortCasesByRecency(next);
      });

      setSelectedCaseNumber(latest.caseNumber);

      const evaluation = evaluateModuleReadiness(latest, moduleKey);
      if (!evaluation.ready) {
        setAnalysisError(evaluation.message);
        return;
      }

      navigate(`/cases/${latest.caseNumber}/${moduleKey}`);
    } catch (error) {
      setAnalysisError(error.message || 'Unable to verify case data before opening the module.');
    } finally {
      setModuleCheck('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Cases</h2>
          <p className="text-gray-600">Search, manage, and monitor all recorded investigations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isFilterOpen
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            aria-pressed={isFilterOpen}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              openCreateWizard();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow-md"
            style={{ backgroundColor: '#019348' }}
          >
            <Plus className="w-4 h-4" />
            Add Case
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search cases, analysts, or help"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {isFilterOpen && (
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">Data uploaded</h4>
              {availableModules.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  {availableModules.map((module) => (
                    <label key={module} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={moduleFilters.includes(module)}
                        onChange={() => toggleModuleFilter(module)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {module}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Modules will appear once cases are loaded.</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700">Status</h4>
              {availableStatuses.length > 0 ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {availableStatuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={statusFilters.includes(status)}
                        onChange={() => toggleStatusFilter(status)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Statuses will appear once cases are loaded.</p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear filters
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-2 text-sm rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {activeFilterCount > 0 && !isFilterOpen && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span className="font-semibold text-emerald-900">Active filters:</span>
            {moduleFilters.map((module) => (
              <span
                key={`module-${module}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 shadow-sm"
              >
                Module: {module}
              </span>
            ))}
            {statusFilters.map((status) => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 shadow-sm"
              >
                Status: {status}
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-semibold text-emerald-700 hover:underline"
            >
              Clear
            </button>
          </div>
        )}


        {feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        {analysisError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {analysisError}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading cases…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Case Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Case Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Owner</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem) => {
                  const isSelected = selectedCaseNumber === caseItem.caseNumber;
                  const moduleLabel =
                    typeof caseItem.module === 'string' && caseItem.module.trim().length > 0
                      ? caseItem.module
                      : FALLBACK_MODULE_LABEL;
                  const lastUpdatedDisplay =
                    formatDateString(caseItem.lastUpdated) ||
                    formatDateString(caseItem.updatedAt) ||
                    formatDateString(caseItem.createdAt) ||
                    '—';
                  return (
                    <tr
                      key={caseItem.caseNumber}
                      className={`border-b transition-colors ${isSelected ? 'bg-emerald-50/60 border-emerald-200' : 'hover:bg-gray-50'
                        }`}
                    >
                      <td className="px-4 py-4">
                        <label className="flex items-center justify-center">
                          <input
                            type="radio"
                            name="selectedCase"
                            value={caseItem.caseNumber}
                            checked={isSelected}
                            onChange={() => setSelectedCaseNumber(caseItem.caseNumber)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </label>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{caseItem.caseName}</td>
                      <td className="px-4 py-4 text-sm text-emerald-600 font-semibold">{caseItem.caseNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{moduleLabel}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{lastUpdatedDisplay}</td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[caseItem.status] || 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{caseItem.owner}</td>
                      <td className="px-4 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-500">
                          <button
                            type="button"
                            onClick={() => navigate(`/cases/${caseItem.caseNumber}`)}
                            className="p-2 hover:text-emerald-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(caseItem)}
                            className="p-2 hover:text-emerald-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCase(caseItem.caseNumber)}
                            className="p-2 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                      No cases match your search  or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedCase && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
            <div>
              <p className="text-sm text-emerald-700">Selected</p>
              <p className="text-lg font-semibold text-emerald-900">{selectedCase.caseName}</p>
              <p className="text-sm text-emerald-700/80">{selectedCase.caseNumber}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/cases/${selectedCase.caseNumber}`)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
              >
                View Case Details
              </button>
              <button
                type="button"
                onClick={() => handleModuleNavigate('fdr')}
                disabled={Boolean(moduleCheck)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {moduleCheck === 'fdr' ? 'Checking…' : 'FDR Analysis'}
              </button>
              <button
                type="button"
                onClick={() => handleModuleNavigate('cvr')}
                disabled={Boolean(moduleCheck)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {moduleCheck === 'cvr' ? 'Checking…' : 'CVR Analysis'}
              </button>
              <button
                type="button"
                onClick={() => handleModuleNavigate('correlate')}
                disabled={Boolean(moduleCheck)}
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {moduleCheck === 'correlate' ? 'Checking…' : 'Correlate'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
          <p>
            Showing {filteredCases.length} of {cases.length} cases
          </p>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Pagination coming soon</span>
          </div>
        </div>
      </div>

      <CaseFormModal
        isOpen={isFormOpen}
        mode="edit"
        initialValues={editingCase}
        onClose={closeForm}
        onSubmit={handleUpdateCase}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        initialUploadFocus={uploadFocus}
      />
      <NewCaseWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setCreateError('');
          setIsCreating(false);
        }}
        onSubmit={handleCreateCase}
        isSubmitting={isCreating}
        errorMessage={createError}
      />
    </div>
  );
};

export default Cases;
