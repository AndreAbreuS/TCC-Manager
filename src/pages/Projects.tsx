import React, { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import { useUser } from "@/src/App";
import { 
  FileText, 
  Plus, 
  ChevronRight, 
  User, 
  Clock,
  Filter,
  Search,
  BookOpen,
  MessageSquare,
  CalendarDays
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export function Projects() {
  const { user } = useUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacherId: ""
  });

  const fetchProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const list = await api.professors.list();
      setProfessors(list);
      if (list.length > 0) {
        setFormData(prev => ({ ...prev, teacherId: list[0].id }));
      }
    } catch (e) {
      console.error("Erro ao obter orientadores:", e);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (user?.role === "Student") {
      fetchProfessors();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId) {
      setErrorMsg("Selecione um Professor Orientador para o projeto.");
      return;
    }
    try {
      setErrorMsg("");
      await api.projects.create(formData);
      setShowCreate(false);
      setFormData({ title: "", description: "", teacherId: "" });
      fetchProjects();
    } catch (e: any) {
      setErrorMsg(e.message || "Erro ao iniciar projeto.");
    }
  };

  // RN-02: O usuário aluno deve participar de apenas 1 projeto.
  const hasProject = user?.role === "Student" && projects.length > 0;

  // RN-04: TCCs já concluídos permanecem em histórico
  const activeProjects = projects.filter(p => p.status !== "Completed");
  const completedProjects = projects.filter(p => p.status === "Completed");

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner and Creation Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Meus Trabalhos de TCC</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Gestão de andamento acadêmico e orientações de TCC.</p>
        </div>
        {user?.role === "Student" && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            {hasProject ? (
              <span className="text-[0.7rem] bg-slate-100 text-slate-500 font-bold px-3 py-2.5 rounded border border-slate-200">
                Você já possui um TCC em andamento
              </span>
            ) : (
              <button 
                onClick={() => {
                  setErrorMsg("");
                  setShowCreate(true);
                }}
                className="bg-brand-primary text-white px-5 py-2.5 rounded flex items-center gap-2 hover:bg-brand-primary-dark transition-all font-bold text-xs uppercase tracking-widest shadow-md shadow-slate-200 w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4" /> NOVO PROJETO
              </button>
            )}
          </div>
        )}
      </div>

      {hasProject && (
        <div className="bg-blue-50/50 border border-blue-200 text-blue-800 rounded-lg p-4 flex gap-3 items-center text-xs font-medium">
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          <p>
            <strong>Regra Acadêmica:</strong> Você já possui um projeto de TCC iniciado. Alunos podem participar de apenas <strong>1 projeto simultaneamente</strong> conforme diretrizes da instituição.
          </p>
        </div>
      )}

      {user?.role === "Professor" && projects.some((p: any) => p.inviteStatus === "Pending" && p.teacherId === user.id) && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-indigo-950">Solicitação de Orientação Pendente</p>
              <p className="text-slate-600 text-[11px] font-medium">
                Você possui {projects.filter((p: any) => p.inviteStatus === "Pending" && p.teacherId === user.id).length} {projects.filter((p: any) => p.inviteStatus === "Pending" && p.teacherId === user.id).length === 1 ? "nova solicitação de aluno" : "novas solicitações de alunos"} para orientar seus respectivos trabalhos de TCC. Acesse o workspace do projeto correspondente para aceitar ou recusar.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-white border border-indigo-100 px-4 py-2 rounded-full shadow-2xs self-start sm:self-auto shrink-0 text-center">
            Ação Requerida
          </span>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl border border-slate-200"
          >
            <h2 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight uppercase">Iniciar Novo TCC</h2>
            <p className="text-slate-400 text-xs font-medium mb-6">Ao criar o projeto, um convite de orientação será enviado automaticamente para o orientador selecionado.</p>
            
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-bold uppercase tracking-wider">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5 text-sm">
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Título do Trabalho</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Desenvolvimento de Plataforma de Gestão"
                  className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none font-medium"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Descrição / Resumo Executivo</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Descreva os objetivos principais e metodologia sugerida para o projeto..."
                  className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none font-medium"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Professor Orientador Convidado</label>
                  <span className="text-[0.6rem] text-slate-400 font-medium italic">Apenas professores da mesma instituição</span>
                </div>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none bg-white font-medium"
                  value={formData.teacherId}
                  onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                >
                  <option value="">Selecione um Professor Orientador</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 rounded border border-slate-200 font-bold hover:bg-slate-50 text-[0.7rem] uppercase tracking-widest transition-colors text-slate-600"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-primary text-white px-4 py-2.5 rounded font-bold shadow-lg shadow-slate-200 text-[0.7rem] uppercase tracking-widest hover:bg-brand-primary-dark transition-colors"
                >
                  Salvar e Convidar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ACTIVE PROJECTS LIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Projetos em Andamento / Convites</h3>
        
        {activeProjects.length === 0 && !loading && (
          <div className="py-12 text-center bg-white rounded-lg border border-slate-200 border-dashed">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum projeto em andamento ou pendente</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-accent transition-all cursor-pointer group flex flex-col gap-4"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {project.status === "Aguardando avaliação" ? (
                    <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                      Aguardando Avaliação
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                      {project.status === "Active" ? "Em Curso" : project.status}
                    </span>
                  )}
                  {project.inviteStatus === "Pending" && (
                    <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-black uppercase tracking-[0.1em] bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse">
                      Convite Pendente
                    </span>
                  )}
                  {project.inviteStatus === "Rejected" && (
                    <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-black uppercase tracking-[0.1em] bg-red-50 text-red-600 border border-red-100">
                      Orientação Recusada
                    </span>
                  )}
                  {project.inviteStatus === "Accepted" && (
                    <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-black uppercase tracking-[0.1em] bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Orientador Vinculado
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-extrabold text-slate-800 group-hover:text-brand-primary transition-colors tracking-tight leading-tight mb-2 uppercase">
                  {project.title}
                </h3>
                <p className="text-slate-500 text-[0.8rem] line-clamp-2 leading-relaxed h-10">
                  {project.description}
                </p>
              </div>

              {project.inviteStatus === "Pending" && (
                <div className={cn(
                  "p-3 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal mt-1",
                  user?.role === "Professor" && project.teacherId === user.id
                    ? "bg-indigo-50 text-indigo-950 border-indigo-200 animate-pulse"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                )}>
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {user?.role === "Professor" && project.teacherId === user.id
                      ? "Ação necessária: Você foi convidado para orientar este TCC. Acesse o projeto para responder."
                      : "Aguardando confirmação de orientação pelo professor indicado."}
                  </span>
                </div>
              )}

              {user?.role === "Professor" && project.teacherId === user.id && project.inviteStatus === "Accepted" && (
                <div className="flex flex-col gap-2 mt-1">
                  {project.hasNewMessageFromStudent && (
                    <div className="p-2.5 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal bg-amber-50 text-amber-950 border-amber-200 animate-pulse">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Mensagem de dúvida pendente no canal de comunicação</span>
                    </div>
                  )}
                  {project.hasPendingMeeting && (
                    <div className="p-2.5 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal bg-indigo-50 text-indigo-950 border-indigo-200 animate-pulse">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0 text-indigo-505" />
                      <span>Solicitação de reunião aguardando resposta</span>
                    </div>
                  )}
                </div>
              )}

              {user?.role === "Student" && project.studentId === user.id && project.inviteStatus === "Accepted" && (
                <div className="flex flex-col gap-2 mt-1">
                  {(project.hasFeedbackOnTasks && project.latestFeedbackAt && project.latestFeedbackAt > (localStorage.getItem(`tcc_viewed_feedback_${project.id}`) || "")) && (
                    <div className="p-2.5 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal bg-emerald-50 text-emerald-950 border-emerald-250 animate-pulse">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>Novo feedback cadastrado pelo orientador no cronograma</span>
                    </div>
                  )}
                  {(project.hasMeetingResponse && project.latestMeetingResponseAt && project.latestMeetingResponseAt > (localStorage.getItem(`tcc_viewed_meeting_${project.id}`) || "")) && (
                    <div className="p-2.5 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal bg-indigo-50 text-indigo-950 border-indigo-200 animate-pulse">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                      <span>Nova resposta para sua solicitação de reunião</span>
                    </div>
                  )}
                  {(project.hasNewMessageFromTeacher && project.latestMessageAt && project.latestMessageAt > (localStorage.getItem(`tcc_viewed_message_${project.id}`) || "")) && (
                    <div className="p-2.5 rounded text-[10px] uppercase font-black tracking-wide flex items-center gap-2 border leading-normal bg-amber-50 text-amber-955 border-amber-200 animate-pulse">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Nova resposta no canal de comunicação e dúvidas</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[0.5rem] font-bold text-slate-500 uppercase">
                    {project.teacherName ? project.teacherName.substring(0, 2) : "OR"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Orientador</span>
                    <span className="text-[0.65rem] font-extrabold text-slate-600 truncate max-w-[150px]">
                      {project.teacherName || "Aguardando..."}
                    </span>
                  </div>
                </div>
                <span className="text-brand-accent font-bold text-[0.65rem] uppercase tracking-widest flex items-center gap-1 opacity-100 group-hover:translate-x-1 transition-transform">
                  Entrar no Workspace <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* COMPLETED HISTORY SECTION (RN-04) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Histórico de TCCs Concluídos (Apenas Leitura)</h3>
        
        {completedProjects.length === 0 && !loading && (
          <div className="py-12 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum TCC concluído para visualização no histórico</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50/50 p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-accent transition-all cursor-pointer group flex flex-col gap-4"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Concluído (Histórico)
                  </span>
                  {project.isApproved && (
                    <span className="px-2 py-0.5 rounded-full text-[0.55rem] font-bold uppercase tracking-[0.1em] bg-blue-100 text-blue-700 border border-blue-200">
                      Publicado no Catálogo
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-extrabold text-slate-800 group-hover:text-brand-primary transition-colors tracking-tight leading-tight mb-2 uppercase">
                  {project.title}
                </h3>
                <p className="text-slate-500 text-[0.8rem] line-clamp-2 leading-relaxed h-10">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[0.5rem] font-bold text-slate-600 uppercase">
                    {project.teacherName ? project.teacherName.substring(0, 2) : "OR"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Orientado por</span>
                    <span className="text-[0.65rem] font-extrabold text-slate-600 truncate max-w-[150px]">
                      {project.teacherName || "Orientador"}
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold text-[0.65rem] uppercase tracking-widest flex items-center gap-1 opacity-100 group-hover:text-brand-primary transition-colors">
                  Visualizar Registro <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline fallback / missing imports check
function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
  );
}
