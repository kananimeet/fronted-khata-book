import api from "./api";
import { fetchWithDedupe } from "./api-cache";
import { AppSetting, UpdateSettingPayload } from "@/types/setting";

/**
 * Fetch system settings (e.g. default expense total_amount).
 * Accessible by all authenticated users (User and Admin).
 * Endpoint: GET /api/v1/settings
 * Accelerated with in-flight deduplication and memory caching.
 */
export async function getSetting(forceRefresh = false): Promise<AppSetting> {
  return fetchWithDedupe(
    "app-settings",
    async () => {
      const response = await api.get("/settings");
      return response.data?.data ?? response.data;
    },
    60000,
    forceRefresh
  );
}

/**
 * Admin: Update system settings (e.g. default room rate total_amount).
 * Endpoint: PATCH /api/v1/settings
 */
export async function updateSetting(
  data: UpdateSettingPayload
): Promise<AppSetting> {
  const response = await api.patch("/settings", data);
  return response.data?.data ?? response.data;
}
