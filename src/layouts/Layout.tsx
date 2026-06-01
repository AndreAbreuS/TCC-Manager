import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "@/src/App";
import { api } from "@/src/lib/api";
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut, 
  Search, 
  Users, 
  CheckSquare, 
  Calendar,
  Building
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

export function Layout() {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const projects = await api.projects.list();
        
        if (user.role === "Professor") {
          const pending = projects.some((p: any) => p.inviteStatus === "Pending" && p.teacherId === user.id);
          setHasNotification(pending);
        } else if (user.role === "Student") {
          const hasUnread = projects.some((p: any) => {
            const viewedFeedback = localStorage.getItem(`tcc_viewed_feedback_${p.id}`) || "";
            const viewedMeeting = localStorage.getItem(`tcc_viewed_meeting_${p.id}`) || "";
            const viewedMessage = localStorage.getItem(`tcc_viewed_message_${p.id}`) || "";

            const hasNewFeedback = p.hasFeedbackOnTasks && p.latestFeedbackAt && p.latestFeedbackAt > viewedFeedback;
            const hasNewMeetingResponse = p.hasMeetingResponse && p.latestMeetingResponseAt && p.latestMeetingResponseAt > viewedMeeting;
            const hasNewMessage = p.hasNewMessageFromTeacher && p.latestMessageAt && p.latestMessageAt > viewedMessage;

            return hasNewFeedback || hasNewMeetingResponse || hasNewMessage;
          });
          setHasNotification(hasUnread);
        } else {
          setHasNotification(false);
        }
      } catch (e) {
        console.error("Error fetching projects in sidebar:", e);
      }
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 15000); // Check every 15s to keep it updated
    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Explorar", icon: Search, path: "/explore" },
  ];

  if (user?.role !== "Admin") {
    menuItems.splice(1, 0, { label: "Projetos", icon: BookOpen, path: "/projects" });
  }

  if (user?.role === "Admin") {
    menuItems.push({ label: "Administração", icon: Settings, path: "/admin" });
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 border-0">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-sidebar text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-display font-extrabold tracking-tight">
            TCC<span className="text-brand-accent">Manager</span>
          </h1>
        </div>

        <nav className="flex-1 py-6 space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-[0.9rem] transition-all group relative",
                location.pathname === item.path
                  ? "bg-white/5 text-white border-l-4 border-brand-accent"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                location.pathname === item.path ? "text-brand-accent" : "text-slate-500 group-hover:text-slate-300"
              )} />
              <span className="font-medium">{item.label}</span>
              {item.label === "Projetos" && hasNotification && (
                <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse tracking-wide">
                  NOVO
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10 text-[0.75rem] text-white/30 font-medium">
          v1.2.0-stable
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-6">
          <div className="flex items-center text-sm font-medium">
            <span className="text-slate-400 mr-2">Gestão de Projetos /</span>
            <span className="text-slate-700">
              {location.pathname === "/profile" ? "Meu Perfil" : (menuItems.find(i => i.path === location.pathname)?.label || "Detalhes")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors group"
              title="Meu Perfil (RF-17)"
            >
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.name?.substring(0, 2).toUpperCase()
                )}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-transparent border-0 cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
