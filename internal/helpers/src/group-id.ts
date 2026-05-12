export function formatGroupId(clientId: string, campaignId?: string, templateId?: string): string {
  const safeCampaignId = campaignId || "unknown";
  const safeTemplateId = templateId || "unknown";
  return `${clientId}_${safeCampaignId}_${safeTemplateId}`;
}   