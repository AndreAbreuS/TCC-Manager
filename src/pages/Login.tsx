import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/src/lib/api";
import { useUser } from "@/src/App";
import { LogIn, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.auth.login({ email, password });
      login(response.user, response.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-lg shadow-2xl shadow-slate-200/50 p-10 border border-slate-200"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2">
            TCC<span className="text-brand-accent">Manager</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Academic Project Management Suite</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs rounded border border-red-100 font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Email Institucional</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none text-sm font-medium"
              placeholder="exemplo@universidade.edu"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none text-sm font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-sidebar hover:bg-slate-800 text-white font-bold py-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-slate-200"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            AUTENTICAR
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
          Sistema restrito.{" "}
          <Link to="/register" className="text-brand-accent font-bold hover:underline">
            Solicitar acesso
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/public" className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest hover:text-brand-accent underline transition-colors">
            Catálogo Público de TCCs
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
