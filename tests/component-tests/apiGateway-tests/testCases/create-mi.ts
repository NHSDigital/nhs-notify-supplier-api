export type MiRequestBody = {
  data: {
    type: string;
    attributes: {
      groupId: string;
      lineItem: string;
      quantity: number;
      specificationId: string;
      stockRemaining: number;
      timestamp: string;
    };
  };
};

export function miValidRequest(): MiRequestBody {
  let requestBody: MiRequestBody;

  requestBody = {
    data: {
      attributes: {
        groupId: "group123",
        lineItem: "envelope-business-standard",
        quantity: 10,
        specificationId: "Test-Spec-Id",
        stockRemaining: 100,
        timestamp: new Date().toISOString(),
      },
      type: "ManagementInformation",
    },
  };
  return requestBody;
}

export function miInvalidRequest(): MiRequestBody {
  let requestBody: MiRequestBody;

  requestBody = {
    data: {
      attributes: {
        groupId: "group123",
        lineItem: "envelope-business-standard",
        quantity: 10,
        specificationId: "Test-Spec-Id",
        stockRemaining: 100,
        timestamp: new Date().toISOString(),
      },
      type: "?",
    },
  };
  return requestBody;
}

export function miInvalidDateRequest(): MiRequestBody {
  let requestBody: MiRequestBody;

  requestBody = {
    data: {
      attributes: {
        groupId: "group123",
        lineItem: "envelope-business-standard",
        quantity: 10,
        specificationId: "Test-Spec-Id",
        stockRemaining: 100,
        timestamp: "2021-10-28T",
      },
      type: "ManagementInformation",
    },
  };
  return requestBody;
}
