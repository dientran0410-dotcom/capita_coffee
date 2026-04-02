export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPPLIER: 'SUPPLIER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.MANAGER]: '/manager',
  [ROLES.SUPPLIER]: '/supplier/products',
  [ROLES.STAFF]: '/staff',
  [ROLES.CUSTOMER]: '/customer',
};
