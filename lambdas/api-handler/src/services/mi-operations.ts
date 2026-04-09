import { MIRepository } from "@internal/datastore/src/mi-repository";
import { GetMIResponse, IncomingMI, PostMIResponse } from "../contracts/mi";
import { mapToGetMIResponse, mapToPostMIResponse } from "../mappers/mi-mapper";
import { ApiErrorDetail } from "../contracts/errors";
import NotFoundError from "../errors/not-found-error";

function isNotFoundError(error: any) {
  return (
    error instanceof Error &&
    /^Management Information with id \w+ not found for supplier \w+$/.test(error.message)
  );
}

export const postMI = async (
  incomingMi: IncomingMI,
  miRepo: MIRepository,
): Promise<PostMIResponse> => {
  return mapToPostMIResponse(await miRepo.putMI(incomingMi));
};

export const getMI = async (
  miId: string,
  supplierId: string,
  miRepo: MIRepository,
): Promise<GetMIResponse> => {
  let mi;

  try {
    mi = await miRepo.getMI(miId, supplierId);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundId);
    }
    throw error;
  }
  return mapToGetMIResponse(mi);
};
