import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/src/lib/api";
import { useUser } from "@/src/App";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Plus,
  ArrowLeft,
  Loader2,
  CalendarDays,
  User,
  Download,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "" });

  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: "", description: "", dateTime: "" });
  const [sendingMeetingRequest, setSendingMeetingRequest] = useState(false);

  const [rejectingMeetingId, setRejectingMeetingId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Record<string, boolean>>({});
  const [taskFeedbackInputs, setTaskFeedbackInputs] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const projects = await api.projects.list();
      const p = projects.find((x: any) => x.id === id);
      setProject(p);
      
      const t = await api.tasks.listByProject(id!);
      setTasks(t);

      const s = await api.submissions.listByProject(id!);
      setSubmissions(s || []);

      try {
        const msgs = await api.messages.listByProject(id!);
        setMessages(msgs || []);
      } catch (err) {
        console.warn("Could not fetch messages:", err);
      }

      try {
        const m = await api.meetings.listByProject(id!);
        setMeetings(m || []);
      } catch (err) {
        console.warn("Could not fetch meetings:", err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Derived state helpers for student's unread notifications:
  const getLatestFeedbackAt = () => {
    const feedbacksWithTime = tasks.filter((t: any) => t.feedback && t.feedback.trim() !== "");
    return feedbacksWithTime.length > 0
      ? feedbacksWithTime.reduce((max: string, t: any) => {
          const tTime = t.feedbackUpdatedAt || t.id || "";
          return tTime > max ? tTime : max;
        }, "")
      : "";
  };

  const getLatestMeetingResponseAt = () => {
    const answeredMeetings = meetings.filter((m: any) => m.status === "Aceita" || m.status === "Recusada");
    return answeredMeetings.length > 0
      ? answeredMeetings.reduce((max: string, m: any) => {
          const mTime = m.respondedAt || m.id || "";
          return mTime > max ? mTime : max;
        }, "")
      : "";
  };

  const getLatestMessageAt = () => {
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    return lastMsg ? (lastMsg.sentAt || lastMsg.id || "") : "";
  };

  const isLastMessageFromTeacher = () => {
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    return lastMsg ? (lastMsg.senderRole === "Professor" || lastMsg.senderRole === "Admin" || lastMsg.senderId === project?.teacherId) : false;
  };

  const studentHasUnreadFeedback = user?.role === "Student" && id && (() => {
    const latest = getLatestFeedbackAt();
    if (!latest) return false;
    const viewed = localStorage.getItem(`tcc_viewed_feedback_${id}`) || "";
    return latest > viewed;
  })();

  const studentHasUnreadMeetingResponse = user?.role === "Student" && id && (() => {
    const latest = getLatestMeetingResponseAt();
    if (!latest) return false;
    const viewed = localStorage.getItem(`tcc_viewed_meeting_${id}`) || "";
    return latest > viewed;
  })();

  const studentHasUnreadMessage = user?.role === "Student" && id && (() => {
    const latest = getLatestMessageAt();
    if (!latest || !isLastMessageFromTeacher()) return false;
    const viewed = localStorage.getItem(`tcc_viewed_message_${id}`) || "";
    return latest > viewed;
  })();

  useEffect(() => {
    if (user?.role !== "Student" || !id) return;

    if (activeTab === "tasks") {
      const latest = getLatestFeedbackAt();
      if (latest) {
        localStorage.setItem(`tcc_viewed_feedback_${id}`, latest);
      } else {
        localStorage.setItem(`tcc_viewed_feedback_${id}`, new Date().toISOString());
      }
    }

    if (activeTab === "meetings") {
      const latest = getLatestMeetingResponseAt();
      if (latest) {
        localStorage.setItem(`tcc_viewed_meeting_${id}`, latest);
      } else {
        localStorage.setItem(`tcc_viewed_meeting_${id}`, new Date().toISOString());
      }
    }

    if (activeTab === "communication") {
      const latest = getLatestMessageAt();
      if (latest && isLastMessageFromTeacher()) {
        localStorage.setItem(`tcc_viewed_message_${id}`, latest);
      }
    }
  }, [user, id, activeTab, tasks, meetings, messages, project]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.tasks.create({ ...newTask, projectId: id });
    setShowTaskForm(false);
    setNewTask({ title: "", description: "", deadline: "" });
    fetchData();
  };

  const handleToggleStatus = async (task: any) => {
    if (project?.status !== "Active") return; // Read Only once completed or under evaluation
    const isOwnerStudent = user?.role === "Student" && project.studentId === user.id;
    const isAdmin = user?.role === "Admin";
    if (!isOwnerStudent && !isAdmin) {
      setErrorMsg("Apenas o aluno responsável por este TCC ou o administrador podem marcar tarefas/milestones como concluídos.");
      return;
    }
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      setErrorMsg("");
      await api.tasks.update(task.id, { status: nextStatus, progress: nextStatus === "Completed" ? 100 : 0 });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao atualizar status da tarefa.");
    }
  };

  const toggleFeedback = (taskId: string) => {
    setExpandedFeedbacks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSaveTaskFeedback = async (taskId: string) => {
    const text = taskFeedbackInputs[taskId] !== undefined ? taskFeedbackInputs[taskId] : "";
    setSubmittingFeedback(prev => ({ ...prev, [taskId]: true }));
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.tasks.update(taskId, { feedback: text });
      setSuccessMsg("Feedback cadastrado com sucesso!");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao tentar salvar o feedback.");
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Professor responds to orientation invitation
  const handleRespondInvite = async (action: "accept" | "reject") => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.projects.respondToInvite(id!, action);
      if (action === "reject") {
        setSuccessMsg("Convite recusado e criação do projeto cancelada com sucesso.");
        setTimeout(() => {
          navigate("/explore");
        }, 2000);
      } else {
        setSuccessMsg("Parceria de orientação aceita com sucesso!");
        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Algo deu errado ao responder convite.");
    }
  };

  // Approve project final evaluation
  const handleApproveCatalog = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.projects.approveCatalog(id!);
      setSuccessMsg("TCC avaliado, aprovado e concluído com sucesso!");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao aprovar TCC.");
    }
  };

  // Reprove project (revert to "Active" state)
  const handleReproveProject = async () => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.projects.reprove(id!);
      setSuccessMsg("O TCC foi reprovado e o projeto retornou ao estado em andamento (Ativo).");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao reprovar TCC.");
    }
  };

  // Mark project as completed (for historical listing)
  const handleCompleteProject = async () => {
    const pending = tasks.filter((t: any) => t.status !== "Completed");
    if (pending.length > 0) {
      setErrorMsg("Não é possível realizar a entrega final pois existem tarefas ou milestones pendentes no cronograma.");
      return;
    }

    try {
      setErrorMsg("");
      setSuccessMsg("");
      await api.projects.complete(id!);
      setSuccessMsg("TCC concluído com sucesso! Agora o trabalho aguarda a avaliação final do seu professor orientador.");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao tentar concluir TCC.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSendingMessage(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.messages.create(id!, newMessageText);
      setNewMessageText("");
      const msgs = await api.messages.listByProject(id!);
      setMessages(msgs || []);
      setSuccessMsg("Mensagem enviada com sucesso!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao tentar enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateMeetingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim() || !newMeeting.dateTime) {
      setErrorMsg("Motivo e data/horário são campos obrigatórios.");
      return;
    }
    setSendingMeetingRequest(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.meetings.create(id!, {
        title: newMeeting.title,
        description: newMeeting.description,
        dateTime: newMeeting.dateTime
      });
      setSuccessMsg("Solicitação de reunião enviada com sucesso!");
      setShowMeetingForm(false);
      setNewMeeting({ title: "", description: "", dateTime: "" });
      const m = await api.meetings.listByProject(id!);
      setMeetings(m || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao solicitar a reunião.");
    } finally {
      setSendingMeetingRequest(false);
    }
  };

  const handleAcceptMeeting = async (meetingId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.meetings.accept(meetingId);
      setSuccessMsg("Reunião aceita e marcada com sucesso!");
      const m = await api.meetings.listByProject(id!);
      setMeetings(m || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao aceitar reunião.");
    }
  };

  const handleRejectMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReasonInput.trim()) {
      setErrorMsg("A justificativa é obrigatória para recusar a reunião.");
      return;
    }
    setSubmittingRejection(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.meetings.reject(rejectingMeetingId!, rejectionReasonInput);
      setSuccessMsg("O convite de reunião foi recusado e arquivado com o motivo.");
      setRejectingMeetingId(null);
      setRejectionReasonInput("");
      const m = await api.meetings.listByProject(id!);
      setMeetings(m || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao recusar reunião.");
    } finally {
      setSubmittingRejection(false);
    }
  };

  // Submission restricted only to students
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "Student") {
      setErrorMsg("Apenas alunos vinculados ao TCC podem submeter novos arquivos de entrega.");
      return;
    }
    if (project?.status !== "Active") {
      setErrorMsg("O projeto não está em andamento (Ativo). Novas submissões de arquivos não são permitidas.");
      return;
    }
    if (!file) {
      setErrorMsg("Selecione um arquivo válido para anexar.");
      return;
    }
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", id!);
      formData.append("taskId", "all-workspace"); // general workspace upload
      await api.submissions.create(formData);
      setFile(null);
      setSuccessMsg("Arquivo de TCC entregue com sucesso!");
      const s = await api.submissions.listByProject(id!);
      setSubmissions(s || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSubmission = async (subId: string, fileName: string) => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const blob = await api.submissions.download(subId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccessMsg("Download iniciado com sucesso!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Não foi possível baixar o arquivo.");
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!project) return <div className="p-8">Projeto não encontrado</div>;

  // Evaluation states
  const isLocked = project.inviteStatus === "Pending";
  const canApprove = (user?.role === "Admin" || (user?.role === "Professor" && project.teacherId === user.id)) && project.status === "Aguardando avaliação";
  const canComplete = (user?.role === "Admin" || (user?.role === "Student" && project.studentId === user.id)) && project.status === "Active";
  const canToggleTask = (user?.role === "Admin" || (user?.role === "Student" && project.studentId === user.id)) && project.status === "Active";

  return (
    <div className="flex flex-col gap-6">
      {/* Messages banner */}
      {(successMsg || errorMsg) && (
        <div className="space-y-2">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold uppercase tracking-wider">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BookOpen className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <button onClick={() => window.history.back()} className="text-slate-400 hover:text-brand-primary mb-6 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest transition-colors bg-transparent border-0 cursor-pointer outline-none">
            <ArrowLeft className="w-3 h-3" /> Voltar aos projetos
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-[0.6rem] font-black uppercase tracking-[0.2em] border border-slate-800">
                  TCC · {new Date(project.createdAt).getFullYear()}
                </span>
                <span className="text-slate-300 text-[10px] font-bold uppercase tracking-tighter">Iniciado em {new Date(project.createdAt).toLocaleDateString()}</span>
                {project.status === "Aguardando avaliação" && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[0.55rem] font-bold uppercase tracking-widest border border-amber-200">
                    Aguardando Avaliação
                  </span>
                )}
                {project.status === "Completed" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[0.55rem] font-bold uppercase tracking-widest border border-emerald-200">
                    Registro Concluído (Histórico)
                  </span>
                )}
                {project.isApproved && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[0.55rem] font-bold uppercase tracking-widest border border-blue-200 flex items-center gap-1">
                    ✓ Publicado no Catálogo
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight pr-4 uppercase">
                {project.title}
              </h1>
              <p className="text-slate-500 text-sm max-w-2xl font-medium pt-1">{project.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status de Conclusão</p>
                <p className="text-3xl font-extrabold text-brand-primary leading-none">
                  {Math.round((tasks.filter(t => t.status === "Completed").length / (tasks.length || 1)) * 100)}<span className="text-base text-slate-300 ml-0.5">%</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation or Completed Banner Alerts */}
      {isLocked ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-lg flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-500 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">Aguardando Aprovação do Convite de Orientação</h4>
              <p className="text-slate-500 text-xs mt-0.5">O projeto precisa de aceitação inicial do professor orientador antes do início do cronograma.</p>
            </div>
          </div>
          {project.teacherId === user?.id && (
            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => handleRespondInvite("reject")}
                className="flex-1 md:flex-initial px-4 py-2 bg-white text-rose-700 rounded border border-rose-200 text-[0.65rem] font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors"
              >
                Recusar Convite
              </button>
              <button
                onClick={() => handleRespondInvite("accept")}
                className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 text-white rounded shadow-md text-[0.65rem] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                Aceitar Orientação
              </button>
            </div>
          )}
        </div>
      ) : project.status === "Aguardando avaliação" ? (
        <div className="bg-blue-50/70 border border-blue-200 text-blue-900 p-6 rounded-lg flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-tight">Aguardando Avaliação Final</h4>
              <p className="text-slate-600 text-xs mt-0.5">
                {user?.role === "Student"
                  ? "Seu trabalho de TCC foi concluído e enviado com sucesso! Agora aguarda a avaliação e aprovação final de seu orientador."
                  : "Este trabalho de TCC foi concluído pelo aluno e está aguardando sua avaliação final para aprovação."}
              </p>
            </div>
          </div>
          {canApprove && (
            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={handleReproveProject}
                className="w-full md:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[0.65rem] uppercase tracking-widest rounded shadow-md border-0 cursor-pointer transition-all"
              >
                Reprovar Projeto
              </button>
              <button
                onClick={handleApproveCatalog}
                className="w-full md:w-auto px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-[0.65rem] uppercase tracking-widest rounded shadow-md border-0 cursor-pointer transition-all"
              >
                Aprovar e Concluir TCC
              </button>
            </div>
          )}
        </div>
      ) : project.status === "Completed" ? (
        <div className="bg-emerald-50/50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex gap-3 items-center text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p>Este trabalho de TCC foi concluído! O workspace permanece disponível para fins de histórico e consulta de arquivos.</p>
        </div>
      ) : null}

      {/* Main Content Workspace tabs */}
      {!isLocked && (
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg w-fit overflow-x-auto max-w-full">
          {["tasks", "submissions", "meetings", "communication"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded text-[0.65rem] font-bold uppercase tracking-wider transition-all border-0 bg-transparent cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === tab ? "bg-white text-brand-primary shadow-sm font-black" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <span>
                {tab === "tasks" ? "Tarefas e Milestones" : tab === "submissions" ? "Submissões de Arquivos" : tab === "meetings" ? "Reuniões" : "Comunicação e Dúvidas"}
              </span>

              {user?.role === "Professor" && tab === "meetings" && meetings.some((m: any) => m.status === "Aguardando") && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0 inline-block" title="Solicitação pendente" />
              )}

              {user?.role === "Professor" && tab === "communication" && messages.length > 0 && (messages[messages.length - 1].senderRole === "Student" || messages[messages.length - 1].senderId === project?.studentId) && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 inline-block" title="Mensagem pendente" />
              )}

              {user?.role === "Student" && tab === "tasks" && studentHasUnreadFeedback && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 inline-block" title="Feedback pendente" />
              )}

              {user?.role === "Student" && tab === "meetings" && studentHasUnreadMeetingResponse && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0 inline-block" title="Resposta de reunião pendente" />
              )}

              {user?.role === "Student" && tab === "communication" && studentHasUnreadMessage && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 inline-block" title="Mensagem de dúvida respondida" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {isLocked ? (
            <div className="bg-white rounded-lg border border-slate-200 p-16 text-center shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Workspace Bloqueado</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                As tarefas, marcos cronológicos e área de envios estarão disponíveis assim que o convite de orientação de TCC for aceito pelo professor orientador.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  {user?.role === "Student" && tasks.some((t: any) => t.status === "Completed" && t.feedback && t.feedback.trim() !== "") && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                      <span>Mensagem de Feedback: Seu professor orientador enviou novos comentários ou feedbacks sobre as suas entregas no cronograma abaixo.</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cronograma de Entrega</h3>
                    {project.status === "Active" && (user?.role === "Student" || user?.role === "Admin") && (
                      <button 
                        onClick={() => setShowTaskForm(true)}
                        className="px-3 py-1.5 bg-brand-primary text-white rounded font-bold text-[0.65rem] uppercase tracking-widest hover:bg-brand-primary-dark transition-colors border-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" /> NOVO MARCO
                      </button>
                    )}
                  </div>

                  {tasks.length === 0 && (
                    <div className="py-12 bg-white rounded-lg border border-slate-200 border-dashed text-center">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma tarefa definida no cronograma</p>
                    </div>
                  )}

                  {tasks.map((task) => (
                    <motion.div
                      layout
                      key={task.id}
                      className={cn(
                        "group bg-white p-5 rounded-lg border transition-all hover:border-brand-accent shadow-sm",
                        task.status === "Completed" ? "border-emerald-100 bg-emerald-50/10" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => handleToggleStatus(task)}
                          disabled={!canToggleTask}
                          className={cn(
                            "mt-0.5 transition-colors bg-transparent border-0 cursor-pointer",
                            task.status === "Completed" ? "text-emerald-500" : "text-slate-300 hover:text-brand-primary",
                            !canToggleTask && "cursor-not-allowed opacity-50 hover:text-slate-300"
                          )}
                        >
                          {task.status === "Completed" ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 border-2 border-slate-100 rounded-full" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <h4 className={cn("font-bold text-[1.05rem] tracking-tight uppercase leading-snug", task.status === "Completed" ? "text-slate-300 line-through" : "text-slate-800")}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded shrink-0">
                              <CalendarDays className="w-3 h-3" />
                              Prazo: {new Date(task.deadline).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-slate-500 text-[0.8rem] leading-relaxed mb-4">{task.description}</p>
                          
                          <div className="flex items-center gap-5 mt-2">
                            <button
                              type="button"
                              onClick={() => toggleFeedback(task.id)}
                              className="flex items-center gap-1.5 text-[0.65rem] font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200/50 rounded px-2.5 py-1.5 transition-all cursor-pointer bg-white shadow-sm font-black uppercase tracking-widest"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              Feedback {task.feedback ? "(✓ Visualizar)" : ""}
                            </button>
                          </div>

                          {expandedFeedbacks[task.id] && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                              {task.status !== "Completed" ? (
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider italic bg-slate-50 p-3 rounded text-center border border-slate-150">
                                  ⚠️ Os feedbacks só podem ser atribuídos a marcos e tarefas marcadas como concluídas (feitas).
                                </p>
                              ) : (
                                <>
                                  {/* Read-only view for those who are NOT the supervisor */}
                                  {!(user?.role === "Professor" && project.teacherId === user?.id) ? (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                      <h5 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest mb-2 font-black">Feedback do Professor Orientador</h5>
                                      {task.feedback ? (
                                        <p className="text-xs text-slate-700 bg-white p-3.5 rounded border border-slate-200/60 font-medium whitespace-pre-wrap">
                                          {task.feedback}
                                        </p>
                                      ) : (
                                        <p className="text-slate-400 text-xs italic">Ainda não há feedback do professor orientador para este marco.</p>
                                      )}
                                    </div>
                                  ) : (
                                    /* Interactive editor view for the advisor */
                                    <div className="bg-indigo-50/30 p-4 rounded-lg border border-indigo-100 space-y-3">
                                      <h5 className="text-[0.65rem] font-black text-indigo-900/60 uppercase tracking-widest font-black">Feedback de Orientação (Exclusivo Orientador)</h5>
                                      
                                      {task.feedback && (
                                        <div className="space-y-1.5">
                                          <label className="block text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">Feedback Atual:</label>
                                          <p className="text-xs text-slate-700 bg-white p-3 rounded border border-slate-200/60 font-medium whitespace-pre-wrap">
                                            {task.feedback}
                                          </p>
                                        </div>
                                      )}

                                      <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <label className="block text-[0.65rem] font-bold text-indigo-950 uppercase tracking-widest">
                                          {task.feedback ? "Editar ou Atualizar Feedback" : "Cadastrar Novo Feedback"}
                                        </label>
                                        <textarea
                                          rows={3}
                                          value={taskFeedbackInputs[task.id] !== undefined ? taskFeedbackInputs[task.id] : (task.feedback || "")}
                                          onChange={(e) => setTaskFeedbackInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                          placeholder="Digite aqui o feedback para este marco concluído..."
                                          className="w-full p-2.5 text-xs rounded border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-brand-accent/20 text-slate-800"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            disabled={submittingFeedback[task.id] || !(taskFeedbackInputs[task.id] !== undefined ? taskFeedbackInputs[task.id] : (task.feedback || "")).trim()}
                                            onClick={() => handleSaveTaskFeedback(task.id)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-[0.6rem] uppercase tracking-widest rounded shadow-sm border-0 cursor-pointer transition-all"
                                          >
                                            {submittingFeedback[task.id] ? "Salvando..." : "Enviar Feedback"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "submissions" && (
                <div className="space-y-6">
                  {/* Real file upload section */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Enviar Novo Arquivo de Entrega</h3>
                    
                    {user?.role === "Student" ? (
                      project.status === "Active" ? (
                        <form onSubmit={handleFileUpload} className="space-y-4">
                          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-brand-accent transition-colors relative bg-slate-50/50">
                            <input 
                              type="file" 
                              required
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setFile(e.target.files[0]);
                                }
                              }}
                            />
                            <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                              {file ? file.name : "Clique ou arraste para anexar o arquivo (PDF, ZIP, DOCX)"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tamanho máximo recomendado: 32MB</p>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={uploading}
                              className="px-5 py-2.5 bg-brand-primary text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-brand-primary-dark transition-colors border-0 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                              {uploading ? "Enviando arquivo..." : "Submeter Entrega"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-4">O projeto está em avaliação ou já concluído. Novas submissões de arquivos estão desativadas.</p>
                      )
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs font-medium text-center">
                        🔒 Apenas <strong>alunos</strong> podem submeter arquivos no projeto TCC. Outros papéis possuem acesso apenas de leitura aos arquivos enviados.
                      </div>
                    )}
                  </div>

                  {/* Submission logs list */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Histórico de Arquivos Submetidos</h3>
                    
                    {submissions.length === 0 ? (
                      <div className="text-center py-10">
                        <Paperclip className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma entrega efetuada ainda</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {submissions.map((sub: any) => (
                          <div key={sub.id} className="py-3.5 flex items-center justify-between gap-4 text-xs font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold uppercase tracking-tighter text-[9px] shrink-0 border border-indigo-100">
                                {sub.fileName.split('.').pop()?.toUpperCase() || 'ARQ'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate max-w-[13rem] sm:max-w-md lg:max-w-lg" title={sub.fileName}>{sub.fileName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Enviado por Aluno em {new Date(sub.submittedAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                                {sub.status || "Pendente"}
                              </span>
                              <button
                                onClick={() => handleDownloadSubmission(sub.id, sub.fileName)}
                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded border-0 shadow-sm cursor-pointer transition-all flex items-center justify-center"
                                title="Baixar arquivo submetido"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "meetings" && (
                <div className="space-y-6">
                  {user?.role === "Professor" && meetings.some((m: any) => m.status === "Aguardando") && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-950 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                      <span>Atenção Professor: Há solicitações de reuniões pendentes aguardando sua resposta.</span>
                    </div>
                  )}
                  {user?.role === "Student" && meetings.some((m: any) => m.status === "Aceita" || m.status === "Recusada") && (
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
                      <span>Atenção Aluno: Há novas respostas ou atualizações para as suas solicitações de reunião na agenda abaixo.</span>
                    </div>
                  )}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-indigo-600 animate-pulse" />
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Reuniões e Agendamentos</h3>
                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Solicite encontros presenciais ou virtuais com seu orientador</p>
                        </div>
                      </div>
                      
                      {user?.role === "Student" && project?.status === "Active" && !showMeetingForm && (
                        <button
                          onClick={() => setShowMeetingForm(true)}
                          className="px-4 py-2 bg-brand-primary text-white rounded font-black text-[0.6rem] uppercase tracking-widest hover:bg-brand-primary-dark transition-colors border-0 cursor-pointer w-full sm:w-auto"
                        >
                          <Plus className="w-3.5 h-3.5 inline mr-1" /> Solicitar Reunião
                        </button>
                      )}
                    </div>

                    {/* Solicitar Reunião Form */}
                    {showMeetingForm && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 border border-slate-200/60 p-5 rounded-lg mb-6 space-y-4 text-slate-800"
                      >
                        <h4 className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mb-2 font-black border-b border-slate-200/50 pb-1.5">
                          Nova Solicitação de Reunião
                        </h4>
                        <form onSubmit={handleCreateMeetingRequest} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">
                                Motivo da Reunião (Título) *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Alinhamento de Metodologia, Dúvida sobre Capítulo 2..."
                                value={newMeeting.title}
                                onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full p-2.5 text-xs rounded border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-brand-accent/20 text-slate-800"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">
                                Data e Horário Sugeridos *
                              </label>
                              <input
                                type="datetime-local"
                                required
                                value={newMeeting.dateTime}
                                onChange={(e) => setNewMeeting(prev => ({ ...prev, dateTime: e.target.value }))}
                                className="w-full p-2.5 text-xs rounded border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-brand-accent/20 text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[0.6rem] font-black text-slate-400 uppercase tracking-widest">
                              Descrição / Necessidade do Encontro
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Traga aqui detalhes, dúvidas específicas ou tópicos que deseja discutir para exemplificar a necessidade do encontro..."
                              value={newMeeting.description}
                              onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full p-2.5 text-xs rounded border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-brand-accent/20 text-slate-800"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowMeetingForm(false);
                                setNewMeeting({ title: "", description: "", dateTime: "" });
                              }}
                              className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded font-black text-[0.6rem] uppercase tracking-widest hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={sendingMeetingRequest}
                              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded font-black text-[0.6rem] uppercase tracking-widest disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              {sendingMeetingRequest ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                "Solicitar Reunião"
                              )}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Histórico de Reuniões */}
                    <div className="space-y-4">
                      <h4 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-3">Histórico de Reuniões</h4>
                      
                      {meetings.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-slate-200 border-dashed">
                          <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma reunião solicitada neste projeto</p>
                          <p className="text-slate-400 text-[10px] mt-1 font-medium">As solicitações e histórico de reuniões concluídas ficarão listados aqui.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {meetings.map((meeting: any) => {
                            const showProfessorActions = ((user?.role === "Professor" && project.teacherId === user?.id) || user?.role === "Admin") && meeting.status === "Aguardando";
                            const formattedDate = new Date(meeting.dateTime).toLocaleString();

                            return (
                              <motion.div
                                layout
                                key={meeting.id}
                                className={cn(
                                  "p-5 rounded-lg border bg-white shadow-xs space-y-3.5 transition-all text-slate-800",
                                  meeting.status === "Aguardando" 
                                    ? "border-amber-100 bg-amber-50/10" 
                                    : meeting.status === "Aceita" 
                                    ? "border-emerald-100 bg-emerald-50/5" 
                                    : "border-slate-200 bg-slate-50/20 opacity-85"
                                )}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100/60 pb-3">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h5 className="font-extrabold text-xs text-slate-900 pr-1 uppercase">
                                        {meeting.title}
                                      </h5>
                                      
                                      {meeting.status === "Aguardando" && (
                                        <span className="px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-widest border border-amber-200 bg-amber-50 text-amber-700 animate-pulse">
                                          Aguardando Confirmação
                                        </span>
                                      )}
                                      {meeting.status === "Aceita" && (
                                        <span className="px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-700">
                                          Confirmada / Pendente
                                        </span>
                                      )}
                                      {meeting.status === "Recusada" && (
                                        <span className="px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-widest border border-slate-200 bg-slate-100 text-slate-500">
                                          Recusada & Arquivada
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                      <CalendarDays className="w-3.5 h-3.5 text-indigo-500/80" />
                                      Sugerido para: <span className="text-slate-700 font-extrabold">{formattedDate}</span>
                                    </div>
                                  </div>

                                  <span className="text-[9px] font-bold text-slate-400 capitalize self-start shrink-0">
                                    Solicitada em: {new Date(meeting.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {meeting.description && (
                                  <div className="space-y-1">
                                    <span className="block text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">Descrição detalhada:</span>
                                    <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded border border-slate-100 font-medium leading-relaxed whitespace-pre-wrap">
                                      {meeting.description}
                                    </p>
                                  </div>
                                )}

                                {/* If rejected, show the rejectionReason */}
                                {meeting.status === "Recusada" && (
                                  <div className="mt-2.5 pt-3 border-t border-dashed border-red-100 space-y-1.5">
                                    <span className="block text-[0.55rem] font-black text-rose-600 uppercase tracking-widest">
                                      ⚠️ Motivo da Recusa (Justificativa do Orientador):
                                    </span>
                                    <p className="text-xs text-rose-800 bg-rose-50/40 p-3.5 rounded border border-rose-100 font-bold whitespace-pre-wrap leading-relaxed">
                                      {meeting.rejectionReason}
                                    </p>
                                  </div>
                                )}

                                {/* Advisor action buttons for pending decisions */}
                                {showProfessorActions && (
                                  <div className="pt-3 border-t border-slate-100 space-y-3.5">
                                    {rejectingMeetingId === meeting.id ? (
                                      <div className="space-y-2.5 bg-rose-50/30 p-3.5 rounded border border-rose-100">
                                        <label className="block text-[0.6rem] font-black text-rose-900/60 uppercase tracking-widest">
                                          Justificativa do Cancelamento / Recusa
                                        </label>
                                        <textarea
                                          required
                                          rows={2}
                                          placeholder="Informe o motivo para recusar esta reunião (ex: choque de horários, necessidade de entrega prévia...)"
                                          value={rejectionReasonInput}
                                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                                          className="w-full p-2 text-xs rounded border border-rose-200 bg-white font-medium outline-none focus:ring-2 focus:ring-rose-500/10 text-slate-800"
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setRejectingMeetingId(null);
                                              setRejectionReasonInput("");
                                            }}
                                            className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded font-bold text-[0.55rem] uppercase tracking-widest hover:bg-slate-50 cursor-pointer"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            type="button"
                                            disabled={submittingRejection}
                                            onClick={handleRejectMeetingSubmit}
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[0.55rem] uppercase tracking-widest disabled:opacity-50 cursor-pointer flex items-center gap-1 border-0"
                                          >
                                            {submittingRejection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Recusa"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setRejectingMeetingId(meeting.id)}
                                          className="px-4 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50/50 rounded font-black text-[0.55rem] uppercase tracking-widest cursor-pointer transition-all"
                                        >
                                          Recusar Reunião
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleAcceptMeeting(meeting.id)}
                                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm border-0 font-black text-[0.55rem] uppercase tracking-widest cursor-pointer transition-all"
                                        >
                                          ✓ Aceitar Reunião
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "communication" && (
                <div className="space-y-6">
                  {user?.role === "Professor" && messages.length > 0 && (messages[messages.length - 1].senderRole === "Student" || messages[messages.length - 1].senderId === project?.studentId) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <span>Atenção Professor: Há uma nova mensagem ou dúvida enviada pelo aluno que requer sua atenção.</span>
                    </div>
                  )}
                  {user?.role === "Student" && messages.length > 0 && (messages[messages.length - 1].senderRole === "Professor" || messages[messages.length - 1].senderRole === "Admin" || messages[messages.length - 1].senderId === project?.teacherId) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <span>Atenção Aluno: Há uma nova resposta do seu professor orientador no canal de dúvidas abaixo.</span>
                    </div>
                  )}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                      <MessageSquare className="w-5 h-5 text-indigo-600 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Canal de Comunicação e Dúvidas</h3>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Espaço para esclarecer dúvidas diretamente com o professor orientador</p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 p-4 bg-slate-50/50 rounded-lg border border-slate-100 flex flex-col gap-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-10 my-auto">
                          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma mensagem trocada ainda</p>
                          <p className="text-slate-400 text-[10px] mt-1 font-medium">Inicie a conversa enviando sua dúvida ao professor orientador.</p>
                        </div>
                      ) : (
                        messages.map((msg: any) => {
                          const isOwn = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex flex-col max-w-[85%] rounded-lg p-3 text-xs",
                                isOwn
                                  ? "bg-indigo-600 text-white self-end rounded-tr-none shadow-sm"
                                  : msg.senderRole === "Professor"
                                  ? "bg-amber-50 border border-amber-200 text-amber-900 self-start rounded-tl-none shadow-sm"
                                  : "bg-slate-100 text-slate-800 self-start rounded-tl-none shadow-sm"
                              )}
                            >
                              <div className="flex items-center justify-between gap-4 mb-1 border-b border-black/5 pb-0.5">
                                <span className={cn("font-bold text-[10px] uppercase tracking-wide", isOwn ? "text-indigo-100" : "text-slate-500")}>
                                  {msg.senderName} {msg.senderRole === "Professor" && "⭐ orientador"}
                                </span>
                                <span className={cn("text-[9px] font-medium opacity-70", isOwn ? "text-indigo-200" : "text-slate-400")}>
                                  {new Date(msg.sentAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="leading-relaxed break-words font-medium whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Input */}
                    {user?.role === "Admin" ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs font-medium text-center">
                        🔒 Os administradores do sistema têm acesso de apenas leitura a este canal. Não é permitido enviar mensagens.
                      </div>
                    ) : (() => {
                      const isStudent = user?.role === "Student";
                      const studentBlocked = isStudent && messages.length > 0 && (messages[messages.length - 1].senderRole === "Student" || messages[messages.length - 1].senderId === project.studentId);
                      
                      if (studentBlocked) {
                        return (
                          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded text-amber-900 text-xs font-bold uppercase tracking-wider text-center">
                            ⏳ Aguardando resposta do professor orientador para a dúvida anterior. Você só poderá enviar outra mensagem após ele responder.
                          </div>
                        );
                      }

                      return (
                        <form onSubmit={handleSendMessage} className="space-y-3">
                          <div>
                            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sua Mensagem</label>
                            <textarea
                              rows={3}
                              required
                              value={newMessageText}
                              onChange={(e) => setNewMessageText(e.target.value)}
                              placeholder={isStudent ? "Digite sua dúvida para o professor..." : "Escreva uma resposta para o aluno..."}
                              className="w-full px-3.5 py-2.5 text-xs rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none bg-white font-medium resize-none shadow-sm placeholder:text-slate-400 text-slate-800"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={sendingMessage || !newMessageText.trim()}
                              className="w-full sm:w-auto px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-black text-[0.65rem] uppercase tracking-widest rounded shadow-md border-0 cursor-pointer transition-all flex items-center justify-center gap-2"
                            >
                              {sendingMessage ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Enviar Mensagem
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Workspace Sidebar with Rules Interaction */}
        <div className="space-y-6">
          {/* Main orientation and admin controls card */}
          <div className="bg-brand-sidebar rounded-lg p-6 text-white shadow-xl shadow-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-4">Controle do TCC</h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-wider">Autor (Aluno)</p>
                    <p className="text-xs font-extrabold text-slate-200 leading-tight">{project.studentName || "Aluno"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-wider">Professor Orientador</p>
                    <p className="text-xs font-extrabold text-slate-200 leading-tight">{project.teacherName || "Aguardando aceitação..."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for complete and approve */}
            {!isLocked && (canApprove || canComplete) && (
              <div className="border-t border-slate-800 pt-5 mt-6 space-y-3">
                <p className="text-[0.55rem] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Ações de Controle</p>
                
                {canComplete && (
                  <button
                    onClick={handleCompleteProject}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded font-black text-[0.65rem] uppercase tracking-widest hover:bg-emerald-700 transition-colors border-0 cursor-pointer shadow-md"
                  >
                    Concluir TCC
                  </button>
                )}

                {canApprove && (
                  <div className="space-y-2 w-full">
                    <button
                      onClick={handleReproveProject}
                      className="w-full bg-rose-600 text-white py-2.5 rounded font-black text-[0.65rem] uppercase tracking-widest hover:bg-rose-700 transition-colors border-0 cursor-pointer shadow-md"
                    >
                      Reprovar Projeto
                    </button>
                    <button
                      onClick={handleApproveCatalog}
                      className="w-full bg-blue-600 text-white py-2.5 rounded font-black text-[0.65rem] uppercase tracking-widest hover:bg-blue-700 transition-colors border-0 cursor-pointer shadow-md"
                    >
                      Aprovar Projeto
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
             <h4 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-4">Bibliotecas & Manuais</h4>
             <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-600 hover:text-brand-primary cursor-pointer group transition-all">
                  <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors italic font-serif">M</div>
                  <div>
                    <p className="text-[0.7rem] font-bold leading-tight">Manual do Aluno</p>
                    <p className="text-[0.6rem] text-slate-400 uppercase font-bold tracking-tighter">Documento PDF</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-slate-600 hover:text-brand-primary cursor-pointer group transition-all">
                  <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors font-mono">T</div>
                  <div>
                    <p className="text-[0.7rem] font-bold leading-tight">Template ABNT</p>
                    <p className="text-[0.6rem] text-slate-400 uppercase font-bold tracking-tighter">Arquivo DOCX</p>
                  </div>
                </li>
             </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTaskForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl border border-slate-200"
            >
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight uppercase">Definir Marco de Entrega</h2>
              <form onSubmit={handleCreateTask} className="space-y-5 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Identificação da Tarefa</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none"
                    placeholder="Ex: Introdução e Metodologia"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Atribuições & Objetivos</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none"
                    placeholder="Especifique o que deve ser entregue..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Vencimento do Prazo</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 rounded border border-slate-200 focus:ring-2 focus:ring-brand-accent/20 outline-none font-medium"
                    value={newTask.deadline}
                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 py-2.5 rounded border border-slate-200 font-bold hover:bg-slate-50 transition-colors text-[0.7rem] uppercase tracking-widest"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-brand-primary text-white py-2.5 rounded font-bold shadow-lg shadow-slate-200 text-[0.7rem] uppercase tracking-widest hover:bg-brand-primary-dark transition-colors"
                  >
                    Publicar Marco
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookOpen(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  );
}

function FileText(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  );
}
