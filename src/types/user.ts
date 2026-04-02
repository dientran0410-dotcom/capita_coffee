export type ApiResponse<T = any> = {
  success?: boolean;
  message?: string;
  data?: T;
  result?: T;
  [key: string]: any;
};

export type CreateAccountRequest = {
  email: string;
  name: string;
  address: string;
  phone: string;
  password: string;
  franchiseId?: string;
  roleName: string;
};

export type CreateAccountResponse = {
  id?: string;
  email?: string;
  name?: string;
  roleName?: string;
  [key: string]: any;
};

export type ChangeRoleRequest = {
  roleName: string;
};

export type ChangeRoleResponse = {
  id?: string;
  roleName?: string;
  [key: string]: any;
};

export type CurrentUserProfile = {
  id?: string;
  email?: string;
  name?: string;
  roleName?: string;
  [key: string]: any;
};

