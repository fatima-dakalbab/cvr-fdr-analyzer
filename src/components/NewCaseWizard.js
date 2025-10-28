// import React, { useState } from "react";
// import {
//   CheckCircle2, ChevronLeft, ChevronRight, Upload
// } from "lucide-react";

// /* ------------------------- tiny helpers ------------------------- */
// const StepDot = ({ active, done, index }) => (
//   <div className="flex items-center gap-3">
//     <div
//       className={[
//         "w-8 h-8 rounded-full flex items-center justify-center border",
//         done ? "bg-emerald-500 border-emerald-500 text-white"
//              : active ? "bg-emerald-50 border-emerald-500 text-emerald-700"
//              : "bg-gray-100 border-gray-300 text-gray-500"
//       ].join(" ")}
//     >
//       {done ? <CheckCircle2 className="w-5 h-5" /> : index}
//     </div>
//     <span className="text-sm text-gray-600">{`Step ${index}`}</span>
//   </div>
// );

// const Card = ({ title, children }) => (
//   <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
//     <div className="px-6 py-4 border-b border-gray-100">
//       <h3 className="text-gray-700 font-semibold">{title}</h3>
//     </div>
//     <div className="p-6">{children}</div>
//   </div>
// );

// /* ------------------------- main component ------------------------- */
// export default function NewCaseWizard() {
//   const [step, setStep] = useState(1);

//   // form state
//   const [caseInfo, setCaseInfo] = useState({
//     name: "",
//     number: "",
//   });
//   const [investigator, setInvestigator] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     notes: "",
//   });
//   const [aircraft, setAircraft] = useState({
//     number: "",
//     type: "",
//     operator: "",
//     flightNumber: "",
//     date: "",
//   });
//   const [fdrFile, setFdrFile] = useState(null);
//   const [cvrFile, setCvrFile] = useState(null);

//   const totalSteps = 5;
//   const next = () => setStep((s) => Math.min(totalSteps, s + 1));
//   const back = () => setStep((s) => Math.max(1, s - 1));

//   const canNext = () => {
//     if (step === 1) return caseInfo.name && caseInfo.number;
//     if (step === 2) return investigator.name && investigator.email;
//     if (step === 3) return aircraft.number && aircraft.type;
//     if (step === 4) return !!fdrFile;
//     if (step === 5) return !!cvrFile;
//     return false;
//   };

//   const handleSubmit = () => {
//     const payload = {
//       caseInfo,
//       investigator,
//       aircraft,
//       files: {
//         fdr: fdrFile?.name || null,
//         cvr: cvrFile?.name || null,
//       },
//       createdAt: new Date().toISOString(),
//     };
//     console.log("NEW CASE:", payload);
//     setStep(6); // success screen
//   };

//   return (
//     <div className="px-6 py-8">
//       <h1 className="text-2xl font-semibold text-gray-800 mb-6">Start New Case</h1>

//       {/* Steps header */}
//       <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
//         <div className="grid grid-cols-5 gap-4 items-center">
//           {[1,2,3,4,5].map((n) => (
//             <div key={n} className="flex items-center">
//               <StepDot active={step===n} done={step>n} index={n} />
//               {n<5 && (
//                 <div className="flex-1 h-[2px] bg-gradient-to-r from-emerald-500/40 to-gray-200 ml-3" />
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Step cards */}
//       {step === 1 && (
//         <Card title="Case Information">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Case Name</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="Dubai Creek Runway Excursion"
//                 value={caseInfo.name}
//                 onChange={(e)=>setCaseInfo({...caseInfo, name: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Case Number</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="AAI-UAE-2025-001"
//                 value={caseInfo.number}
//                 onChange={(e)=>setCaseInfo({...caseInfo, number: e.target.value})}
//               />
//             </div>
//           </div>
//         </Card>
//       )}

//       {step === 2 && (
//         <Card title="Investigator Information">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Name</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="Capt. Khalid"
//                 value={investigator.name}
//                 onChange={(e)=>setInvestigator({...investigator, name: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Phone</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="971-xx-xxxxxxx"
//                 value={investigator.phone}
//                 onChange={(e)=>setInvestigator({...investigator, phone: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Email</label>
//               <input
//                 type="email"
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="xxxx@gcaa.ae"
//                 value={investigator.email}
//                 onChange={(e)=>setInvestigator({...investigator, email: e.target.value})}
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm text-gray-600 mb-2">Notes</label>
//               <textarea
//                 rows={4}
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="Enter your notes here…"
//                 value={investigator.notes}
//                 onChange={(e)=>setInvestigator({...investigator, notes: e.target.value})}
//               />
//             </div>
//           </div>
//         </Card>
//       )}

//       {step === 3 && (
//         <Card title="Aircraft Information">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Aircraft Number</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="A6-EQC"
//                 value={aircraft.number}
//                 onChange={(e)=>setAircraft({...aircraft, number: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Aircraft Type</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="Airbus A380-861"
//                 value={aircraft.type}
//                 onChange={(e)=>setAircraft({...aircraft, type: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Operator</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="Emirates Airlines"
//                 value={aircraft.operator}
//                 onChange={(e)=>setAircraft({...aircraft, operator: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Flight Number</label>
//               <input
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="EK201"
//                 value={aircraft.flightNumber}
//                 onChange={(e)=>setAircraft({...aircraft, flightNumber: e.target.value})}
//               />
//             </div>
//             <div>
//               <label className="block text-sm text-gray-600 mb-2">Date of Flight</label>
//               <input
//                 type="date"
//                 className="w-full rounded-lg border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
//                 value={aircraft.date}
//                 onChange={(e)=>setAircraft({...aircraft, date: e.target.value})}
//               />
//             </div>
//           </div>
//         </Card>
//       )}

//       {step === 4 && (
//         <Card title="FDR Data Uploading">
//           <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-100/60 h-56 flex flex-col items-center justify-center gap-3">
//             <Upload className="w-10 h-10 text-gray-400" />
//             <div className="text-gray-500">Excel/CSV — drag & drop here</div>
//             <label className="inline-flex">
//               <input
//                 type="file"
//                 accept=".csv,.xlsx"
//                 className="hidden"
//                 onChange={(e)=>setFdrFile(e.target.files?.[0] || null)}
//               />
//               <span className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer">
//                 Choose file
//               </span>
//             </label>
//             {fdrFile && <div className="text-sm text-gray-600">Selected: {fdrFile.name}</div>}
//           </div>
//         </Card>
//       )}

//       {step === 5 && (
//         <Card title="CVR Data Uploading">
//           <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-100/60 h-56 flex flex-col items-center justify-center gap-3">
//             <Upload className="w-10 h-10 text-gray-400" />
//             <div className="text-gray-500">WAV/MP3 — drag & drop here</div>
//             <label className="inline-flex">
//               <input
//                 type="file"
//                 accept=".wav,.mp3"
//                 className="hidden"
//                 onChange={(e)=>setCvrFile(e.target.files?.[0] || null)}
//               />
//               <span className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer">
//                 Choose file
//               </span>
//             </label>
//             {cvrFile && <div className="text-sm text-gray-600">Selected: {cvrFile.name}</div>}
//           </div>

//           <div className="mt-6">
//             <button
//               onClick={handleSubmit}
//               className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
//               disabled={!cvrFile}
//             >
//               Start New Case
//             </button>
//           </div>
//         </Card>
//       )}

//       {step === 6 && (
//         <Card title="Case Created">
//           <div className="flex flex-col items-center py-10">
//             <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
//               <CheckCircle2 className="w-16 h-16 text-emerald-600" />
//             </div>
//             <h3 className="text-xl font-semibold mb-2">Upload complete</h3>
//             <p className="text-gray-600 mb-6">Thank you for uploading, view cases to start analysis.</p>
//             <button className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
//               View Cases
//             </button>
//           </div>
//         </Card>
//       )}

//       {/* footer controls */}
//       {step <= 5 && (
//         <div className="mt-6 flex items-center gap-3">
//           <button
//             onClick={back}
//             className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
//             disabled={step === 1}
//           >
//             <ChevronLeft className="inline w-4 h-4 mr-1" />
//             Back
//           </button>

//           <div className="flex-1" />

//           <div className="flex items-center gap-2">
//             {[1,2,3,4,5].map((n)=>(
//               <button
//                 key={n}
//                 onClick={()=>setStep(n)}
//                 className={[
//                   "w-8 h-8 rounded-md border text-sm",
//                   step===n ? "bg-emerald-600 text-white border-emerald-600"
//                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
//                 ].join(" ")}
//               >
//                 {n}
//               </button>
//             ))}
//           </div>

//           <button
//             onClick={next}
//             disabled={!canNext()}
//             className="ml-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40"
//           >
//             Next <ChevronRight className="inline w-4 h-4 ml-1" />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }



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
        helperText="Supported formats: .wav, .mp3, .txt"
        accept=".wav,.mp3,.txt"
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