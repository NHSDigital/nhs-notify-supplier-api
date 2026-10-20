export default function formatGroupId(
  clientId: string,
  campaignId = "unknown",
  safeTemplateId = "unknown",
): string {
  return `${clientId}-${campaignId}-${safeTemplateId}`;
}
