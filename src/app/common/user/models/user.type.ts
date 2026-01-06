export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image: string | null;
  role: 'user' | 'admin' | string;
  roles: string[];
  permissions: string[];
  twoFactorEnabled: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: Date;
  updatedAt: Date;
};
