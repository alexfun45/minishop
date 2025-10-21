
export type User = {
  id: number;
  telegram_id?: number;
  email: string;
  role?: 'user' | 'admin' | 'manager';
  username?: string | null;
  first_name?: string;
  last_name?: string | null;
  language?: string;
  phone?: string | null;
  bonus_points?: number;
  is_active?: boolean;
}

type loginData = {
  username: string;
  password: string;
}

export type AuthContextType = {
  user: User | null;
  token: string;
  isAuthenticated: boolean;
  login: (data: loginData) => void;
  logout: () => void;
};