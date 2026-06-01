import { useState, useEffect } from "react";
import { api } from "@/src/lib/api";
import { Search, Filter, Book, ExternalLink, GraduationCap, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/src/App";

interface PublicCatalogProps {
  standalone?: boolean;
}

export function PublicCatalog({ standalone = false }: PublicCatalogProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const canAccessProjectDetails = (project: any) => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "Student" && project.studentId === user.id) return true;
    if (user.role === "Professor" && project.teacherId === user.id) return true;
    return false;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [projectsData, instData, coursesData] = await Promise.all([
          api.projects.list({ public: "true" }),
          api.institutions.list(),
          api.courses.list()
        ]);
        setProjects(projectsData || []);
        setInstitutions(instData || []);
        setCourses(coursesData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstitution = !selectedInstitution || p.institutionId === selectedInstitution;
    const matchesCourse = !selectedCourse || p.courseId === selectedCourse;
    const matchesStatus = !selectedStatus || p.status === selectedStatus;
    
    return matchesSearch && matchesInstitution && matchesCourse && matchesStatus;
  });

  const content = (
    <div className={cn("flex flex-col gap-6", standalone ? "max-w-7xl mx-auto px-4 py-12" : "p-6")}>
      <div className={cn("text-center", standalone ? "mb-16" : "mb-6 text-left bg-white p-8 rounded-lg border border-slate-200 shadow-sm")}>
        <h2 className={cn("font-display font-extrabold text-slate-900 tracking-tight uppercase", standalone ? "text-4xl mb-4" : "text-xl mb-1")}>
          Repositório <span className="text-brand-accent">Acadêmico</span>
        </h2>
        <p className="text-slate-400 font-medium text-sm max-w-2xl">
          Explore trabalhos de conclusão de curso publicados por nossos alunos e pesquisadores.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por título, autor, palavras-chave..."
              className="w-full pl-12 pr-4 py-3 rounded border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all text-sm font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-6 py-3 border rounded font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm",
              showFilters ? "bg-brand-sidebar text-white border-brand-sidebar" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className={cn("w-4 h-4", showFilters ? "text-brand-accent" : "text-slate-400")} />
            {showFilters ? "Fechar Filtros" : "Filtros"}
          </button>
        </div>

        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-lg shadow-inner mb-4"
          >
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Instituição</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-medium outline-none focus:border-brand-accent bg-slate-50/50"
                value={selectedInstitution}
                onChange={e => setSelectedInstitution(e.target.value)}
              >
                <option value="">Todas as Instituições</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Curso</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-medium outline-none focus:border-brand-accent bg-slate-50/50"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
              >
                <option value="">Todos os Cursos</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Estado (Status)</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-medium outline-none focus:border-brand-accent bg-slate-50/50"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="">Todos os estados</option>
                <option value="Active">Ativo / Em curso</option>
                <option value="Aguardando avaliação">Aguardando Avaliação</option>
                <option value="Completed">Concluído</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-accent border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando acervo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-lg border border-slate-200 border-dashed">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum TCC encontrado para os filtros aplicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project, i) => {
            const hasAccess = canAccessProjectDetails(project);
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={project.id}
                onClick={() => {
                  if (hasAccess) {
                    navigate(`/projects/${project.id}`);
                  }
                }}
                className={cn(
                  "bg-white rounded-lg p-6 border border-slate-200 shadow-sm transition-all group flex flex-col",
                  hasAccess 
                    ? "hover:shadow-md hover:border-brand-primary cursor-pointer animate-none" 
                    : "hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest border",
                    project.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : (project.status === "Aguardando avaliação" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100")
                  )}>
                     {project.status === "Completed" ? "CONCLUÍDO" : (project.status === "Aguardando avaliação" ? "AVALIAÇÃO" : "ATIVO")}
                  </span>
                  <div className="flex items-center gap-1 text-[0.6rem] font-bold text-slate-300 uppercase tracking-[0.2em]">
                    <Calendar className="w-3 h-3" /> {new Date(project.createdAt).getFullYear()}
                  </div>
                </div>
                
                <h3 className="text-lg font-extrabold text-slate-800 h-14 line-clamp-2 leading-tight mb-3 group-hover:text-brand-primary transition-colors uppercase tracking-tight">
                  {project.title}
                </h3>
                
                <p className="text-slate-500 text-[0.8rem] line-clamp-3 mb-6 leading-relaxed flex-1">
                  {project.description}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto border-0 border-solid">
                   <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-slate-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Autor(a) / Curso</p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {project.studentName || "Estudante"}
                      </p>
                      <p className="text-[0.65rem] font-medium text-slate-400 truncate">
                        {courses.find(c => c.id === project.courseId)?.name || project.courseName || "TCC Geral"}
                      </p>
                   </div>
                   {hasAccess && (
                     <button className="p-2 text-brand-primary bg-slate-50 rounded hover:bg-brand-primary hover:text-white transition-all shadow-sm cursor-pointer border-0">
                        <ExternalLink className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!standalone) return content;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-sidebar border-b border-white/10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <h1 className="text-xl font-display font-extrabold text-white tracking-tight">
               TCC<span className="text-brand-accent">Repo</span>
             </h1>
           </div>
           <div className="flex items-center gap-4">
             <button 
               onClick={() => window.history.back()} 
               className="text-[0.65rem] font-bold text-white/50 uppercase tracking-widest hover:text-white transition-colors"
             >
               Voltar ao Acesso
             </button>
           </div>
        </div>
      </header>

      {content}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
