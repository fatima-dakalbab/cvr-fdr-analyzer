export const cases = [
  {
    caseNumber: 'AAI-UAE-2025-001',
    caseName: 'Dubai Creek Runway Excursion',
    module: 'CVR & FDR',
    lastUpdated: '2025-06-03',
    status: 'Complete',
    owner: 'Eng. Ahmed Al Mansoori',
    date: '2025-02-11',
    organization: 'GCAA',
    examiner: 'Eng. Ahmed',
    aircraftType: 'Boeing 737-800',
    location: 'Dubai Creek',
    summary:
      'Aircraft deviated from runway centerline during landing under crosswind conditions resulting in a runway excursion.',
    tags: ['Runway excursion', 'Crosswind', 'Flight data recorded'],
    analyses: {
      fdr: {
        status: 'Complete',
        lastRun: '2025-06-02 14:35',
        summary: 'Parameters confirmed directional control issues with inconsistent rudder inputs during flare.',
      },
      cvr: {
        status: 'In Progress',
        lastRun: '2025-06-01 09:20',
        summary: 'Transcript review underway with focus on crew callouts during approach.',
      },
      correlate: {
        status: 'Not Started',
        lastRun: null,
        summary: 'Correlation pending completion of CVR review.',
      },
    },
    timeline: [
      { date: '2025-02-11', title: 'Initial occurrence reported', type: 'update' },
      { date: '2025-02-13', title: 'FDR data uploaded by operator', type: 'upload' },
      { date: '2025-05-31', title: 'Preliminary analysis review completed', type: 'milestone' },
      { date: '2025-06-03', title: 'FDR analysis finalized', type: 'milestone' },
    ],
    attachments: [
      { name: 'FDR_raw_data.dat', size: '128 MB', type: 'FDR', uploadedBy: 'Eng. Ahmed' },
      { name: 'Runway-excursion-report.pdf', size: '2.4 MB', type: 'Report', uploadedBy: 'QA team' },
    ],
  },
  {
    caseNumber: 'AAI-UAE-2025-004',
    caseName: 'Sharjah Desert UAV Incident',
    module: 'FDR',
    lastUpdated: '2025-05-28',
    status: 'In Progress',
    owner: 'Dr. Hessa Al Suwaidi',
    date: '2025-03-06',
    organization: 'GCAA',
    examiner: 'Dr. Hessa',
    aircraftType: 'Fixed-wing UAV',
    location: 'Sharjah Desert',
    summary:
      'Unmanned aerial vehicle experienced control loss shortly after takeoff during desert surveillance mission.',
    tags: ['UAV', 'Control loss', 'Autopilot'],
    analyses: {
      fdr: {
        status: 'In Progress',
        lastRun: '2025-05-27 16:10',
        summary: 'Investigating autopilot pitch oscillations and battery temperature spikes.',
      },
      cvr: {
        status: 'Not Applicable',
        lastRun: null,
        summary: 'CVR not available for unmanned platform.',
      },
      correlate: {
        status: 'Blocked',
        lastRun: null,
        summary: 'Awaiting completion of FDR analysis for correlation.',
      },
    },
    timeline: [
      { date: '2025-03-06', title: 'Incident notification received', type: 'update' },
      { date: '2025-03-08', title: 'Operator uploaded telemetry data', type: 'upload' },
      { date: '2025-04-15', title: 'Hardware inspection scheduled', type: 'milestone' },
    ],
    attachments: [
      { name: 'UAV_telemetry.bin', size: '64 MB', type: 'Telemetry', uploadedBy: 'Operator' },
      { name: 'Flight-plan.kml', size: '120 KB', type: 'Planning', uploadedBy: 'Operator' },
    ],
  },
  {
    caseNumber: 'AAI-UAE-2025-009',
    caseName: 'Abu Dhabi Mid-Air Near Miss',
    module: 'CVR',
    lastUpdated: '2025-05-16',
    status: 'Pending Review',
    owner: 'Capt. Khalid Al Hameli',
    date: '2025-05-14',
    organization: 'Etihad Airways',
    examiner: 'Capt. Khalid',
    aircraftType: 'Airbus A321',
    location: 'Abu Dhabi FIR',
    summary:
      'Near miss between commercial flight and private aircraft within Abu Dhabi FIR during climb phase.',
    tags: ['Near miss', 'ATC communication', 'Crew resource management'],
    analyses: {
      fdr: {
        status: 'Not Started',
        lastRun: null,
        summary: 'Awaiting radar replay from ATC.',
      },
      cvr: {
        status: 'Pending Review',
        lastRun: '2025-05-12 11:45',
        summary: 'Transcript draft prepared, pending supervisory approval.',
      },
      correlate: {
        status: 'Not Started',
        lastRun: null,
        summary: 'Correlation to commence once CVR transcript is approved.',
      },
    },
    timeline: [
      { date: '2025-05-14', title: 'Occurrence reported by crew', type: 'update' },
      { date: '2025-05-15', title: 'CVR audio uploaded', type: 'upload' },
      { date: '2025-05-20', title: 'ATC coordination initiated', type: 'milestone' },
    ],
    attachments: [
      { name: 'CVR_audio.wav', size: '45 MB', type: 'Audio', uploadedBy: 'Capt. Khalid' },
      { name: 'Initial_report.docx', size: '320 KB', type: 'Report', uploadedBy: 'Safety officer' },
    ],
  },
  {
    caseNumber: 'AAI-UAE-2025-013',
    caseName: 'Al Ain Night Landing Deviation',
    module: 'CVR & FDR',
    lastUpdated: '2025-05-09',
    status: 'Data Required',
    owner: 'Salem Al Marri',
    date: '2025-04-28',
    organization: 'Private Operator',
    examiner: 'Salem Al Marri',
    aircraftType: 'Cessna Citation CJ4',
    location: 'Al Ain International Airport',
    summary:
      'Business jet deviated from glide path during night approach requiring go-around.',
    tags: ['Glide path', 'Night operations', 'Pilot training'],
    analyses: {
      fdr: {
        status: 'Data Required',
        lastRun: null,
        summary: 'Awaiting complete FDR dataset from operator.',
      },
      cvr: {
        status: 'Not Started',
        lastRun: null,
        summary: 'CVR data not yet submitted.',
      },
      correlate: {
        status: 'Blocked',
        lastRun: null,
        summary: 'Correlation requires both CVR and FDR datasets.',
      },
    },
    timeline: [
      { date: '2025-04-28', title: 'Go-around event logged', type: 'update' },
      { date: '2025-05-02', title: 'Data request issued to operator', type: 'update' },
      { date: '2025-05-09', title: 'Partial FDR data received', type: 'upload' },
    ],
    attachments: [
      { name: 'ATC_recording.mp3', size: '18 MB', type: 'Audio', uploadedBy: 'ATC' },
    ],
  },
  {
    caseNumber: 'AAI-UAE-2025-017',
    caseName: 'Ras Al Khaimah Rotorcraft Incident',
    module: 'FDR',
    lastUpdated: '2025-04-28',
    status: 'Complete',
    owner: 'Mariam Al Zarouni',
    date: '2025-04-28',
    organization: 'Ras Al Khaimah Police',
    examiner: 'Mariam Al Zarouni',
    aircraftType: 'AW139 Helicopter',
    location: 'Ras Al Khaimah',
    summary:
      'Police helicopter reported vibration warning leading to precautionary landing in mountainous terrain.',
    tags: ['Rotorcraft', 'Vibration', 'Maintenance'],
    analyses: {
      fdr: {
        status: 'Complete',
        lastRun: '2025-04-26 08:30',
        summary: 'Engine torque fluctuations traced to gearbox sensor anomaly.',
      },
      cvr: {
        status: 'Not Applicable',
        lastRun: null,
        summary: 'Helicopter not equipped with CVR.',
      },
      correlate: {
        status: 'Not Started',
        lastRun: null,
        summary: 'Correlation optional for this case.',
      },
    },
    timeline: [
      { date: '2025-04-18', title: 'Occurrence notification logged', type: 'update' },
      { date: '2025-04-21', title: 'On-site inspection completed', type: 'milestone' },
      { date: '2025-04-25', title: 'FDR data processed', type: 'milestone' },
    ],
    attachments: [
      { name: 'Maintenance_log.pdf', size: '1.1 MB', type: 'Maintenance', uploadedBy: 'Operator' },
      { name: 'Sensor_data.csv', size: '4.6 MB', type: 'Data', uploadedBy: 'Analysis team' },
    ],
  },
];

export const getCaseByNumber = (caseNumber) => cases.find((caseItem) => caseItem.caseNumber === caseNumber) || null;