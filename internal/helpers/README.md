# NHS Notify Helpers (Internal)

Utility primitives shared across internal Supplier API packages. These helpers provide:

* Lightweight domain modelling conventions (branded IDs)
* Type-safe relationship references
* Common scalar validators (Version, Environment)

The goal is to keep domain packages small and consistent – not to become a general utility grab‑bag.

---

## Exports Overview

| Export | Kind | Purpose |
|--------|------|---------|
| `DomainBase(name)` | Function | Builds a base Zod object with a branded `domainId` for the named aggregate/entity |
| `idRef(schema, idField?, entityName?)` | Function | Creates a reference field mirroring the ID field type of another schema |
| `$Version` / `Version` | Zod schema / Type | Semantic version (major.minor.patch) branded as `Version` (from `version.ts`) |
| `$Environment` | Zod schema | Environment identifier (e.g. `dev`, `int`, `prod`) (from `environment.ts`) |

---

## Installation (Internal Only)

Other workspaces in the mono‑repo reference the helpers via package name (preferred) or relative path. Example:

```jsonc
// package.json
"dependencies": {
  "@internal/helpers": "*"
}
```

No external publication is intended.

---

## Usage

### 1. Defining a Domain Model Base

```typescript
import { DomainBase } from '@internal/helpers';
import { z } from 'zod';

// Creates { domainId: BrandedString<'Letter'> }
const $Letter = DomainBase('Letter').extend({
  createdAt: z.string().datetime(),
});
```

The branded ID prevents accidental mixing of IDs across entity types while remaining a plain string at runtime.

### 2. Referencing Another Entity

```typescript
import { idRef, DomainBase } from '@internal/helpers';
import { z } from 'zod';

const $Customer = DomainBase('Customer');
const $Order = DomainBase('Order').extend({
  customerId: idRef($Customer), // Inherits type & metadata from Customer.domainId
});
```

You can supply a custom ID field name if the target schema uses something other than `domainId`.

### 3. Version & Environment Scalars

```typescript
import { $Version, $Environment } from '@internal/helpers';

const cfg = {
  version: $Version.parse('1.2.3'),
  environment: $Environment.parse('dev'),
};
```

---

## API Details

### `DomainBase(name: string)`

Returns a Zod object: `{ domainId: BrandedString<name> }` with metadata describing the ID.

### `idRef(schema, idFieldName = 'domainId', entityName?)`

Clones the ID field schema from `schema.shape[idFieldName]`, re‑annotating metadata to describe the target entity reference. Throws if the field is absent.

### `$Version`

Defined in `src/version.ts`.

Regex: `^\d+\.\d+\.\d+$` – no pre-release/build metadata (keep simple for now). Consider extending when semver nuance is required.

### `$Environment`

Defined in `src/environment.ts`.

String with metadata; callers typically restrict further via union if they need a constrained set.

---

## Design Notes

* Zod is used for runtime validation + static type inference; no dual maintenance.
* Branded string IDs provide nominal typing without runtime overhead.
* Helpers avoid opinionated persistence or transport logic – they stay schema-focused.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run unit tests (Jest) |
| `npm run lint` | Lint sources |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run typecheck` | Type-only compile (no emit) |

---

## Conventions & Guidelines

1. Prefer composing small schemas over adding conditional logic inside helpers.
2. Avoid adding business logic – keep to typing / structural utilities.
3. If adding a new scalar helper, provide: regex (if applicable), examples, and rationale.
4. Update this README when exports change.

---

## Extending

When introducing a new shared primitive:

1. Implement under `src/` with clear JSDoc.
2. Export from `src/index.ts`.
3. Add a focused test in `__tests__` (create folder if absent).
4. Document in the Exports Overview table.

---

## License

MIT (internal usage only)

---

## Support

Use internal channel or repository discussions referencing the `helpers` package.
