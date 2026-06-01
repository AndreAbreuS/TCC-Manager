import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useUser } from "@/src/App";
import { api } from "@/src/lib/api";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Building, 
  GraduationCap, 
  Lock, 
  Camera, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  UserCheck
} from "lucide-react";
import { motion } from "motion/react";

export function Profile() {
  const { user, updateUser } = useUser();
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Fields state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Readonly fields info
  const [profileData, setProfileData] = useState<any>(null);
  
  // Message statuses
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Eye toggles for passwords
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.profile.get();
      setProfileData(res);
      setName(res.name || "");
      if (res.photo) {
        setPhotoPreview(res.photo);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Não foi possível carregar as informações do seu perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("O nome de usuário não pode estar em branco.");
      return;
    }

    if (password) {
      if (password.length < 8) {
        setErrorMsg("A nova senha deve ter no mínimo 8 caracteres.");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setErrorMsg("A nova senha deve conter pelo menos uma letra maiúscula.");
        return;
      }
      if (!/[a-z]/.test(password)) {
        setErrorMsg("A nova senha deve conter pelo menos uma letra minúscula.");
        return;
      }
      if (!/[0-9]/.test(password)) {
        setErrorMsg("A nova senha deve conter pelo menos um número (algarismo).");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("A confirmação de senha não corresponde à nova senha informada.");
        return;
      }
    }

    setSaving(true);
    try {
      let response;
      if (photoFile) {
        // Multipart/form-data update
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("photo", photoFile);
        if (password) {
          formData.append("password", password.trim());
        }
        response = await api.profile.update(formData);
      } else {
        // Plain json update
        const payload: any = { name: name.trim() };
        if (password) {
          payload.password = password.trim();
        }
        response = await api.profile.update(payload);
      }

      // Update both frontend and storage cached state
      updateUser(response);
      setProfileData(response);
      
      // Clear password fields
      setPassword("");
      setConfirmPassword("");
      setPhotoFile(null);
      
      setSuccessMsg("Informações do seu perfil atualizadas com sucesso!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocorreu um erro ao tentar salvar as alterações do perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Carregando seu perfil...</p>
      </div>
    );
  }

  // Generate fallback avatar text
  const initials = name?.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <User className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          
          {/* Large Avatar container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner flex items-center justify-center bg-brand-primary text-white text-3xl font-black">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt={name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              ) : (
                initials
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg cursor-pointer transition-colors border-2 border-white">
              <Camera className="w-4 h-4" />
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="text-center md:text-left space-y-1 flex-1">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[0.6rem] font-black uppercase tracking-widest border border-slate-800">
                TCC Manager · Perfil de Usuário
              </span>
              {profileData?.role === "Admin" && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[0.55rem] font-bold uppercase tracking-widest border border-rose-200">
                  Administrador
                </span>
              )}
              {profileData?.role === "Professor" && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[0.55rem] font-bold uppercase tracking-widest border border-indigo-200">
                  Professor Orientador
                </span>
              )}
              {profileData?.role === "Student" && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[0.55rem] font-bold uppercase tracking-widest border border-amber-200">
                  Aluno
                </span>
              )}
            </div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
              {profileData?.name}
            </h1>
            <p className="text-slate-400 text-xs font-semibold">{profileData?.email}</p>
          </div>
        </div>
      </div>

      {/* Message Notifications */}
      {(successMsg || errorMsg) && (
        <div className="space-y-2">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Profile Settings Form */}
      <form onSubmit={handleUpdateProfile} className="max-w-3xl mx-auto">
        
        {/* Profile Card Container (RF-18) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Informações do Perfil
            </h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Configure seus dados pessoais e confira suas credenciais institucionais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username / Name Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo / Exibição</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Insira seu nome de exibição..."
              />
            </div>

            {/* E-mail (disabled) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                E-mail Institucional <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input 
                type="email"
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed font-semibold text-slate-500"
                value={profileData?.email || ""}
              />
            </div>

            {/* Access Role (disabled select) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Perfil de Acesso <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <select
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed font-semibold text-slate-500"
                value={profileData?.role || ""}
              >
                <option value="Student">Aluno (Student)</option>
                <option value="Professor">Professor (Professor)</option>
                <option value="Admin">Administrador (Admin)</option>
              </select>
            </div>

            {/* Institution (disabled select) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Instituição Vinculada <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <select
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed font-semibold text-slate-500"
                value={profileData?.institutionId || ""}
              >
                <option value={profileData?.institutionId || ""}>{profileData?.institutionName || "Não Vinculada"}</option>
              </select>
            </div>

            {/* Course (disabled select, only if student) */}
            {profileData?.role === "Student" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Curso Acadêmico <Lock className="w-3 h-3 text-slate-400" />
                </label>
                <select
                  disabled
                  className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed font-semibold text-slate-500"
                  value={profileData?.courseId || ""}
                >
                  <option value={profileData?.courseId || ""}>{profileData?.courseName || "Não Vinculado"}</option>
                </select>
              </div>
            )}

            {/* Divider line before password fields */}
            <div className="md:col-span-2 border-t border-slate-100 my-2" />

            {/* password */}
            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Nova Senha <span className="text-[9px] text-slate-400 font-medium lowercase">(opcional - mín. 8 caracteres, com A-Z, a-z e número)</span>
              </label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  className="w-full pl-4 pr-10 py-2.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 8 carac. (letras maiús., minús. e algarismos)"
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* confirm password */}
            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</label>
              <div className="relative">
                <input 
                  type={showConfirmPass ? "text" : "password"}
                  disabled={!password}
                  className="w-full pl-4 pr-10 py-2.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha..."
                />
                <button 
                  type="button"
                  disabled={!password}
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer disabled:opacity-0"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-50">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer border-0 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
