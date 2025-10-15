# NHS Notify Supplier API Event Schemas

This internal package defines CloudEvents-compatible schemas (with Zod) for the Supplier API domain – currently focusing on Letter Status Change events. It provides:

* A reusable CloudEvents envelope profile (`$EnvelopeProfile`)
* Domain model schemas for letter status transitions (`$LetterStatus`, `$LetterStatusChange`)
* Concrete per-status event schemas with strict `type`, `dataschema` URI and semantic version validation
* Utilities to programmatically access all status change event schemas (`statusChangeEvents`)

> NOTE: This package is private and published only to the internal GitHub Packages registry. Do not reference it externally; consume it within this mono‑repo or via internal pipelines.

---

## Directory Structure

```text
src/
  domain/
    letter-status-change.ts        # Domain model and status enum
  events/
    envelope-profile.ts            # CloudEvents base envelope extensions & constraints
    letter-status-change-events.ts # Per status event schema generation
  cli/                             # CLI scripts for bundling / codegen
  index.ts                         # (re-)exports (not shown above if generated later)
```

---

## Concepts

### 1. Envelope Profile (`$EnvelopeProfile`)

> NB: this will be replaced with a common schema in future published in the nhs-notify-standards repo

Defines the constrained CloudEvents 1.0 envelope used across Notify. It enforces:

* `specversion` fixed to `1.0`
* Reverse‑DNS `type` pattern starting `uk.nhs.notify.` with prohibited ambiguous verbs
* Structured `source` and `subject` path formats (with additional subject shape rules for `/data-plane` sources)
* Trace context (`traceparent`, optional `tracestate`)
* Optional classification / regulation tags
* Consistency rules (e.g. severity text ↔ number mapping)

### 2. Letter Status Domain

`letter-status-change.ts` introduces:

* `$LetterStatus` enumeration covering lifecycle states:
  `PENDING | ACCEPTED | REJECTED | PRINTED | ENCLOSED | CANCELLED | DISPATCHED | FAILED | RETURNED | DESTROYED | FORWARDED | DELIVERED`
* `$LetterStatusChange` domain object, extending a `DomainBase('LetterStatusChange')` (see helpers package) with:
  * `domainId` (branded identifier)
  * `sourceSubject` – original resource subject
  * `status` – one of `$LetterStatus`
  * Optional `reasonCode`, `reasonText`

### 3. Per‑Status Event Schemas

`letter-status-change-events.ts` programmatically creates a schema per status by extending `$EnvelopeProfile` and replacing `data` with the domain payload. Each schema enforces:

* `type = uk.nhs.notify.supplier-api.letter-status.<STATUS>.v1`
* `dataschema` matches: `https://notify.nhs.uk/events/supplier-api/letter-status/<STATUS>/1.<minor>.<patch>.json`
* `dataschemaversion` uses semantic version with major fixed to `1` (`1.x.y`)
* `data.status` literal‑locked to the matching status

The export `statusChangeEvents` is a dictionary keyed by `letter-status.<STATUS>`.

---

## Installation (Internal)

Inside this mono‑repo other internal packages should depend on it by name:

```jsonc
// package.json
"dependencies": {
  "@nhsdigital/nhs-notify-event-schemas-supplier-api": "*"
}
```

External `npm install` instructions are intentionally omitted (private package).

---

## Usage Examples

### Validating a Raw Event

```typescript
import { statusChangeEvents } from '@nhsdigital/nhs-notify-event-schemas-supplier-api';

const schema = statusChangeEvents['letter-status.PRINTED'];
const parsed = schema.safeParse(incomingEventJson);
if (!parsed.success) {
  // handle validation failure (log / DLQ)
  console.error(parsed.error.format());
} else {
  const evt = parsed.data; // strongly typed
  console.log(`Letter ${evt.data.domainId} moved to ${evt.data.status}`);
}
```

### Validating a generic letter-status.* event

```typescript
```typescript
import { $LetterStatusChangeEvent } from '@nhsdigital/nhs-notify-event-schemas-supplier-api';

function validateLetterStatusEvent(e: unknown) {
  const result = $LetterStatusChangeEvent.safeParse(e);
  if (!result.success) {
    // handle validation failure (log / DLQ)
    return { ok: false as const, error: result.error };
  }
  // event is strongly typed
  return { ok: true as const, event: result.data };
}
```

### Creating a New Letter Status Event Instance

```typescript
import { statusChangeEvents } from '@nhsdigital/nhs-notify-event-schemas-supplier-api';
import { randomUUID } from 'crypto';

const status = 'ACCEPTED' as const;
const schema = statusChangeEvents[`letter-status.${status}`];

const event = {
  specversion: '1.0',
  id: randomUUID(),
  source: '/data-plane/supplier-api',
  subject: 'customer/1b20f918-bb05-4c78-a4aa-5f6a3b8e0c91/letter/4a5a9cb5-1440-4a12-bd72-baa7cfecd111',
  type: 'uk.nhs.notify.supplier-api.letter-status.ACCEPTED.v1',
  time: new Date().toISOString(),
  dataschema: 'https://notify.nhs.uk/events/supplier-api/letter-status/ACCEPTED/1.0.0.json',
  dataschemaversion: '1.0.0',
  data: {
    domainId: 'abc123',
    sourceSubject: 'customer/.../letter/...',
    status: 'ACCEPTED',
  },
  traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
  recordedtime: new Date().toISOString(),
  severitytext: 'INFO',
  severitynumber: 2,
};

schema.parse(event); // throws if invalid
```

---

## Versioning & Dataschema

* Major version locked at `1` for current lineage.
* Minor + patch increments should reflect additive / backwards compatible changes to the data payload.
* `dataschema` URIs must be updated in lockstep with `dataschemaversion` when publishing new schema variants.

Automated generation tasks (below) assist bundling and JSON Schema emission.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | TypeScript compile to `dist/` |
| `npm test` / `npm run test:unit` | Run Jest unit tests |
| `npm run gen:asyncapi` | Bundle AsyncAPI sources into `dist/asyncapi` |
| `npm run gen:jsonschema` | Emit JSON Schemas derived from Zod definitions |
| `npm run lint` | Lint code + schema (Spectral) |
| `npm run lint:fix` | Auto-fix lint issues |

Execution order helpers:

* `prebuild` ensures a clean `dist` and generates asyncapi bundle
* `prelint:schema` generates JSON prior to Spectral validation

---

## Adding New Event Types (Future)

1. Extend the domain model under `src/domain/`
2. Add a generator similar to `letter-status-change-events.ts`
3. Ensure `type` naming: `uk.nhs.notify.supplier-api.<area>.<action>.v1`
4. Provide deterministic `dataschema` pattern with semantic versioning
5. Export via `src/index.ts`
6. Add unit tests & update documentation

---

## Validation Philosophy

Rules aim for early rejection of:

* Ambiguous or post-hoc semantic verbs ("completed", "updated", etc.) in event `type`
* Poorly structured routing metadata (`source`, `subject`)
* Inconsistent severity pairings
* Non-conformant trace context

This reduces downstream consumer ambiguity and improves observability correlation.

---

## License

MIT (internal usage only)

---

## Support

Raise questions via the repository discussions or internal channel referencing the `events` package.
