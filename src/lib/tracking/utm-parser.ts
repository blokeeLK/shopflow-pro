/**
 * ShopFlow Tracking — UTM Parser
 * Parses structured UTM parameters from Facebook Ads campaigns.
 * 
 * Expected format:
 *   utm_campaign = campaign_name|campaign_id
 *   utm_medium   = adset_name|adset_id
 *   utm_content  = ad_name|ad_id
 *   utm_term     = placement
 *   utm_source   = FB
 */

export interface ParsedCampaign {
  campaign_name: string;
  campaign_id: string;
  adset_name: string;
  adset_id: string;
  ad_name: string;
  ad_id: string;
  placement: string;
  source: string;
}

function splitPipe(value: string | undefined): [string, string] {
  if (!value) return ["", ""];
  const idx = value.lastIndexOf("|");
  if (idx === -1) return [value, ""];
  return [value.slice(0, idx), value.slice(idx + 1)];
}

export function parseUTMCampaign(utms: {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
}): ParsedCampaign {
  const [campaign_name, campaign_id] = splitPipe(utms.utm_campaign);
  const [adset_name, adset_id] = splitPipe(utms.utm_medium);
  const [ad_name, ad_id] = splitPipe(utms.utm_content);

  return {
    campaign_name,
    campaign_id,
    adset_name,
    adset_id,
    ad_name,
    ad_id,
    placement: utms.utm_term || "",
    source: utms.utm_source || "",
  };
}

/** Get parsed campaign data from stored UTMs */
export function getParsedCampaignFromStorage(getStoredUTMs: () => Partial<any>): ParsedCampaign {
  return parseUTMCampaign(getStoredUTMs());
}
