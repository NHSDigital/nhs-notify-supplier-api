export interface LetterApiAttributes {
  reasonCode: number;
  reasonText: string;
  requestedProductionStatus: 'ACTIVE' | 'HOLD' | 'CANCEL';
  status: LetterApiStatus;
}

export interface LetterApiResource {
  id: string;
  type: 'Letter';
  attributes: LetterApiAttributes;
}

export interface LetterApiDocument {
  data: LetterApiResource;
}

export type LetterApiStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PRINTED' | 'ENCLOSED' | 'CANCELLED' | 'DISPATCHED' | 'FAILED' | 'RETURNED' | 'DESTROYED' | 'FORWARDED';
