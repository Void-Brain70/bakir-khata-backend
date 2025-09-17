// user-response.dto.ts
export interface UserResponseDto {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roles?: any[];
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  avatar: string | null;
  isSuperAdmin: boolean;
  type: string;
}
