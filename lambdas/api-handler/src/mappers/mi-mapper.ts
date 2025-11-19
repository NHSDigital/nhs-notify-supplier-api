import { MIBase } from "@internal/datastore/src";
import { IncomingMI, PostMIRequest as PostMIRequest, PostMIResponse, PostMIResponseSchema } from "../contracts/mi";

export function mapToMI(request: PostMIRequest, supplierId: string): IncomingMI {
  return  {
    supplierId: supplierId,
    ...request.data.attributes
  };
}

export function mapToPostMIResponse(mi: MIBase): PostMIResponse {
  return PostMIResponseSchema.parse({
    data: {
      id: mi.id,
      type: 'ManagementInformation',
      attributes: {
      lineItem: mi.lineItem,
      timestamp: mi.timestamp,
      quantity: mi.quantity,
      specificationId: mi.specificationId,
      groupId: mi.groupId,
      stockRemaining: mi.stockRemaining
      }
    }
  });
}
