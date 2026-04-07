import { MIRepository } from "@internal/datastore/src/mi-repository";
import { IncomingMI, PostMIResponse, GetMIResponse } from "../contracts/mi";
import { mapToPostMIResponse, mapToGetMIResponse } from "../mappers/mi-mapper";

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
  return mapToGetMIResponse(await miRepo.getMI(miId, supplierId));
};
