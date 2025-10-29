import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, UploadCloud } from 'lucide-react';

const steps = [
  { title: 'Step 1', subtitle: 'Investigator' },
  { title: 'Step 2', subtitle: 'Aircraft' },
  { title: 'Step 3', subtitle: 'FDR Upload' },
  { title: 'Step 4', subtitle: 'CVR Upload' },
  { title: 'Step 5', subtitle: 'Complete' },
];

const initialInvestigator = {
  name: '',
  phone: '',
  email: '',
  notes: '',
};

const initialAircraft = {
  aircraftNumber: '',
  aircraftType: '',
  operator: '',
  flightNumber: '',
  dateOfFlight: '',
};

const StepIndicator = ({ currentStep }) => (
  <ol className="grid grid-cols-5 gap-4 mb-10">
    {steps.map((step, index) => {
      const status =
        index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming';

      return (
        <li key={step.title} className="flex flex-col items-center">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
              status === 'complete'
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : status === 'current'
                ? 'border-emerald-500 text-emerald-600 bg-white'
                : 'border-gray-300 text-gray-400 bg-white'
            }`}
          >
            {status === 'complete' ? <Check className="w-6 h-6" /> : index + 1}
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {step.title}
            </p>
            <p className="text-sm font-medium text-gray-700">{step.subtitle}</p>
          </div>
        </li>
      );
    })}
  </ol>
);

const TextField = ({ id, label, type = 'text', value, onChange, placeholder }) => (
  <label className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
    {label}
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  </label>
);

const FileUploadField = ({ id, label, helperText, accept, onChange, fileName }) => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-gray-700">{label}</p>
    <label
      htmlFor={id}
      className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl py-12 bg-gray-50 hover:border-emerald-500 hover:bg-white transition-colors cursor-pointer"
    >
      <UploadCloud className="w-12 h-12 text-emerald-500 mb-3" />
      <p className="text-base font-semibold text-gray-700">
        {fileName ? fileName : 'Drag and drop files here'}
      </p>
      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="hidden"
      />
    </label>
    {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>
);

const ActionButtons = ({ currentStep, onBack, onNext }) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  if (isLastStep) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-10">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep}
        className={`px-5 py-3 rounded-lg border font-medium transition-colors ${
          isFirstStep
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        className="px-6 py-3 rounded-lg font-semibold text-white shadow-md"
        style={{ backgroundColor: '#019348' }}
      >
        {currentStep === steps.length - 2 ? 'Finish' : 'Next Step'}
      </button>
    </div>
  );
};

const NewCaseWizard = ({ onComplete = () => {} }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [investigator, setInvestigator] = useState(initialInvestigator);
  const [aircraft, setAircraft] = useState(initialAircraft);
  const [fdrFile, setFdrFile] = useState(null);
  const [cvrFile, setCvrFile] = useState(null);

  const isCompletionStep = currentStep === steps.length - 1;

  const handleNext = () => {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const investigatorFields = useMemo(
    () => [
      {
        id: 'investigator-name',
        label: 'Name',
        value: investigator.name,
        onChange: (value) => setInvestigator((prev) => ({ ...prev, name: value })),
        placeholder: 'Capt. Khalid',
      },
      {
        id: 'investigator-phone',
        label: 'Phone',
        value: investigator.phone,
        onChange: (value) => setInvestigator((prev) => ({ ...prev, phone: value })),
        placeholder: '+971-50-123-4567',
      },
      {
        id: 'investigator-email',
        label: 'Email',
        type: 'email',
        value: investigator.email,
        onChange: (value) => setInvestigator((prev) => ({ ...prev, email: value })),
        placeholder: 'investigator@gcaa.gov',
      },
    ],
    [investigator],
  );

  const aircraftFields = useMemo(
    () => [
      {
        id: 'aircraft-number',
        label: 'Aircraft Number',
        value: aircraft.aircraftNumber,
        onChange: (value) => setAircraft((prev) => ({ ...prev, aircraftNumber: value })),
        placeholder: 'A6-ADQ',
      },
      {
        id: 'aircraft-type',
        label: 'Aircraft Type',
        value: aircraft.aircraftType,
        onChange: (value) => setAircraft((prev) => ({ ...prev, aircraftType: value })),
        placeholder: 'Airbus A320',
      },
      {
        id: 'aircraft-operator',
        label: 'Operator',
        value: aircraft.operator,
        onChange: (value) => setAircraft((prev) => ({ ...prev, operator: value })),
        placeholder: 'Emirates Airlines',
      },
      {
        id: 'flight-number',
        label: 'Flight Number',
        value: aircraft.flightNumber,
        onChange: (value) => setAircraft((prev) => ({ ...prev, flightNumber: value })),
        placeholder: 'EK204',
      },
      {
        id: 'date-of-flight',
        label: 'Date of Flight',
        type: 'date',
        value: aircraft.dateOfFlight,
        onChange: (value) => setAircraft((prev) => ({ ...prev, dateOfFlight: value })),
      },
    ],
    [aircraft],
  );

  const renderInvestigatorStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Investigator Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {investigatorFields.map((field) => (
          <TextField key={field.id} {...field} />
        ))}
      </div>
      <label className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
        Notes
        <textarea
          value={investigator.notes}
          onChange={(event) =>
            setInvestigator((prev) => ({ ...prev, notes: event.target.value }))
          }
          rows={4}
          className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Additional context for the investigation"
        />
      </label>
    </div>
  );

  const renderAircraftStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Aircraft Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aircraftFields.map((field) => (
          <TextField key={field.id} {...field} />
        ))}
      </div>
    </div>
  );

  const renderFdrStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">FDR Data Uploading</h3>
      <FileUploadField
        id="fdr-upload"
        label="Upload the processed FDR CSV"
        helperText="Supported formats: .csv, .xls"
        accept=".csv,.xls,.xlsx"
        fileName={fdrFile?.name}
        onChange={setFdrFile}
      />
    </div>
  );

  const renderCvrStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">CVR Data Uploading</h3>
      <FileUploadField
        id="cvr-upload"
        label="Upload the CVR audio or transcript"
        helperText="Supported formats: .wav, .mp3"
        accept=".wav,.mp3"
        fileName={cvrFile?.name}
        onChange={setCvrFile}
      />
    </div>
  );

  const renderCompletionStep = () => (
    <div className="flex flex-col items-center text-center space-y-4 py-10">
      <CheckCircle2 className="w-20 h-20 text-emerald-500" />
      <h3 className="text-2xl font-semibold text-gray-800">All set!</h3>
      <p className="text-gray-600 max-w-xl">
        Thank you for uploading the case data. You can now review the summary and findings in
        the cases workspace.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="px-6 py-3 rounded-lg font-semibold text-white shadow-md"
        style={{ backgroundColor: '#019348' }}
      >
        View Cases
      </button>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderInvestigatorStep();
      case 1:
        return renderAircraftStep();
      case 2:
        return renderFdrStep();
      case 3:
        return renderCvrStep();
      default:
        return renderCompletionStep();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Start New Case</h2>
        <p className="text-gray-600">
          Follow the guided steps to provide investigation details and upload CVR/FDR data.
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {renderStepContent()}

      {!isCompletionStep && (
        <ActionButtons currentStep={currentStep} onBack={handleBack} onNext={handleNext} />
      )}
    </div>
  );
};

export default NewCaseWizard;