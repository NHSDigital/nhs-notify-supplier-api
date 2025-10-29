---
description: "Comprehensive GitHub Copilot instructions for NHS Notify Supplier API development"
---

<!--
NHS Notify Supplier API - Copilot Instructions
Repository: nhs-notify-supplier-api
Version: 1.0.0
Owners: NHSDigital
Last Updated: 2025-10-29
Languages: TypeScript JavaScript YAML Makefile Ruby C# Python
Frameworks: OpenAPI Express.js AWS-Lambda Jest Redocly Jekyll
Build Tools: npm make esbuild openapi-generator docker
CI/CD: GitHub-Actions SonarCloud
Runtime Targets: Node.js-22 AWS-Lambda Docker
Security Posture: No-secrets-in-code SBOM-required Security-scanning Dependency-vulnerability-checks
Data Sensitivity: Regulated
Compliance: NHS-Digital-Standards Healthcare-Data-Security
--># NHS Notify Supplier API - Copilot Instructions

## Purpose & Scope

**Optimization Focus**: Safety, maintainability, API specification compliance, healthcare security standards

**In-Scope Tasks**:
- OpenAPI specification development and validation
- SDK generation and maintenance for TypeScript Python and C#
- Lambda function development
- Test generation (unit, integration, component)
- Documentation updates
- CI/CD pipeline modifications
- Security-first code patterns
- Healthcare data handling compliance

**Out-of-Scope Tasks**:
- Manual editing of generated SDK files
- Introducing new third-party dependencies without security review
- Creating test data with real PII/PHI
- Bypassing existing security controls
- Direct infrastructure modifications without Terraform

## Repository Signals

### Code Layout Overview
```
├── specification/api/          # OpenAPI specs (source of truth)
├── sdk/                       # Generated SDKs (DO NOT EDIT)
├── server/                    # Generated server implementations
├── lambdas/                   # AWS Lambda handlers
├── internal/                  # Internal shared packages
├── scripts/                   # Build and utility scripts
├── docs/                      # Jekyll documentation site
├── infrastructure/terraform/  # Infrastructure as Code
└── tests/                     # Test suites
```

### Primary Stack
- **Languages**: TypeScript 5.8+, Python 3.x, C# .NET 8
- **Runtime**: Node.js 22 (per `.tool-versions`)
- **Package Manager**: npm with workspaces
- **API Framework**: OpenAPI 3.0.3 specification-first
- **Testing**: Jest 30+ with coverage requirements
- **Build**: esbuild for Lambda bundling, OpenAPI Generator for SDK/server generation

### Core Commands
```bash
# Build everything
make clean && make build

# Generate SDKs from OpenAPI spec
npm run generate

# Run tests
npm run test:unit

# Lint all code
npm run lint

# Serve documentation locally
make serve  # http://localhost:3050

# Validate OpenAPI spec
npm run lint-oas
```

### Development Environment
- **Container**: Dev container with Ubuntu 24.04.3 LTS
- **Linting**: ESLint with comprehensive ruleset (security, sonarjs, unicorn, a11y)
- **Formatting**: Prettier integration
- **Git Hooks**: Pre-commit validation

## Response Policy for Copilot

### Tone & Style
- **Concise**: Engineering-grade responses with local file path references
- **Specific**: Always cite exact file paths like `specification/api/notify-supplier-phase1.yml`
- **Actionable**: Provide copy-pasteable code with minimal explanation overhead

### Default Behavior
1. **Specification-First**: Always check OpenAPI spec before code changes
2. **Test Generation**: Generate corresponding tests for ALL new code
3. **Preserve Signatures**: Maintain public API contracts and existing comments
4. **Multi-File Changes**: Provide structured patch plan with file-by-file summary
5. **Security First**: Apply healthcare data security patterns by default

### Ambiguity Handling
- State assumptions clearly and continue (e.g., "Assuming NHS Notify standard error format...")
- Provide 2 variants when trade-offs exist: security vs. performance, compliance vs. simplicity
- Default to more secure/compliant approach

### Security Override
Security and privacy rules **always** override convenience or performance optimizations.

## Coding Standards & Conventions

### TypeScript/JavaScript
```typescript
// ✅ GOOD: Strict typing with Zod validation
import { z } from 'zod';

const LetterSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  supplierId: z.string().min(1)
});

type Letter = z.infer<typeof LetterSchema>;
```

### Style Guide
- **ESLint Config**: `eslint.config.mjs` with airbnb-extended, security, sonarjs
- **Formatting**: Prettier with 2-space indentation
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Files**: kebab-case for filenames, match directory structure

### Error Handling
```typescript
// ✅ GOOD: Structured error responses
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Log without PII
logger.error('Letter processing failed', {
  letterId: letter.id,
  errorCode: 'PROCESSING_ERROR',
  // ❌ NEVER: patientName, address, or other PII
});
```

### Input Validation
```typescript
// ✅ GOOD: Always validate inputs with Zod
export const validateLetterRequest = (data: unknown): Letter => {
  return LetterSchema.parse(data); // Throws on invalid data
};
```

## Testing Strategy

### Framework & Coverage
- **Unit Tests**: Jest with 80%+ coverage requirement
- **Integration Tests**: Component tests for API endpoints
- **Contract Tests**: OpenAPI spec validation

### Test Commands
```bash
npm run test:unit           # All workspaces
npm run test:unit -w lambdas/api-handler  # Specific workspace
```

### Example Test Patterns
```typescript
// ✅ GOOD: Unit test with synthetic data
describe('LetterService', () => {
  it('should create letter with valid data', async () => {
    const mockData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      supplierId: 'TEST_SUPPLIER_001',
      status: 'PENDING' as const
    };

    const result = await letterService.create(mockData);
    expect(result.id).toBe(mockData.id);
  });
});
```

### Test Data Rules
- **Synthetic Only**: Use UUIDs like `123e4567-e89b-12d3-a456-426614174000`
- **No Real Data**: Never use actual NHS numbers, addresses, or patient info
- **Fixtures**: Store test data in `tests/fixtures/` with clear synthetic labels

## Security & Privacy Guardrails

### Secrets Management
```typescript
// ✅ GOOD: Environment variables
const config = {
  apiKey: process.env.NHS_NOTIFY_API_KEY!,
  dbConnectionString: process.env.DATABASE_URL!
};

// ❌ NEVER: Hardcoded secrets
const apiKey = 'sk-1234567890abcdef'; // NEVER DO THIS
```

### PII/PHI Protection
```typescript
// ✅ GOOD: Structured logging without PII
logger.info('Letter submitted', {
  letterId: letter.id,
  supplierId: letter.supplierId,
  timestamp: Date.now()
});

// ❌ NEVER: Log PII/PHI
logger.info('Letter for patient', {
  patientName: 'John Smith',  // NEVER DO THIS
  address: '123 Main St'      // NEVER DO THIS
});
```

### Input Sanitization
```typescript
// ✅ GOOD: Validate and sanitize
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### Dependency Security
```bash
# Scan dependencies regularly
npm audit
npm audit fix

# Check for known vulnerabilities
npm run deps:check
```

## Framework & Stack Guidance

### OpenAPI Specification
```yaml
# OpenAPI specification example
paths:
  /letters:
    post:
      summary: Submit letter request
      requestBody:
        required: true
        content:
          application/json:
            schema:
              # Reference to LetterRequest schema
              type: object
      responses:
        201:
          description: Letter created successfully
          content:
            application/json:
              schema:
                # Reference to Letter schema
                type: object
        400:
          # Reference to BadRequest response
          description: Bad request
```

### Lambda Handler Pattern
```typescript
// ✅ GOOD: Lambda handler structure
export const handler: APIGatewayProxyHandler = async (event, context) => {
  const correlationId = event.headers['x-correlation-id'] || context.awsRequestId;

  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = LetterSchema.parse(body);

    const result = await letterService.process(validatedData);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    logger.error('Handler error', { correlationId, error: error.message });
    return createErrorResponse(error);
  }
};
```

### Error Response Format
```typescript
// ✅ GOOD: Standardized error format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    correlationId: string;
    timestamp: string;
    details?: unknown;
  };
}
```

## Documentation & Communication

### File Locations
- **API Docs**: Generated at `sdk/html/` from OpenAPI spec
- **Architecture**: `docs/` (Jekyll site)
- **README**: Repository root with getting started guide
- **CHANGELOG**: Track all user-facing changes

### Comment Standards
```typescript
/**
 * Validates and processes a letter submission request.
 *
 * @param request - The letter request data (validated via Zod)
 * @param correlationId - Request correlation ID for tracing
 * @returns Promise resolving to processed letter details
 * @throws {ValidationError} When request data is invalid
 * @throws {ProcessingError} When letter processing fails
 */
export async function processLetter(
  request: LetterRequest,
  correlationId: string
): Promise<Letter> {
  // Implementation...
}
```

### Commit Messages
Follow Conventional Commits:
```
feat(api): add letter status endpoint
fix(lambda): handle missing correlation ID
docs(readme): update installation instructions
chore(deps): update typescript to 5.8.3
```

## Copilot Task Patterns

### 1. Add API Endpoint
```markdown
1. Update OpenAPI spec in `specification/api/notify-supplier-phase1.yml`
2. Generate SDK: `npm run generate`
3. Implement Lambda handler in `lambdas/api-handler/src/`
4. Add unit tests with 80%+ coverage
5. Update integration tests
6. Document in README if user-facing
```

### 2. Refactor Safely
```markdown
1. Create failing tests that capture current behavior
2. Make incremental changes preserving public APIs
3. Run full test suite after each change
4. Update documentation and examples
5. Verify generated SDKs still work
```

### 3. Fix Bug
```markdown
1. Write failing test that reproduces the bug
2. Implement minimal fix maintaining backwards compatibility
3. Verify fix with original test case
4. Add regression test to prevent recurrence
5. Update CHANGELOG with fix description
```

### 4. Update Dependencies
```markdown
1. Check security advisories: `npm audit`
2. Update lockfiles: `npm install`
3. Run full test suite
4. Check for breaking changes in generated SDKs
5. Update CI if runtime versions change
```

## File & Snippet Templates

### New Lambda Function
```typescript
// lambdas/new-handler/src/index.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { logger } from '@internal/helpers';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const correlationId = event.headers['x-correlation-id'] || context.awsRequestId;

  logger.info('Handler invoked', { correlationId });

  try {
    // Implementation here

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    logger.error('Handler error', { correlationId, error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### Package.json for New Internal Package
```json
{
  "name": "@internal/package-name",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test:unit": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.1.11"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@typescript-eslint/eslint-plugin": "^8.27.0",
    "@typescript-eslint/parser": "^8.27.0",
    "eslint": "^9.27.0",
    "jest": "^30.1.3",
    "typescript": "^5.8.3"
  }
}
```

## Toolchain & Commands

### Linting & Formatting
```bash
npm run lint                    # Lint all workspaces
npm run lint:fix               # Auto-fix linting issues
npm run typecheck              # TypeScript type checking
```

### Building & Testing
```bash
make clean && make build       # Full clean build
npm run test:unit              # Run unit tests
npm run bundle-oas             # Bundle OpenAPI specification
npm run generate               # Generate SDKs from spec
```

### Local Development
```bash
make serve                     # Serve docs at localhost:3050
npm run serve-oas             # Preview OpenAPI spec at localhost:5001
```

### Security Scanning
```bash
npm audit                      # Dependency vulnerability scan
npm run deps:check            # Check dependency mismatches
```

## Non-Functional Requirements

### Performance
- **Lambda Cold Start**: Bundle size < 10MB, init time < 3s
- **API Response Time**: P95 < 2s for letter submission
- **Throughput**: Support 1000 concurrent letter requests

### Reliability
- **Retries**: Exponential backoff with max 3 attempts
- **Timeouts**: 30s for external API calls, 900s for Lambda execution
- **Circuit Breaker**: Fail fast on repeated downstream failures

### Observability
```typescript
// ✅ GOOD: Structured logging with correlation
logger.info('Processing letter', {
  correlationId,
  letterId,
  supplierId,
  stage: 'validation',
  duration: processingTime
});
```

## Domain Knowledge

### Key Entities
- **Letter**: Print job with specifications, supplier assignment, and status tracking
- **Supplier**: Registered print service provider with capabilities and SLAs
- **Specification**: Template defining letter format, paper type, and printing requirements
- **Batch**: Collection of letters grouped for efficient processing

### NHS Notify Context
- **Integration Point**: Suppliers poll for available print jobs
- **Data Flow**: NHS Notify → Supplier API → Print Supplier Systems
- **Compliance**: Must meet NHS Digital security and data protection standards

## DO / DON'T Summary

### DO
- ✅ Regenerate SDKs after any OpenAPI spec changes
- ✅ Use synthetic test data (never real PII/PHI)
- ✅ Validate all inputs with Zod schemas
- ✅ Include correlation IDs in all logs and responses
- ✅ Follow specification-first development
- ✅ Maintain backwards compatibility in public APIs
- ✅ Use workspace-scoped commands (`npm run test:unit -w lambdas/api-handler`)
- ✅ Check security implications before adding dependencies

### DON'T
- ❌ Manually edit files in `sdk/` directory (they're generated)
- ❌ Hardcode secrets or configuration values
- ❌ Log PII, PHI, or sensitive data
- ❌ Skip input validation on external data
- ❌ Break existing public API contracts
- ❌ Add dependencies without security review
- ❌ Use real NHS numbers or patient data in tests
- ❌ Bypass established security controls

## Examples Section

### Golden Path Examples

#### 1. Adding New API Endpoint
**Prompt**: "Add a GET /letters/{id}/history endpoint to retrieve letter status history"

**Ideal Response**:
```markdown
I'll add the letter history endpoint following the specification-first approach:

1. First, I'll update the OpenAPI spec in `specification/api/notify-supplier-phase1.yml`
2. Add the endpoint definition with proper response schemas
3. Generate the updated SDK with `npm run generate`
4. Implement the Lambda handler logic
5. Add comprehensive tests

Let me start with the OpenAPI specification update...
```

#### 2. Bug Fix with Tests
**Prompt**: "Fix the letter status validation - it's accepting invalid status values"

**Ideal Response**:
```markdown
I'll fix the status validation issue by first writing a failing test, then implementing the fix:

1. Add test cases for invalid status values in `lambdas/api-handler/src/__tests__/`
2. Update the Zod schema to strictly validate status enum
3. Ensure proper error responses for invalid status
4. Verify the fix resolves the issue

Starting with the failing test to reproduce the issue...
```

### Anti-Examples

#### ❌ Wrong: Manual SDK editing
**Bad Prompt Response**:
```markdown
I'll directly edit the TypeScript SDK file in `sdk/typescript/src/` to add the new method...
```

**✅ Corrected**:
```markdown
I'll update the OpenAPI specification and regenerate the SDK to add the new method...
```

#### ❌ Wrong: Using real data
**Bad Test**:
```typescript
const testData = {
  patientName: 'John Smith',
  nhsNumber: '1234567890'
};
```

**✅ Corrected**:
```typescript
const testData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  supplierId: 'TEST_SUPPLIER_001'
};
```

## Maintenance & Versioning

### File Updates
- **Owners**: NHS Digital team members with write access
- **Review Process**: All changes require PR review
- **Change Documentation**: Update version and last_updated in YAML front matter

### Versioning Policy
- **Major** (2.0.0): Breaking changes to instruction format or scope
- **Minor** (1.1.0): New sections, additional guidance, or enhanced examples
- **Patch** (1.0.1): Typo fixes, clarifications, or small corrections

### Deprecation Process
1. Mark deprecated sections with clear migration path
2. Maintain backwards compatibility for 6 months minimum
3. Remove deprecated content with major version bump

## Gaps & Assumptions

| Area | Assumption/Gap | Suggested Default | Owner to Confirm |
|------|---------------|-------------------|------------------|
| Test Coverage | Assumed 80% minimum coverage | Enforce via CI/CD | Tech Lead |
| API Versioning | Assumed semantic versioning | Document versioning strategy | Product Owner |
| Data Retention | Assumed 7-year NHS standard | Confirm compliance requirements | Compliance Team |
| Error Codes | Assumed HTTP standard codes | Define NHS Notify specific codes | API Team |
| Rate Limiting | Assumed supplier-based limits | Define specific thresholds | Operations Team |
| Audit Logging | Assumed structured JSON logs | Confirm audit requirements | Security Team |
| Multi-Region | Assumed single region deployment | Confirm DR/HA requirements | Infrastructure Team |
| SDK Languages | Current: TS, Python, C# | Add additional languages as needed | Developer Relations |

## Quick Validation Checklist

**Repository Setup**
- [ ] OpenAPI specification exists and validates (`npm run lint-oas`)
- [ ] Generated SDKs build successfully (`npm run generate`)
- [ ] All tests pass (`npm run test:unit`)
- [ ] Linting passes without errors (`npm run lint`)
- [ ] Documentation builds and serves (`make serve`)

**Code Quality**
- [ ] No hardcoded secrets or credentials in codebase
- [ ] All inputs validated with Zod or equivalent schemas
- [ ] Error handling includes correlation IDs
- [ ] Logging structured and PII-free
- [ ] Test coverage meets minimum thresholds

**Security Compliance**
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] No real PII/PHI in test data or examples
- [ ] Security headers implemented in API responses
- [ ] Authentication/authorization properly configured

**API Standards**
- [ ] OpenAPI spec follows NHS Digital standards
- [ ] Backwards compatibility maintained for existing endpoints
- [ ] Response formats consistent across all endpoints
- [ ] Proper HTTP status codes used
- [ ] API versioning strategy documented and followed
