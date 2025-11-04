import React, { useEffect, useMemo, useState } from 'react';
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
  createCase,
  updateCase,
  deleteCase,
} from '../api/cases';
import { evaluateModuleReadiness } from '../utils/analysisAvailability';

const statusStyles = {
  Complete: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Pending Review': 'bg-sky-100 text-sky-700',
  'Data Required': 'bg-rose-100 text-rose-700',
  'Not Started': 'bg-gray-100 text-gray-600',
  'Analysis Not Started': 'bg-gray-100 text-gray-700',
  'Data Incomplete': 'bg-rose-100 text-rose-700',
  'Ready for Analysis': 'bg-sky-100 text-sky-700',
  'Data Not Uploaded': 'bg-gray-100 text-gray-600',
  Blocked: 'bg-rose-100 text-rose-700',
  Paused: 'bg-amber-100 text-amber-700',
  'FDR Analyzed': 'bg-emerald-100 text-emerald-700',
  'CVR Analyzed': 'bg-emerald-100 text-emerald-700',
  'Correlation Analyzed': 'bg-emerald-100 text-emerald-700',
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadCases = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCases();
        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load cases');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  useEffect(() => {
    if (location.state?.openNewCase) {
      setIsWizardOpen(true);
      setCreateError('');
      setIsCreating(false);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const selectedCase = useMemo(
    () => cases.find((caseItem) => caseItem.caseNumber === selectedCaseNumber) || null,
    [cases, selectedCaseNumber],
  );

  useEffect(() => {
    if (selectedCaseNumber) {
      setAnalysisError('');
    }
  }, [selectedCaseNumber]);

  const filteredCases = useMemo(() => {
    if (!searchTerm) {
      return cases;
    }

    const value = searchTerm.toLowerCase();
    return cases.filter((item) =>
      [
        item.caseName,
        item.caseNumber,
        item.owner,
        item.organization,
        item.examiner,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value)),
    );
  }, [cases, searchTerm]);

  const openCreateWizard = () => {
    setIsWizardOpen(true);
    setCreateError('');
    setFeedback('');
    setIsCreating(false);
  };

  const openEditForm = (caseItem) => {
    setEditingCase(caseItem);
    setIsFormOpen(true);
    setFormError('');
    setFeedback('');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCase(null);
    setFormError('');
    setIsSubmitting(false);
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
      const created = await createCase(payload);
      setCases((prev) => [created, ...prev.filter((item) => item.caseNumber !== created.caseNumber)]);
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
      const updated = await updateCase(editingCase.caseNumber, payload);
      if (!updated) {
        throw new Error('Case not found');
      }
      setCases((prev) =>
        prev.map((item) => (item.caseNumber === updated.caseNumber ? updated : item)),
      );
      setSelectedCaseNumber(updated.caseNumber);
      setFeedback('Case updated successfully.');
      closeForm();
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
      setCases((prev) => prev.filter((item) => item.caseNumber !== caseNumber));
      if (selectedCaseNumber === caseNumber) {
        setSelectedCaseNumber(null);
      }
      setFeedback('Case deleted successfully.');
    } catch (err) {
      setFeedback(err.message || 'Unable to delete case');
    }
  };

const handleModuleNavigate = (moduleKey) => {
    if (!selectedCase) {
      setAnalysisError('Select a case before opening an analysis module.');
      return;
    }

    const evaluation = evaluateModuleReadiness(selectedCase, moduleKey);
    if (!evaluation.ready) {
      setAnalysisError(evaluation.message);
      return;
    }

    setAnalysisError('');
    navigate(`/cases/${selectedCase.caseNumber}/${moduleKey}`);
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            disabled
            title="Filter functionality coming soon"
          >
            <Filter className="w-4 h-4" />
            Filters
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

                  return (
                    <tr
                      key={caseItem.caseNumber}
                      className={`border-b transition-colors ${
                        isSelected ? 'bg-emerald-50/60 border-emerald-200' : 'hover:bg-gray-50'
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
                      <td className="px-4 py-4 text-sm text-gray-700">{caseItem.module}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{caseItem.lastUpdated || '—'}</td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusStyles[caseItem.status] || 'bg-gray-100 text-gray-600'
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
                      No cases match your search.
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
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
              >
                FDR Analysis
              </button>
              <button
                type="button"
                onClick={() => handleModuleNavigate('cvr')}
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
              >
                CVR Analysis
              </button>
              <button
                type="button"
                onClick={() => handleModuleNavigate('correlate')}
                className="w-full sm:w-auto px-5 py-2 rounded-lg border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-500/10"
              >
                Correlate
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
