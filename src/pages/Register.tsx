import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/src/lib/api";
import { UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
    institutionId: "",
    courseId: ""
  });
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, courseRes] = await Promise.all([
          api.institutions.list(),
          api.courses.list()
        ]);
        setInstitutions(instRes);
        setCourses(courseRes);
      } catch (err) {
        console.error("Failed to fetch context data", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const pwd = formData.password.trim();
    if (pwd.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(pwd)) {
      setError("A senha deve conter pelo menos uma letra maiúscula.");
      setLoading(false);
      return;
    }
    if (!/[a-z]/.test(pwd)) {
      setError("A senha deve conter pelo menos uma letra minúscula.");
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(pwd)) {
      setError("A senha deve conter pelo menos um número (algarismo).");
      setLoading(false);
      return;
    }

    try {
      await api.auth.register(formData);
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-lg shadow-2xl p-10 border border-slate-200"
      >
        <div className="mb-10">
          <Link to="/login" className="text-slate-400 hover:text-brand-accent flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao acesso
          </Link>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2 tracking-tight">Solicitar Acesso</h1>
          <p className="text-slate-400 text-sm font-medium">Preencha os dados abaixo para ingressar no TCC Manager.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 text-xs rounded border border-red-100 font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Email Corporativo / Institucional</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Senha de Segurança (mín. 8 caracteres, com maiúsculas, minúsculas e números)</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Perfil de Acesso</label>
            <select
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium bg-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Student">Aluno(a)</option>
              <option value="Professor">Docente / Orientador(a)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Instituição</label>
            <select
              required
              className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium bg-white"
              value={formData.institutionId}
              onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {institutions.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          {formData.role === "Student" && (
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Curso Acadêmico</label>
              <select
                required
                className="w-full px-4 py-3 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all text-sm font-medium bg-white"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {courses.filter(c => c.institutionId === formData.institutionId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-sidebar hover:bg-slate-800 text-white font-bold py-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-xl shadow-slate-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              CONFIRMAR CADASTRO
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
