import { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Login } from "@/src/pages/Login";
import { Register } from "@/src/pages/Register";
import { Dashboard } from "@/src/pages/Dashboard";
import { Projects } from "@/src/pages/Projects";
import { ProjectDetails } from "@/src/pages/ProjectDetails";
import { AdminPanel } from "@/src/pages/AdminPanel";
import { Layout } from "@/src/layouts/Layout";
import { PublicCatalog } from "@/src/pages/PublicCatalog";
import { Profile } from "@/src/pages/Profile";

interface UserContextType {
  user: any;
  loading: boolean;
  login: (userData: any, token: string) => void;
  logout: () => void;
  updateUser: (userData: any) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("tcc_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem("tcc_user", JSON.stringify(userData));
    localStorage.setItem("tcc_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("tcc_user");
    localStorage.removeItem("tcc_token");
    setUser(null);
  };

  const updateUser = (userData: any) => {
    localStorage.setItem("tcc_user", JSON.stringify(userData));
    setUser(userData);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/public" element={<PublicCatalog standalone={true} />} />
          
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={user?.role !== "Admin" ? <Projects /> : <Navigate to="/dashboard" />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/explore" element={<PublicCatalog />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={user?.role === "Admin" ? <AdminPanel /> : <Navigate to="/dashboard" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
