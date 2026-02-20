import { z } from "zod";
import { idRef } from "./id-ref";
import { $PackSpecification } from "./pack-specification";
import { $EnvironmentStatus } from "./common";
import { $Supplier } from "./supplier";

export const $SupplierPack = z
  .object({
    id: z.string(),
    packSpecificationId: idRef($PackSpecification),
    supplierId: idRef($Supplier),
    approval: z
      .enum([
        "DRAFT",
        "SUBMITTED",
        "PROOF_RECEIVED",
        "APPROVED",
        "REJECTED",
        "DISABLED",
      ])
      .meta({
        title: "Approval Status",
        description:
          "Indicates the current state of the supplier pack approval process.",
      }),
    status: $EnvironmentStatus,
  })
  .meta({
    title: "SupplierPack",
    description:
      "Indicates that a supplier is capable of producing a specific pack specification.",
  });
export type SupplierPack = z.infer<typeof $SupplierPack>;
