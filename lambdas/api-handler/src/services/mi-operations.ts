import { MIRepository } from "@internal/datastore/src/mi-repository";
import { IncomingMI, PostMIResponse } from "../contracts/mi";
import { mapToPostMIResponse } from "../mappers/mi-mapper";

export const postMI = async (incomingMi: IncomingMI, miRepo: MIRepository): Promise<PostMIResponse> => {
  return mapToPostMIResponse(await miRepo.putMI(incomingMi));
}
