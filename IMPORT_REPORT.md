# IMPORT_REPORT.md — Nexera Data Import Report

> **Important Notice:** Nexera does not have a CSV import pipeline. Data ingestion is performed via a **seed script** (`Backend/seed.js`) that inserts hardcoded JavaScript objects directly into PostgreSQL. This document provides:
> 1. An example report based on the **actual seed script behaviour**
> 2. A recommended production-grade import report format for future CSV ingestion

---

## Part 1: Seed Script Import Report (Actual Behaviour)

### 1.1 Import Summary

This report reflects what the seed script (`Backend/seed.js`) does when `npm run db:seed` is executed.

| Metric | Value |
|---|---|
| **Source** | `Backend/seed.js` (hardcoded JavaScript array) |
| **Total records processed** | 8 Users + 5 Channels + 1 DM + 3 Messages = 17 records |
| **Successful inserts** | 17 (if no prior data conflicts) |
| **Failed inserts** | 0 (with fresh database) |
| **Warnings** | 0 |
| **Estimated processing duration** | ~2–5 seconds (sequential SQL inserts, no batching) |
| **Validation performed** | None — hardcoded data is not validated |

### 1.2 Records Processed

#### Users (8 records)

| Row | Name | Email | UUID Generated | Status |
|---|---|---|---|---|
| 1 | Ethan Winters | ethan@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 2 | Sarah Connor | sarah@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 3 | Marcus Reeves | marcus@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 4 | Priya Kapoor | priya@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 5 | Liam Chen | liam@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 6 | Nora Silva | nora@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 7 | Arjun Patel | arjun@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |
| 8 | Zara Ali | zara@nexera.dev | `crypto.randomUUID()` | ✅ Inserted |

**Password for all users:** `Nexera@123` (bcrypt hashed via `crypt(..., gen_salt('bf'))` in SQL)

#### Channels (5 group conversations)

| # | Name | Description | Members | Status |
|---|---|---|---|---|
| 1 | general | General discussion | All 8 users | ✅ Inserted |
| 2 | engineering | Engineering team | All 8 users | ✅ Inserted |
| 3 | design | Design and UI/UX | All 8 users | ✅ Inserted |
| 4 | marketing | Marketing strategies | All 8 users | ✅ Inserted |
| 5 | random | Watercooler chat | All 8 users | ✅ Inserted |

#### DM Conversations (1)

| # | Participants | Status |
|---|---|---|
| 1 | Priya Kapoor ↔ Arjun Patel | ✅ Inserted |

#### Messages (3)

| # | Conversation | Sender | Content | Status |
|---|---|---|---|---|
| 1 | Priya–Arjun DM | Priya Kapoor | "Hey Arjun, did you finish the new design for the sidebar?" | ✅ Inserted |
| 2 | Priya–Arjun DM | Arjun Patel | "Yes! I just pushed it. Let me know what you think." | ✅ Inserted |
| 3 | #general channel | Ethan Winters | "Welcome to Nexera everyone! 🚀" | ✅ Inserted |

### 1.3 Anomaly Report (Seed Script)

| # | Record Type | Issue | Severity | Action |
|---|---|---|---|---|
| 1 | All records | No validation on any field before insert | High | N/A — hardcoded data assumed valid |
| 2 | All records | No rollback on partial failure; `DELETE FROM auth.users` destroys all data first | High | Script exits with error if any insert fails |
| 3 | Workspace | References `public.workspaces` table that has no Sequelize model | Medium | May fail if table doesn't exist |
| 4 | All records | Script deletes `auth.users` (cascades to all data) before inserting — destructive | High | Data loss on re-run |
| 5 | Auth users | Password uses `crypt()` SQL function — requires `pgcrypto` extension to be enabled | Medium | Runtime error if extension missing |

---

## Part 2: Recommended Production-Grade CSV Import Report Format

> This section defines the ideal import report structure that should be implemented when CSV ingestion is added to Nexera.

### 2.1 Import Summary

```
═══════════════════════════════════════════════════════════════════
  NEXERA — DATA IMPORT REPORT
  Generated:   2026-06-15 00:30:00 UTC
  Source File: users_bulk_import.csv
  File Size:   1.4 MB (12,847 bytes)
  Import ID:   imp_8ed75fca-31d6-4a58
═══════════════════════════════════════════════════════════════════

  SUMMARY
  ─────────────────────────────────────────
  Total Rows in File:       1,000
  Header Row:               1
  Data Rows Processed:      999
  ─────────────────────────────────────────
  ✅ Successfully Imported:   947
  ❌ Failed (Skipped):          38
  ⚠️  Imported with Warnings:  14
  ─────────────────────────────────────────
  Processing Duration:       2.34 seconds
  Records/sec:               427

  FINAL STATUS: ⚠️  PARTIAL SUCCESS
═══════════════════════════════════════════════════════════════════
```

### 2.2 Anomaly Report

Each anomaly would be recorded in the following format:

```
┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #1                                                      │
│  Row:        14                                                  │
│  Column:     email                                               │
│  Value:      "john.doe@"                                         │
│  Issue:      Invalid email format — missing domain               │
│  Severity:   HIGH                                                │
│  Action:     SKIPPED — row not imported                          │
│  Rule:       RFC 5322 email validation                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #2                                                      │
│  Row:        27                                                  │
│  Column:     email                                               │
│  Value:      "alice@example.com"                                 │
│  Issue:      Duplicate email — already exists in database        │
│  Severity:   HIGH                                                │
│  Action:     SKIPPED — row not imported                          │
│  Rule:       Unique constraint on public."Users".email            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #3                                                      │
│  Row:        31                                                  │
│  Column:     username                                            │
│  Value:      "John Doe"                                          │
│  Issue:      Username contains spaces; only [a-z0-9_] allowed   │
│  Severity:   MEDIUM                                              │
│  Action:     CORRECTED — auto-converted to "john_doe"            │
│  Rule:       Username regex ^[a-z0-9_]+$                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #4                                                      │
│  Row:        45                                                  │
│  Column:     full_name                                           │
│  Value:      (empty)                                             │
│  Issue:      Required field is empty                             │
│  Severity:   HIGH                                                │
│  Action:     SKIPPED — row not imported                          │
│  Rule:       fullName NOT NULL, min length 2                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #5                                                      │
│  Row:        78                                                  │
│  Column:     price (course import)                               │
│  Value:      "-5.00"                                             │
│  Issue:      Price cannot be negative                            │
│  Severity:   MEDIUM                                              │
│  Action:     FLAGGED — imported with price set to 0.00           │
│  Rule:       price >= 0.00                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ANOMALY #6                                                      │
│  Row:        102                                                 │
│  Column:     [entire row]                                        │
│  Value:      "id,email,,,,"                                      │
│  Issue:      Malformed row — fewer columns than header (2 of 6) │
│  Severity:   HIGH                                                │
│  Action:     SKIPPED — row not imported                          │
│  Rule:       Column count must match header (6 columns)          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Anomaly Classification Table

| Anomaly Type | Severity | Default Action |
|---|---|---|
| Missing required field | HIGH | SKIP row |
| Invalid email format | HIGH | SKIP row |
| Duplicate email (within CSV) | HIGH | SKIP duplicate; import first occurrence |
| Duplicate email (vs. database) | HIGH | SKIP row |
| Invalid date format | MEDIUM | SKIP or FLAG |
| Negative price | MEDIUM | CORRECT to 0.00 or FLAG |
| Username format violation | MEDIUM | CORRECT (sanitise) or SKIP |
| Extra whitespace | LOW | CORRECT (trim) |
| Out-of-range enum value | HIGH | SKIP row |
| Malformed CSV row | HIGH | SKIP row |
| Non-UTF-8 encoding | MEDIUM | SKIP or attempt conversion |
| Empty file | CRITICAL | Abort import |
| Duplicate records within CSV | HIGH | SKIP duplicates |
| Referential integrity violation (FK) | HIGH | SKIP row |

### 2.4 Machine-Readable Report (JSON)

```json
{
  "importId": "imp_8ed75fca-31d6-4a58",
  "timestamp": "2026-06-15T00:30:00.000Z",
  "sourceFile": "users_bulk_import.csv",
  "summary": {
    "totalRows": 999,
    "successful": 947,
    "failed": 38,
    "warnings": 14,
    "durationMs": 2340
  },
  "anomalies": [
    {
      "rowNumber": 14,
      "column": "email",
      "value": "john.doe@",
      "issue": "Invalid email format",
      "severity": "HIGH",
      "action": "SKIPPED"
    },
    {
      "rowNumber": 27,
      "column": "email",
      "value": "alice@example.com",
      "issue": "Duplicate email in database",
      "severity": "HIGH",
      "action": "SKIPPED"
    }
  ]
}
```

### 2.5 Recommended Implementation Notes

1. **Validate before insert:** Parse the entire CSV and validate all rows in memory before starting any database operations. Use a two-pass approach: validate → report → insert.
2. **Use database transactions:** Wrap bulk inserts in a single transaction. On any critical failure, rollback all inserts.
3. **Idempotent imports:** Use `ON CONFLICT (email) DO NOTHING` or `DO UPDATE` (upsert) to support re-running imports safely.
4. **Row-level error isolation:** A failed row should not block the entire import. Log, skip, and continue.
5. **Streaming for large files:** For files >10 MB, use a stream parser (e.g., `csv-parse` with streaming API) rather than loading the entire file into memory.
6. **Audit trail:** Store import reports in a `public.import_logs` table for historical review.
7. **Admin-only endpoint:** The import endpoint must be protected by `authMiddleware` and a role check (`role === 'admin'`).
