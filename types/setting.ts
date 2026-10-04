export interface AppSetting {
  id: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface SettingResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: AppSetting;
}

export interface UpdateSettingPayload {
  total_amount: number;
}
