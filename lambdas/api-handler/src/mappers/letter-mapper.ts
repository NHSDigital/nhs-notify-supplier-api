import { LetterBase, LetterStatus, UpdateLetter } from "@internal/datastore";
import {
  GetLetterResponse,
  GetLetterResponseSchema,
  GetLettersResponse,
  GetLettersResponseSchema,
  PatchLetterRequest,
  PatchLetterResponse,
  PatchLetterResponseSchema,
  PostLettersRequest,
  PostLettersRequestResource,
  UpdateLetterCommand,
} from "../contracts/letters";

function letterToResourceResponse(letter: LetterBase) {
  return {
    id: letter.id,
    type: "Letter",
    attributes: {
      status: letter.status,
      specificationId: letter.specificationId,
      groupId: letter.groupId,
      ...(letter.reasonCode != null && { reasonCode: letter.reasonCode }),
      ...(letter.reasonText != null && { reasonText: letter.reasonText }),
    },
  };
}

function letterToGetLettersResourceResponse(letter: LetterBase) {
  return {
    id: letter.id,
    type: "Letter",
    attributes: {
      status: letter.status,
      specificationId: letter.specificationId,
      groupId: letter.groupId,
    },
  };
}

// --------------------------
//  Map request to command
// --------------------------

export function mapToUpdateCommand(
  request: PatchLetterRequest,
  supplierId: string,
): UpdateLetterCommand {
  return {
    id: request.data.id,
    supplierId,
    status: LetterStatus.parse(request.data.attributes.status),
    reasonCode: request.data.attributes.reasonCode,
    reasonText: request.data.attributes.reasonText,
  };
}

export function mapToUpdateCommands(
  request: PostLettersRequest,
  supplierId: string,
): UpdateLetterCommand[] {
  return request.data.map( (letterToUpdate: PostLettersRequestResource) => ({
    id: letterToUpdate.id,
    supplierId,
    status: LetterStatus.parse(letterToUpdate.attributes.status),
    reasonCode: letterToUpdate.attributes.reasonCode,
    reasonText: letterToUpdate.attributes.reasonText,
  }));
}

// ---------------------------------------------
//  Map letter command to repository type
// ---------------------------------------------

export function mapToUpdateLetter(
  updateLetter: UpdateLetterCommand,
): UpdateLetter {
  return {
    id: updateLetter.id,
    supplierId: updateLetter.supplierId,
    status: updateLetter.status,
    reasonCode: updateLetter.reasonCode,
    reasonText: updateLetter.reasonText,
  };
}

// ---------------------------------------------
//  Map internal datastore letter to response
// ---------------------------------------------

export function mapToPatchLetterResponse(
  letter: LetterBase,
): PatchLetterResponse {
  return PatchLetterResponseSchema.parse({
    data: letterToResourceResponse(letter),
  });
}

export function mapToGetLettersResponse(
  letters: LetterBase[],
): GetLettersResponse {
  return GetLettersResponseSchema.parse({
    data: letters.map((letter) => letterToGetLettersResourceResponse(letter)),
  });
}

export function mapToGetLetterResponse(letter: LetterBase): GetLetterResponse {
  return GetLetterResponseSchema.parse({
    data: letterToResourceResponse(letter),
  });
}
