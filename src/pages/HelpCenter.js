import React from 'react';
import {
  HelpCircle,
  ClipboardList,
  CloudUpload,
  Database,
  Users,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';

const HelpCenter = () => {
  const faqs = [
    {
      question: 'How do I upload new CVR/FDR data?',
      answer:
        'Navigate to the "Cases" area and choose "Start New Case". You can then upload your flight data files directly from your workstation or the secure recorder.',
    },
    {
      question: 'Can I collaborate with other investigators?',
      answer:
        'Yes. Open the case details and invite team members under "Collaborators". Each investigator will receive an in-app notification and email with next steps.',
    },
    {
      question: 'Where can I find historical reports?',
      answer:
        'Select "Generate Reports" from the left navigation. You can filter by case number, aircraft type, or accident date to access historical documentation.',
    },
  ];

  const gettingStartedSteps = [
    {
      title: 'Confirm investigation details',
      description:
        'Capture the occurrence date, aircraft registration, and recorder serial numbers before starting a new case to maintain traceability.',
      icon: ClipboardList,
    },
    {
      title: 'Ingest CVR/FDR datasets',
      description:
        'Upload recorder files through Start New Case. The ingestion pipeline validates integrity and decodes common formats automatically.',
      icon: CloudUpload,
    },
    {
      title: 'Structure timelines and metadata',
      description:
        'Add investigative notes, crew rosters, and event timelines in Case Details so collaborators have the latest context.',
      icon: Database,
    },
    {
      title: 'Invite collaborating investigators',
      description:
        'Share the case with accredited colleagues and tailor module access so each specialist sees the right combination of tools.',
      icon: Users,
    },
    {
      title: 'Correlate audio and flight parameters',
      description:
        'Use the Correlate view to synchronise transcript excerpts with key flight data points and flag segments requiring deeper review.',
      icon: CheckCircle2,
    },
  ];

  const supportChannels = [
    {
      title: 'Email Support',
      value: 'acoe@sharjah.ac.ae',
      icon: Mail,
      note: 'Response within 12 business hours',
    },
    {
      title: 'Operations Hotline',
      value: '+971 2 123 4567',
      icon: Phone,
      note: 'Available 24/7 for critical incidents',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
          <HelpCircle className="w-4 h-4" />
          Help Center
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">How can we help you today?</h1>
        <p className="mt-3 text-gray-600 max-w-3xl">
          Follow the guided workflow below to launch new investigations, then explore FAQs or reach out through our support channels.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {gettingStartedSteps.map(({ title, description, icon: Icon }) => (
            <div key={title} className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              </div>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-6">
            {faqs.map(({ question, answer }) => (
              <div key={question} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-800">{question}</h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Support Channels</h2>
          <div className="mt-4 space-y-4">
            {supportChannels.map(({ title, value, icon: Icon, note }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-emerald-900">Need immediate assistance?</h2>
        <p className="mt-2 text-emerald-800 max-w-2xl text-sm">
          Reach out through the support channels above with your case number and investigation summary so our operations desk can route you quickly.
        </p>
      </div>
    </div>
  );
};

export default HelpCenter