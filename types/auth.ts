export interface User {
  id: string | number;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  is_active?: boolean;
  profile_picture?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckEmailData {
  exists: boolean;
  is_password_set?: boolean;
  has_login?: boolean;
  user: User;
}

export interface CheckEmailResponse {
  success: boolean;
  data: CheckEmailData;
  message?: string;
}

export interface LoginResponse {
  access_token?: string;
  user?: User;
  data?: {
    access_token: string;
    user: User;
  };
  message?: string;
  success?: boolean;
  statusCode?: number;
}

export interface UsersListResponse {
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  success?: boolean;
}

export interface SingleUserResponse {
  data: User;
  message?: string;
  success?: boolean;
}

export interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  error?: string;
  errors?: Array<{ field?: string; message?: string }>;
}
