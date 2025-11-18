import { LetterBase, LetterStatus } from "@internal/datastore";
import { GetLetterResponse, GetLetterResponseSchema, GetLettersResponse, GetLettersResponseSchema, LetterDto, PatchLetterRequest, PatchLetterResponse, PatchLetterResponseSchema, PostLettersRequest, PostLettersRequestResource } from '../contracts/letters';

export function mapPatchLetterToDto(request: PatchLetterRequest, supplierId: string): LetterDto {
  return {
    id: request.data.id,
    supplierId,
    status: LetterStatus.parse(request.data.attributes.status),
    reasonCode: request.data.attributes.reasonCode,
    reasonText: request.data.attributes.reasonText,
  };
}

export function mapPostLetterResourceToDto(request: PostLettersRequestResource, supplierId: string): LetterDto {
  return {
    id: request.id,
    supplierId,
    status: LetterStatus.parse(request.attributes.status),
    reasonCode: request.attributes.reasonCode,
    reasonText: request.attributes.reasonText,
  };
}

export function mapToPatchLetterResponse(letter: LetterBase): PatchLetterResponse {
  return PatchLetterResponseSchema.parse({
    data: letterToResourceResponse(letter)
  });
}

export function mapToGetLettersResponse(letters: LetterBase[]): GetLettersResponse {
  return GetLettersResponseSchema.parse({
    data: letters.map(letterToGetLettersResourceResponse)
  });
}

export function mapToGetLetterResponse(letter: LetterBase): GetLetterResponse {
  return GetLetterResponseSchema.parse({
    data:letterToResourceResponse(letter)
  });
}

function letterToResourceResponse(letter: LetterBase) {
  return {
    id: letter.id,
    type: 'Letter',
    attributes: {
      status: letter.status,
      specificationId: letter.specificationId,
      groupId: letter.groupId,
      ...(letter.reasonCode != null && { reasonCode: letter.reasonCode }),
      ...(letter.reasonText != null && { reasonText: letter.reasonText })
    }
  };
};

function letterToGetLettersResourceResponse(letter: LetterBase) {
  return {
    id: letter.id,
    type: 'Letter',
    attributes: {
      status: letter.status,
      specificationId: letter.specificationId,
      groupId: letter.groupId
    }
  };
};
