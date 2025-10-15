/**
 * NHS Notify Supplier API Event Schemas
 *
 * This entrypoint re-exports the Zod schemas and associated TypeScript types
 * for letter status change events and supporting domain models.
 *
 * Public exports:
 *  - Envelope / CloudEvent profile base schema
 *  - Letter status domain enum & schema
 *  - Letter status change domain schema
 *  - Individual letter status change event schemas (statusChangeEvents map)
 *  - Generic letter status change event schema
 */

// Envelope / CloudEvents base profile
export { $EnvelopeProfile, type EnvelopeProfile } from './events/envelope-profile';

// Domain schemas
export {
  $LetterStatus,
  type LetterStatus,
  $LetterStatusChange,
  type LetterStatusChange,
} from './domain/letter-status-change';

// Event schemas (collection & generic)
export {
  letterStatusChangeEventsMap,
  $LetterStatusChangeEvent,
  type LetterStatusChangeEvent,
} from './events/letter-status-change-events';

// Default export (optional): object grouping primary schemas
export default {
  $EnvelopeProfile: undefined as unknown as typeof import('./events/envelope-profile').$EnvelopeProfile, // placeholder for intellisense grouping only
  $LetterStatus: undefined as unknown as typeof import('./domain/letter-status-change').$LetterStatus,
  $LetterStatusChange: undefined as unknown as typeof import('./domain/letter-status-change').$LetterStatusChange,
  letterStatusChangeEventsMap: undefined as unknown as typeof import('./events/letter-status-change-events').letterStatusChangeEventsMap,
  $LetterStatusChangeEvent: undefined as unknown as typeof import('./events/letter-status-change-events').$LetterStatusChangeEvent,
};
