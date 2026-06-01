import { useState, useEffect } from "react";
import { useUser } from "@/src/App";
import { api } from "@/src/lib/api";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  Users
} from "lucide-react";
import { motion } from "motion/react";

export function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projects = await api.projects.list();
        // Simple client-side stats for now
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p: any) => p.status === "Active").length,
          completedProjects: projects.filter((p: any) => p.status === "Completed").length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Projetos Ativos", value: stats?.activeProjects || 0, color: "text-slate-900" },
    { label: "Pendentes Avaliação", value: 12, color: "text-amber-500" }, // Mocked
    { label: "Atrasos Críticos", value: 5, color: "text-red-500" }, // Mocked
    { label: "Concluídos", value: stats?.completedProjects || 0, color: "text-emerald-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col gap-1 shadow-sm"
          >
            <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
            <span className={cn("text-2xl font-extrabold", card.color)}>{card.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Acompanhamento de Projetos</h3>
            <button className="text-[0.7rem] px-3 py-1.5 bg-brand-primary text-white rounded font-bold hover:bg-brand-primary-dark transition-colors">
              Exportar Relatório
            </button>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Projeto</th>
                  <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Progresso</th>
                  <th className="px-5 py-3 text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">Título Exemplo do TCC {i + 1}</p>
                      <p className="text-xs text-slate-400">Aluno Exemplo • Prof. Orientador</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent rounded-full" style={{ width: `${20 * (i + 1)}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700">
                        Em curso
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Atividade Recente</h3>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map((_, i) => (
              <div key={i} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">Há {i + 1} horas</span>
                <p className="text-[0.8rem] text-slate-600 leading-tight">
                  <strong className="text-slate-800 font-bold">Prof. Ricardo</strong> enviou feedback para <strong className="text-slate-800 font-bold">Carla Dias</strong> no projeto Blockchain.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
