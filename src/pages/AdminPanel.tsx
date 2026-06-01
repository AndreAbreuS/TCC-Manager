import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import { 
  Building, 
  GraduationCap, 
  Plus, 
  Loader2, 
  Users, 
  Search, 
  Filter, 
  User, 
  ShieldCheck, 
  BookOpen, 
  Mail,
  RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users"); // "users" or "academic"
  
  // Data lists
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New entry states
  const [newInst, setNewInst] = useState("");
  const [newCourse, setNewCourse] = useState({ name: "", institutionId: "" });

  // Filters state
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterRole, setFilterRole] = useState(""); // "", "Student", "Professor"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [i, c, u] = await Promise.all([
        api.institutions.list(),
        api.courses.list(),
        api.admin.users()
      ]);
      setInstitutions(i || []);
      setCourses(c || []);
      setUsers(u || []);
    } catch (err) {
      console.error("Erro ao carregar dados do painel administrador:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInst = async () => {
    if (!newInst.trim()) return;
    try {
      await api.institutions.create({ name: newInst.trim() });
      setNewInst("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim() || !newCourse.institutionId) return;
    try {
      await api.courses.create({ name: newCourse.name.trim(), institutionId: newCourse.institutionId });
      setNewCourse({ name: "", institutionId: "" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter users lists
  const filteredUsers = users.filter((u) => {
    // Filter by Role (Aluno / Professor)
    if (filterRole && u.role !== filterRole) {
      return false;
    }
    // Filter by Institution
    if (filterInstitution && u.institutionId !== filterInstitution) {
      return false;
    }
    // Filter by Course
    if (filterCourse && u.courseId !== filterCourse) {
      return false;
    }
    // Filter by search name or email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  // Dynamically filter course options based on the selected institution
  const availableCoursesForFilter = filterInstitution
    ? courses.filter(c => c.institutionId === filterInstitution)
    : courses;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Carregando dados administrativos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-0 bg-transparent cursor-pointer flex items-center gap-2",
              activeTab === "users" ? "bg-white text-indigo-700 shadow-sm font-black" : "text-slate-500 hover:bg-white/50"
            )}
          >
            <Users className="w-4 h-4" />
            Usuários Cadastrados
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={cn(
              "px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-0 bg-transparent cursor-pointer flex items-center gap-2",
              activeTab === "academic" ? "bg-white text-indigo-700 shadow-sm font-black" : "text-slate-500 hover:bg-white/50"
            )}
          >
            <Building className="w-4 h-4" />
            Instituições & Cursos
          </button>
        </div>

        <button 
          onClick={fetchData}
          title="Recarregar dados"
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-lg border border-slate-200 flex items-center gap-2 self-start md:self-auto cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" ? (
          <motion.div
            key="users_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter and Search Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Filtros de Pesquisa</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search query input */}
                <div className="space-y-1.5 col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscar por nome / email</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Pesquisar..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Perfil (Role) Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perfil de Acesso</label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="">Todos os Perfis</option>
                    <option value="Student">Alunos (Student)</option>
                    <option value="Professor">Professores (Professor)</option>
                    <option value="Admin">Administradores (Admin)</option>
                  </select>
                </div>

                {/* Institution filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instituição</label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                    value={filterInstitution}
                    onChange={(e) => {
                      setFilterInstitution(e.target.value);
                      setFilterCourse(""); // reset course when institution switches
                    }}
                  >
                    <option value="">Todas as Instituições</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                {/* Course filter */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso Acadêmico</label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-60"
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                  >
                    <option value="">Todos os Cursos</option>
                    {availableCoursesForFilter.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset Filters button */}
              {(filterRole || filterInstitution || filterCourse || searchQuery) && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setFilterRole("");
                      setFilterInstitution("");
                      setFilterCourse("");
                      setSearchQuery("");
                    }}
                    className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider underline cursor-pointer bg-transparent border-0"
                  >
                    Limpar Todos os Filtros
                  </button>
                </div>
              )}
            </div>

            {/* List of Users Card/Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lista de Usuários</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Total encontrado: {filteredUsers.length} usuários</p>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <Users className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="font-bold text-xs uppercase tracking-widest">Nenhum usuário cadastrado corresponde aos filtros ativos.</p>
                  <p className="text-[11px] text-slate-400">Verifique os termos de consulta ou mude os filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10.5px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-6 font-black">Nome / Email</th>
                        <th className="py-4 px-6 font-black">Perfil / Acesso</th>
                        <th className="py-4 px-6 font-black">Instituição de Ensino</th>
                        <th className="py-4 px-6 font-black">Curso Associado</th>
                        <th className="py-4 px-6 font-black text-right">Data Cadastro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredUsers.map((u) => {
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                                  u.role === "Student" ? "bg-amber-100 text-amber-800" :
                                  u.role === "Professor" ? "bg-indigo-100 text-indigo-800" :
                                  "bg-rose-100 text-rose-800"
                                )}>
                                  {u.name?.substring(0, 2).toUpperCase() || "US"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate max-w-xs">{u.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3" /> {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {u.role === "Student" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[9.5px] font-bold uppercase tracking-wider border border-amber-200">
                                  <User className="w-3 h-3" /> Aluno (Student)
                                </span>
                              )}
                              {u.role === "Professor" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[9.5px] font-bold uppercase tracking-wider border border-indigo-200">
                                  <GraduationCap className="w-3.5 h-3.5" /> Professor (Professor)
                                </span>
                              )}
                              {u.role === "Admin" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[9.5px] font-bold uppercase tracking-wider border border-rose-200">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Admin (Organizador)
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-600 font-medium">{u.institutionName || "Administração"}</span>
                            </td>
                            <td className="py-4 px-6">
                              {u.role === "Student" ? (
                                <span className="text-slate-600 font-medium flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                                  {u.courseName || "Sem Curso"}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                                  {u.role === "Professor" ? "Múltiplos Cursos / Docência" : "Acesso irrestrito"}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-[10.5px] text-slate-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Legado"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="academic_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Institution Management */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-base font-display font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-wider pb-3 border-b border-slate-100">
                <Building className="w-5 h-5 text-indigo-600" />
                Gerenciar Instituições acadêmicas
              </h2>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input 
                  type="text" 
                  placeholder="Nome por extenso da Instituição de Ensino"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-250 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  value={newInst}
                  onChange={e => setNewInst(e.target.value)}
                />
                <button 
                  onClick={handleCreateInst}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer border-0"
                >
                  <Plus className="w-4 h-4" /> Adicionar Instituição
                </button>
              </div>

              {institutions.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-150 rounded-xl">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nenhuma instituição cadastrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutions.map(inst => (
                    <div key={inst.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-700 text-xs">{inst.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Courses Management */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-base font-display font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-wider pb-3 border-b border-slate-100">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Gerenciar Cursos Acadêmicos
              </h2>
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <select 
                  className="px-4 py-3 rounded-lg border border-slate-250 bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                  value={newCourse.institutionId}
                  onChange={e => setNewCourse({ ...newCourse, institutionId: e.target.value })}
                >
                  <option value="">Selecione a Instituição correspondente...</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder="Nome completo do curso (ex: Engenharia de Software)"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-250 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                />
                <button 
                  onClick={handleCreateCourse}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer border-0"
                >
                  <Plus className="w-4 h-4" /> Adicionar Curso
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-150 rounded-xl">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nenhum curso acadêmico cadastrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map(course => {
                    const instName = institutions.find(i => i.id === course.institutionId)?.name || "N/A";
                    return (
                      <div key={course.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-700 text-xs block truncate">{course.name}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold tracking-widest block pl-10">
                          {instName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
