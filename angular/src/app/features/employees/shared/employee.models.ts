export interface RoleDto {
  id: number;
  name: string;
  description: string;
}

export interface EmployeeFormResult {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isTotpSetUp: boolean;
  roles: string[];
}

export interface EmployeeDetailsDto {
  id: string;
  storeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isTotpSetUp: boolean;
  roles: string[];
}

export interface EmployeeListDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isTotpSetUp: boolean;
}
