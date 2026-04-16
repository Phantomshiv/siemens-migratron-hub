# OSES Migration Dashboard

A comprehensive program management dashboard for the **ONE Software Engineering System (OSES)** initiative at Siemens, tracking the enterprise-wide migration to GitHub Enterprise and a unified engineering platform.

## What It Does

This dashboard consolidates data from multiple sources into a single command center for program leadership:

- **📊 Overview** — Live KPI cards with snapshot-based progress tracking (deltas vs. previous period)
- **💰 Budget** — FY26 financials: actuals vs. forecast by module, org, cost type, and contractor. Supports CSV upload for budget data.
- **🔧 GitHub Enterprise** — Org stats (members, repos, teams), Copilot adoption, PR activity, and audit logs pulled from the GitHub API
- **📋 Jira Delivery** — Active sprint progress, epic breakdown, blocker tracking, and status distribution via Jira Cloud API
- **☁️ Cloud FinOps** — Cloud spend by vendor, daily cost trends, and resource optimization insights via Cloudability (IBM/Apptio)
- **🔒 Cybersecurity** — GitHub Advanced Security alerts (code scanning, Dependabot, secret scanning), risk scores, MTTR, and SLA tracking
- **📚 Backstage / OSES Portal** — Software catalog health, component types, lifecycle stages, and adoption metrics from the internal developer portal
- **👥 People** — Org chart, FTE breakdown by country, internal vs. external headcount
- **🗺️ Roadmap** — Quarterly roadmap items with release tracking and capability mapping
- **🏢 Client Management** — GHE migration tracker: clients by business unit, migration stage, origin SCM, repo/developer counts
- **🏗️ Architecture** — RFC/ADR standards register with status tracking
- **📈 Snapshot AI** — AI-generated weekly/monthly program digests with executive summaries, trend analysis, and metric deltas

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Lovable Cloud (Supabase) — Edge Functions, PostgreSQL, file storage
- **Integrations:** GitHub Enterprise API, Jira Cloud API, Cloudability API, Backstage API
- **AI:** Lovable AI Gateway (Gemini / GPT) for the chatbot and snapshot digest generation

## Key Features

- **Live Data:** All dashboards pull real-time data from connected APIs via Edge Functions
- **AI Chatbot:** Context-aware assistant with full visibility into budget, people, GitHub, Jira, cloud, security, and roadmap data
- **Snapshot Progress:** Overview page compares current metrics against the latest AI-generated snapshot to highlight week-over-week changes
- **Dark/Light Theme:** Full theme support with a navy + teal design system
