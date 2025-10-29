# CVR/FDR Analyzer

A single-page React application for aviation investigators to review cockpit voice recorder (CVR) and flight data recorder (FDR) cases. The dashboard surfaces high-level activity, provides quick entry points to case work, and links to focused tooling for timeline review, audio playback, correlation, and reporting.

## Features

- **Investigator dashboard** – Visualizes monthly incident/accident trends, maps case locations, and highlights recently accessed cases for quick follow-up.
- **Case workspace** – Navigate through pending investigations, drill into case details, and jump directly to CVR, FDR, correlation, and reporting tools.
- **Data correlation tools** – Dedicated views for pairing CVR transcripts with FDR parameters and producing shareable reports.
- **Responsive layout** – Built with Tailwind CSS and Lucide icons for a polished experience on desktop and tablet form factors.

## Prerequisites

Before installing the JavaScript dependencies ensure that you have the following software available locally:

- **Node.js** 18.0.0 or later (Node 20.x LTS recommended)
- **npm** 9.x or later (ships with Node.js)

You can verify your toolchain with:

```bash
node --version
npm --version
```

## One-time setup

Install the project dependencies by running the helper script provided in this repository:

```bash
./install-requirements.sh
```

The script verifies that Node.js and npm are available before running `npm install` to pull in the dependencies listed in `package.json`.

> **Note**: If you prefer to install dependencies manually, you can run `npm install` in the project root.

## Running the application

Start the development server and open the site in your browser:

```bash
npm start
```

The app is served at [http://localhost:3000](http://localhost:3000). The development server watches for file changes and hot-reloads the browser automatically.

## Building for production

Create an optimized production bundle in the `build/` directory:

```bash
npm run build
```

The output bundle is tree-shaken, minified, and ready to be deployed to your hosting platform of choice.

## Testing

Run the Create React App test runner in watch mode:

```bash
npm test
```

## Project structure

```
├── public/                # Static assets served as-is by CRA
├── src/
│   ├── components/        # Shared React components (e.g., map visualizations)
│   ├── data/              # Mock datasets used to populate dashboards
│   ├── pages/             # Feature-specific screens (dashboard, CVR, FDR, etc.)
│   ├── App.js             # Main application shell and navigation
│   └── index.js           # React entry point
├── install-requirements.sh# Dependency installation helper script
├── package.json           # npm metadata and dependency list
└── README.md              # Project documentation (this file)
```

## Available scripts

| Command | Description |
| ------- | ----------- |
| `npm start` | Runs the app in development mode with hot reload. |
| `npm test` | Launches the unit test runner in watch mode. |
| `npm run build` | Generates a production-optimized build. |
| `npm run eject` | Copies CRA configuration locally (irreversible). |

## Troubleshooting

- **Port already in use**: The CRA dev server defaults to port 3000. Set `PORT=3001` (or another free port) before running `npm start` to use a different port.
- **Dependency issues**: Delete the `node_modules/` directory and rerun `./install-requirements.sh`.
- **Unsupported Node.js version**: Upgrade to the latest Active LTS release of Node.js.

## License

This project is the intellectual property of the Aviation Center of Excellence (ACoE), developed in collaboration with the General Civil Aviation Authority (GCAA) and the University of Sharjah.

All rights are reserved. This repository is private and not open to the public.
Redistribution, reproduction, or use of the code—whether in whole or in part—is strictly prohibited without prior written permission from the project maintainers or the affiliated institutions.
