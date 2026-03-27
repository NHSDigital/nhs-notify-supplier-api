export function createPreparedV1Event(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();

  return {
    specversion: "1.0",
    id: (overrides.id as string) ?? "7b9a03ca-342a-4150-b56b-989109c45613",
    source: "/data-plane/letter-rendering/test",
    subject: "client/client1/letter-request/letterRequest1",
    type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v1",
    time: now,
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.1.0.0.schema.json",
    dataschemaversion: "1.0.0",
    data: {
      domainId:
        (overrides.domainId as string) ??
        "fe658e11-0ffc-44f4-8ad6-0fafe75bfeee",
      letterVariantId:
        (overrides.letterVariantId as string) ?? "digitrials-aspiring",
      requestId: "request1",
      requestItemId: "requestItem1",
      requestItemPlanId: "requestItemPlan1",
      clientId: "client1",
      campaignId: "campaign1",
      templateId: "template1",
      url: (overrides.url as string) ?? "s3://letterDataBucket/letter1.pdf",
      sha256Hash:
        "3a7bd3e2360a3d29eea436fcfb7e44c735d117c8f2f1d2d1e4f6e8f7e6e8f7e6",
      createdAt: now,
      pageCount: 1,
      status: (overrides.status as string) ?? "PREPARED",
    },
    traceparent: "00-0af7651916cd43dd8448eb211c803191-b7ad6b7169203331-01",
    recordedtime: now,
    severitynumber: 2,
    severitytext: "INFO",
    plane: "data",
  };
}
