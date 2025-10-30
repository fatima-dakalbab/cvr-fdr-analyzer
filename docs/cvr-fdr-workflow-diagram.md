# CVR/FDR Analysis Workflow Overview

## Viewing this document

This Markdown file includes an embedded Mermaid sequence diagram. You can open it in any Markdown viewer—GitHub, VS Code, JetBrains IDEs, and most browsers with Markdown extensions all render the diagram automatically. If you prefer a standalone asset for sharing, use the Mermaid CLI to export the diagram:

```bash
npx -y @mermaid-js/mermaid-cli -i docs/cvr-fdr-workflow-diagram.md -o docs/cvr-fdr-workflow.png
```

The command above generates a `docs/cvr-fdr-workflow.png` snapshot that you can distribute to your team or embed in presentations. Adjust the output filename or format (for example, `-o docs/cvr-fdr-workflow.pdf`) as needed.

The diagram below illustrates how the React front end, FastAPI backend, task workers, and storage layers collaborate to process Cockpit Voice Recorder (CVR) and Flight Data Recorder (FDR) submissions.

```mermaid
sequenceDiagram
    autonumber
    participant FE as React Front End
    participant API as FastAPI Backend
    participant Store as Object Storage (S3/Blob)
    participant Queue as Task Queue (Celery/Redis)
    participant Worker as AI Worker
    participant DB as PostgreSQL

    FE->>API: Upload metadata / request presigned URL
    alt Direct browser upload
        API-->>FE: Return presigned upload URL
        FE->>Store: Upload CVR/FDR files via presigned URL
    else Proxy through API
        FE->>API: Stream CVR/FDR files
        API->>Store: Persist raw files
    end

    API->>DB: Record case metadata + storage key
    API->>Queue: Enqueue analysis task (job ID)
    API-->>FE: Respond with job ID / status endpoint

    Worker->>Store: Fetch raw CVR/FDR assets
    Worker->>Worker: Run AI analysis (STT, anomaly detection)
    Worker->>DB: Persist transcripts, metrics, status
    Worker-->>Queue: Update job status (completed/failed)

    FE->>API: Poll job status / subscribe via WebSocket
    API->>DB: Retrieve structured results
    API-->>FE: Return analysis summaries & URLs
    FE->>Store: Stream audio or download CSV via signed URL
```

## Key Interaction Notes

- **Presigned uploads** minimize backend load by letting the browser upload directly to object storage while keeping control via short-lived credentials.
- **Asynchronous task execution** ensures long-running AI jobs do not block API responsiveness.
- **PostgreSQL** stores metadata, job tracking, transcripts, anomaly flags, and signed URL references—never the large binaries themselves.
- **Object storage** handles large CVR/FDR files with lifecycle policies for archival and cost control.
- **Real-time updates** can use polling or WebSockets from the front end to surface progress and results as they land.

This flow keeps the system modular, scalable, and aligned with the existing React SPA architecture.
