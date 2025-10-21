import {createContext, useState, useEffect} from 'react'
import { useNavigate } from "react-router-dom";
import type {User, AuthContextType} from '../types/index'
import {apiClient} from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем токен при старте
    if (token && isValidToken(token)) {
      const userData = decodeToken(token); // получаем user из payload
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (data: any): Promise<boolean> => {

    try {
      const response = await apiClient.post("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data,
      });
      const res = response;
      if (res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem("token", res.token);
        navigate("/dashboard");
        return true;
      }
      //throw new Error(res.message);
    } catch (err) {
      console.error(err);
      return false;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );

}

// Хелперы
const isValidToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const decodeToken = (token: string): User => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return { id: payload.sub, email: payload.email };
};

export default AuthContext;
export {AuthProvider}