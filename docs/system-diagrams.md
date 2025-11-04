# System Diagrams

This document captures two high-level views of the CVR/FDR Analyzer platform: the relational data schema used by the backend service and the runtime interactions between major system modules.

## Data Schema

```mermaid
erDiagram
    USERS {
        SERIAL id PK "Primary key"
        TEXT email "Unique email login"
        TEXT password_hash "BCrypt hash"
        TEXT first_name
        TEXT last_name
        TEXT organization
        TEXT job_title
        TEXT phone
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    CASES {
        SERIAL id PK "Primary key"
        TEXT case_number "Unique case identifier"
        TEXT case_name
        TEXT module "Module label (e.g., CVR & FDR)"
        TEXT status
        TEXT owner
        TEXT organization
        TEXT examiner
        TEXT aircraft_type
        TEXT location
        TEXT summary
        DATE last_updated
        DATE occurrence_date
        TEXT[] tags
        JSONB analyses "Structured analysis artifacts"
        JSONB timeline "Chronological events"
        JSONB attachments "Associated files"
        JSONB investigator "Investigator metadata"
        JSONB aircraft "Aircraft metadata"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    USERS ||..|| CASES : "loosely linked via owner metadata"
```

## System Module Interaction

```mermaid
flowchart LR
    subgraph Frontend [React Frontend]
        UI[Pages & Components\n(src/pages, src/components)]
        Hooks[Custom Hooks\n(src/hooks)]
        APIClient[API Client\n(src/api)]
        UtilsFE[Utilities\n(src/utils)]
    end

    subgraph Backend [Express API Server]
        Routes[routes/*\nRequest routers]
        Middleware[middleware/*\nAuth & error handling]
        Services[services/*\nBusiness logic]
        UtilsBE[utils/*\nToken, validation, mapping]
        DBLayer[db/pool.js\nDatabase access]
    end

    subgraph Database [PostgreSQL]
        CasesTable[(cases table)]
        UsersTable[(users table)]
    end

    UI --> Hooks
    Hooks --> APIClient
    APIClient -->|HTTP/JSON| Routes
    Routes --> Middleware
    Middleware --> Services
    Services --> UtilsBE
    Services --> DBLayer
    DBLayer -->|SQL queries| CasesTable
    DBLayer -->|SQL queries| UsersTable

    UtilsFE -.-> UI
    UtilsBE -.-> Middleware

    APIClient <-->|Auth tokens| Middleware
```

The first diagram reflects the structure defined in [`server/db/schema.sql`](../server/db/schema.sql). The second diagram summarizes how React UI layers invoke the API client, which communicates with Express routes; those routes funnel requests through middleware into service modules that interact with shared utilities and the PostgreSQL tables via the database layer.