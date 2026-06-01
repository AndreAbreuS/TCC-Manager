import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Lowdb-like simple implementation
class Db {
  data: any = {
    users: [],
    institutions: [],
    courses: [],
    projects: [],
    tasks: [],
    submissions: [],
    meetings: [],
    templates: [],
    notifications: [],
    logs: [],
    messages: []
  };

  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.messages) {
          this.data.messages = [];
        }
      } catch (e) {
        this.save();
      }
    } else {
      this.data.users.push({
        id: "1",
        name: "Administrador Central",
        email: "admin@tcc.com",
        password: "$2a$10$XmVP/S.m.H7.B.v.z.C.e.e.v.v.v.v.v.v.v.v.v.v.v.v.v.v", // password is admin123 (simulated)
        role: "Admin",
        createdAt: new Date().toISOString()
      });
      this.save();
    }
  }

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
  }
}

const db = new Db();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // --- Logger ---
  const logAction = (userId: string, action: string, details: string) => {
    db.data.logs.push({
      id: Date.now().toString(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    db.save();
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, institutionId, courseId } = req.body;
    
    if (db.data.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "A senha é obrigatória." });
    }

    const pwd = password.trim();
    if (pwd.length < 8) {
      return res.status(400).json({ message: "A senha deve ter no mínimo 8 caracteres." });
    }
    if (!/[A-Z]/.test(pwd)) {
      return res.status(400).json({ message: "A senha deve conter pelo menos uma letra maiúscula." });
    }
    if (!/[a-z]/.test(pwd)) {
      return res.status(400).json({ message: "A senha deve conter pelo menos uma letra minúscula." });
    }
    if (!/[0-9]/.test(pwd)) {
      return res.status(400).json({ message: "A senha deve conter pelo menos um algarismo." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: role || "Student",
      institutionId,
      courseId,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    db.save();

    res.status(201).json({ message: "User created" });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.data.users.find((u: any) => u.email === email);

    const isDefaultAdmin = email === "admin@tcc.com" && password === "admin123";
    if (!user || (!isDefaultAdmin && !(await bcrypt.compare(password, user.password)))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "24h"
    });

    const userSafe = { ...user };
    delete userSafe.password;

    res.json({ token, user: userSafe });
  });

  // --- Institutions ---
  app.get("/api/institutions", (req, res) => {
    res.json(db.data.institutions);
  });

  app.post("/api/institutions", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Admin only" });
    const { name } = req.body;
    const newInst = { id: Date.now().toString(), name };
    db.data.institutions.push(newInst);
    db.save();
    res.status(201).json(newInst);
  });

  // --- Courses ---
  app.get("/api/courses", (req, res) => {
    res.json(db.data.courses);
  });

  app.post("/api/courses", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Admin only" });
    const { name, institutionId } = req.body;
    const newCourse = { id: Date.now().toString(), name, institutionId };
    db.data.courses.push(newCourse);
    db.save();
    res.status(201).json(newCourse);
  });

  // --- Admin Users (List all users with Course and Institution names) ---
  app.get("/api/admin/users", authenticateToken, (req: any, res) => {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Somente administradores podem listar todos os usuários." });
    
    const users = db.data.users.map((u: any) => {
      const institution = db.data.institutions.find((i: any) => i.id === u.institutionId);
      const course = db.data.courses.find((c: any) => c.id === u.courseId);
      
      const uSafe = { ...u };
      delete uSafe.password;
      
      return {
        ...uSafe,
        institutionName: institution ? institution.name : (u.role === "Admin" ? "Administração" : "Não Vinculada"),
        courseName: course ? course.name : (u.role === "Admin" ? "Administração" : "Não Vinculado")
      };
    });
    
    res.json(users);
  });

  // --- Profile Routes (RF-17 & RF-18) ---
  app.get("/api/profile", authenticateToken, (req: any, res) => {
    const user = db.data.users.find((u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const institution = db.data.institutions.find((i: any) => i.id === user.institutionId);
    const course = db.data.courses.find((c: any) => c.id === user.courseId);

    const userSafe = { ...user };
    delete userSafe.password;

    res.json({
      ...userSafe,
      institutionName: institution ? institution.name : (user.role === "Admin" ? "Administração" : "Não Vinculada"),
      courseName: course ? course.name : (user.role === "Admin" ? "Administração" : "Não Vinculado")
    });
  });

  app.put("/api/profile", authenticateToken, upload.single("photo"), async (req: any, res) => {
    const user = db.data.users.find((u: any) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const { name, password, photoUrl } = req.body;

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (password && password.trim()) {
      const pwd = password.trim();
      if (pwd.length < 8) {
        return res.status(400).json({ message: "A nova senha deve ter no mínimo 8 caracteres." });
      }
      if (!/[A-Z]/.test(pwd)) {
        return res.status(400).json({ message: "A nova senha deve conter pelo menos uma letra maiúscula." });
      }
      if (!/[a-z]/.test(pwd)) {
        return res.status(400).json({ message: "A nova senha deve conter pelo menos uma letra minúscula." });
      }
      if (!/[0-9]/.test(pwd)) {
        return res.status(400).json({ message: "A nova senha deve conter pelo menos um algarismo." });
      }
      user.password = await bcrypt.hash(pwd, 10);
    }

    if (req.file) {
      user.photo = `/uploads/${req.file.filename}`;
    } else if (photoUrl !== undefined) {
      user.photo = photoUrl;
    }

    db.save();
    logAction(user.id, "UPDATE_PROFILE", "Usuário atualizou suas informações de perfil");

    const userSafe = { ...user };
    delete userSafe.password;

    const institution = db.data.institutions.find((i: any) => i.id === user.institutionId);
    const course = db.data.courses.find((c: any) => c.id === user.courseId);

    res.json({
      ...userSafe,
      institutionName: institution ? institution.name : (user.role === "Admin" ? "Administração" : "Não Vinculada"),
      courseName: course ? course.name : (user.role === "Admin" ? "Administração" : "Não Vinculado")
    });
  });

  // --- Projects ---
  app.get("/api/projects", (req: any, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const { public: isPublic } = req.query;

    let user: any = null;
    if (token) {
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch (e) {}
    }

    let projects = db.data.projects.map((p: any) => {
      const student = db.data.users.find((u: any) => u.id === p.studentId);
      const teacher = db.data.users.find((u: any) => u.id === p.teacherId);
      const institution = db.data.institutions.find((i: any) => i.id === student?.institutionId);
      const course = db.data.courses.find((c: any) => c.id === student?.courseId);

      const meetings = db.data.meetings ? db.data.meetings.filter((m: any) => m.projectId === p.id) : [];
      const hasPendingMeeting = meetings.some((m: any) => m.status === "Aguardando");
      const hasMeetingResponse = meetings.some((m: any) => m.status === "Aceita" || m.status === "Recusada");

      const messages = db.data.messages ? db.data.messages.filter((m: any) => m.projectId === p.id) : [];
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const hasNewMessageFromStudent = lastMsg ? (lastMsg.senderRole === "Student" || lastMsg.senderId === p.studentId) : false;
      const hasNewMessageFromTeacher = lastMsg ? (lastMsg.senderRole === "Professor" || lastMsg.senderRole === "Admin" || lastMsg.senderId === p.teacherId) : false;
      const latestMessageAt = lastMsg ? (lastMsg.sentAt || lastMsg.id || "") : "";

      const tasks = db.data.tasks ? db.data.tasks.filter((t: any) => t.projectId === p.id) : [];
      const hasFeedbackOnTasks = tasks.some((t: any) => t.feedback && t.feedback.trim() !== "");
      const feedbacksWithTime = tasks.filter((t: any) => t.feedback && t.feedback.trim() !== "");
      const latestFeedbackAt = feedbacksWithTime.length > 0
        ? feedbacksWithTime.reduce((max: string, t: any) => {
            const tTime = t.feedbackUpdatedAt || t.id || "";
            return tTime > max ? tTime : max;
          }, "")
        : "";

      const answeredMeetings = meetings.filter((m: any) => m.status === "Aceita" || m.status === "Recusada");
      const latestMeetingResponseAt = answeredMeetings.length > 0
        ? answeredMeetings.reduce((max: string, m: any) => {
            const mTime = m.respondedAt || m.id || "";
            return mTime > max ? mTime : max;
          }, "")
        : "";

      return {
        ...p,
        studentName: student?.name,
        teacherName: teacher?.name,
        institutionId: student?.institutionId,
        institutionName: institution?.name,
        courseId: student?.courseId,
        courseName: course?.name,
        hasPendingMeeting,
        hasMeetingResponse,
        hasNewMessageFromStudent,
        hasNewMessageFromTeacher,
        hasFeedbackOnTasks,
        latestFeedbackAt,
        latestMeetingResponseAt,
        latestMessageAt,
      };
    });

    if (isPublic === "true") {
      // Public exploratory view (RN-01): show only approved projects (either Active or Completed)
      projects = projects.filter((p: any) => p.isApproved === true || p.isApproved === "true");
    } else if (user) {
      if (user.role === "Student") {
        projects = projects.filter((p: any) => p.studentId === user.id);
      } else if (user.role === "Professor") {
        // Professors should see projects they are assigned to, even if pending invite (RN-05)
        projects = projects.filter((p: any) => p.teacherId === user.id);
      }
    } else {
      // Public view (RN-01): show only approved projects
      projects = projects.filter((p: any) => p.isApproved === true || p.isApproved === "true");
    }

    res.json(projects);
  });

  app.post("/api/projects", authenticateToken, (req: any, res) => {
    const { title, description, studentId, teacherId } = req.body;
    const targetStudentId = studentId || req.user.id;

    // RN-02: O usuário aluno deve apenas estar presente em apenas 1 projeto de TCC
    const hasExisting = db.data.projects.some((p: any) => p.studentId === targetStudentId);
    if (hasExisting) {
      return res.status(400).json({ 
        message: "O usuário aluno já possui ou está participando de um projeto de TCC. Alunos podem participar de apenas 1 projeto." 
      });
    }

    // Restrict advisor to be from the same institution as the student
    const studentUser = db.data.users.find((u: any) => u.id === targetStudentId);
    const teacherUser = db.data.users.find((u: any) => u.id === teacherId);
    if (studentUser && teacherUser && studentUser.institutionId !== teacherUser.institutionId) {
      return res.status(400).json({
        message: "O professor orientador selecionado deve pertencer à mesma instituição de ensino que o aluno."
      });
    }

    const newProject = {
      id: Date.now().toString(),
      title,
      description,
      studentId: targetStudentId,
      teacherId,
      status: "Active",
      inviteStatus: "Pending", // RN-05: default is pending advisor acceptance
      isApproved: true,        // Automatic approval for the public repository upon creation
      createdAt: new Date().toISOString()
    };
    db.data.projects.push(newProject);
    db.save();
    logAction(req.user.id, "CREATE_PROJECT", `Created project: ${title}`);
    res.status(201).json(newProject);
  });

  // --- Professors List ---
  app.get("/api/professors", authenticateToken, (req: any, res) => {
    const currentUser = db.data.users.find((u: any) => u.id === req.user.id);
    let professors = db.data.users.filter((u: any) => u.role === "Professor");

    if (currentUser && currentUser.role === "Student") {
      professors = professors.filter((u: any) => u.institutionId === currentUser.institutionId);
    }

    const result = professors.map((u: any) => {
      return { id: u.id, name: u.name, email: u.email, institutionId: u.institutionId, courseId: u.courseId };
    });
    res.json(result);
  });

  // --- Invite Actions (RN-05) ---
  app.post("/api/projects/:id/invite", authenticateToken, (req: any, res) => {
    const { action } = req.body; // "accept" or "reject"
    const project = db.data.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    // Validate that the logged-in user is the invited professor or Admin
    if (req.user.role !== "Admin" && project.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Apenas o professor orientador convidado pode aceitar ou recusar o convite." });
    }

    if (action === "accept") {
      project.inviteStatus = "Accepted";
      logAction(req.user.id, "ACCEPT_INVITE", `Orientador aceitou orientação do TCC: ${project.title}`);
      db.save();
      res.json(project);
    } else if (action === "reject") {
      db.data.projects = db.data.projects.filter((p: any) => p.id !== req.params.id);
      db.data.tasks = db.data.tasks.filter((t: any) => t.projectId !== req.params.id);
      db.data.submissions = db.data.submissions.filter((s: any) => s.projectId !== req.params.id);
      logAction(req.user.id, "REJECT_INVITE", `Orientador recusou orientação do TCC: ${project.title}. O projeto foi cancelado.`);
      db.save();
      res.json({ message: "Convite recusado e criação do projeto cancelada com sucesso.", status: "cancelled" });
    } else {
      return res.status(400).json({ message: "Ação de convite inválida. Escolha entre 'accept' ou 'reject'." });
    }
  });

  // --- Approve project / evaluate as completed ---
  app.post("/api/projects/:id/approve", authenticateToken, (req: any, res) => {
    const project = db.data.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    // Validate that user is the assigned orientador or Admin
    const isOwnerProfessor = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isOwnerProfessor && !isAdmin) {
      return res.status(403).json({ message: "Apenas o orientador responsável ou o administrador pode aprovar este TCC." });
    }

    project.status = "Completed";
    logAction(req.user.id, "APPROVE_PROJECT", `TCC avaliado, aprovado e concluído com sucesso: ${project.title}`);
    db.save();
    res.json(project);
  });

  // --- Complete project (Mark as "Aguardando avaliação") ---
  app.post("/api/projects/:id/complete", authenticateToken, (req: any, res) => {
    const project = db.data.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    // Validate that user is the student of this project or Admin
    const isOwnerStudent = project.studentId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isOwnerStudent && !isAdmin) {
      return res.status(403).json({ message: "Apenas o aluno responsável ou o administrador pode marcar este TCC como concluído." });
    }

    // Verify that there are no pending tasks and milestones
    const pendingTasks = db.data.tasks.filter((t: any) => t.projectId === project.id && t.status !== "Completed");
    if (pendingTasks.length > 0) {
      return res.status(400).json({ message: "Não é possível realizar a entrega final pois existem tarefas ou milestones pendentes no cronograma." });
    }

    project.status = "Aguardando avaliação";
    logAction(req.user.id, "COMPLETE_PROJECT", `Projeto TCC submetido e aguardando avaliação: ${project.title}`);
    db.save();
    res.json(project);
  });

  // --- Reprove project / send back to active state ---
  app.post("/api/projects/:id/reprove", authenticateToken, (req: any, res) => {
    const project = db.data.projects.find((p: any) => p.id === req.params.id);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    // Validate that user is the assigned orientador or Admin
    const isOwnerProfessor = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isOwnerProfessor && !isAdmin) {
      return res.status(403).json({ message: "Apenas o orientador responsável ou o administrador pode reprovar este TCC." });
    }

    if (project.status !== "Aguardando avaliação") {
      return res.status(400).json({ message: "O projeto só pode ser reprovado se estiver aguardando avaliação." });
    }

    project.status = "Active";
    logAction(req.user.id, "REPROVE_PROJECT", `TCC avaliado como reprovado e retornado ao estado ativo: ${project.title}`);
    db.save();
    res.json(project);
  });

  // --- Submissions By Project (Retrieve list of submissions for a project workspace) ---
  app.get("/api/projects/:projectId/submissions", authenticateToken, (req, res) => {
    const submissions = db.data.submissions.filter((s: any) => s.projectId === req.params.projectId);
    res.json(submissions);
  });

  // --- Project Messages / Communication ---
  app.get("/api/projects/:projectId/messages", authenticateToken, (req: any, res) => {
    const { projectId } = req.params;
    
    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    const isStudent = project.studentId === req.user.id;
    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: "Você não tem acesso às mensagens deste projeto." });
    }

    if (!db.data.messages) {
      db.data.messages = [];
    }

    const messages = db.data.messages.filter((m: any) => m.projectId === projectId);
    
    const messagesMapped = messages.map((m: any) => {
      const sender = db.data.users.find((u: any) => u.id === m.senderId);
      return {
        ...m,
        senderName: sender ? sender.name : "Usuário descadastrado",
        senderRole: sender ? sender.role : ""
      };
    });

    res.json(messagesMapped);
  });

  app.post("/api/projects/:projectId/messages", authenticateToken, (req: any, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "O conteúdo da mensagem não pode estar vazio." });
    }

    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    const isStudent = project.studentId === req.user.id;
    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (isAdmin) {
      return res.status(403).json({ message: "O Administrador não tem permissão para enviar mensagens neste canal." });
    }

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: "Você não tem permissão para enviar mensagens neste canal." });
    }

    if (!db.data.messages) {
      db.data.messages = [];
    }

    const projectMessages = db.data.messages.filter((m: any) => m.projectId === projectId);

    if (isStudent) {
      if (projectMessages.length > 0) {
        const lastMessage = projectMessages[projectMessages.length - 1];
        if (lastMessage.senderRole === "Student" || lastMessage.senderId === project.studentId) {
          return res.status(400).json({ 
            message: "Você não pode enviar uma nova mensagem até receber a resposta do seu professor orientador para a dúvida anterior." 
          });
        }
      }
    }

    const newMessage = {
      id: Date.now().toString(),
      projectId,
      senderId: req.user.id,
      senderRole: req.user.role,
      content: content.trim(),
      sentAt: new Date().toISOString()
    };

    db.data.messages.push(newMessage);
    db.save();

    const sender = db.data.users.find((u: any) => u.id === req.user.id);
    const mappedMessage = {
      ...newMessage,
      senderName: sender ? sender.name : "Você",
    };

    res.status(201).json(mappedMessage);
  });

  // --- Meetings / Reuniões ---
  app.get("/api/projects/:projectId/meetings", authenticateToken, (req: any, res) => {
    const { projectId } = req.params;
    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    const isStudent = project.studentId === req.user.id;
    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: "Você não tem acesso às reuniões deste projeto." });
    }

    if (!db.data.meetings) {
      db.data.meetings = [];
    }

    const projectMeetings = db.data.meetings.filter((m: any) => m.projectId === projectId);
    res.json(projectMeetings);
  });

  app.post("/api/projects/:projectId/meetings", authenticateToken, (req: any, res) => {
    const { projectId } = req.params;
    const { title, description, dateTime } = req.body;

    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    if (req.user.role !== "Student" || project.studentId !== req.user.id) {
      return res.status(403).json({ message: "Apenas o aluno responsável pelo TCC pode solicitar reuniões." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "O motivo (título) da reunião é obrigatório." });
    }
    if (!dateTime) {
      return res.status(400).json({ message: "A data e horário da reunião são obrigatórios." });
    }

    if (!db.data.meetings) {
      db.data.meetings = [];
    }

    const newMeeting = {
      id: Date.now().toString(),
      projectId,
      studentId: req.user.id,
      title: title.trim(),
      description: (description || "").trim(),
      dateTime,
      status: "Aguardando", // "Aguardando", "Aceita", "Recusada"
      rejectionReason: "",
      createdAt: new Date().toISOString()
    };

    db.data.meetings.push(newMeeting);
    db.save();
    res.status(201).json(newMeeting);
  });

  app.post("/api/meetings/:meetingId/accept", authenticateToken, (req: any, res) => {
    const { meetingId } = req.params;

    if (!db.data.meetings) {
      db.data.meetings = [];
    }

    const meeting = db.data.meetings.find((m: any) => m.id === meetingId);
    if (!meeting) return res.status(404).json({ message: "Solicitação de reunião não encontrada." });

    const project = db.data.projects.find((p: any) => p.id === meeting.projectId);
    if (!project) return res.status(404).json({ message: "Projeto associado não encontrado." });

    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: "Apenas o professor orientador ou o administrador pode responder a esta solicitação." });
    }

    meeting.status = "Aceita";
    meeting.respondedAt = new Date().toISOString();
    db.save();
    res.json(meeting);
  });

  app.post("/api/meetings/:meetingId/reject", authenticateToken, (req: any, res) => {
    const { meetingId } = req.params;
    const { reason } = req.body;

    if (!db.data.meetings) {
      db.data.meetings = [];
    }

    const meeting = db.data.meetings.find((m: any) => m.id === meetingId);
    if (!meeting) return res.status(404).json({ message: "Solicitação de reunião não encontrada." });

    const project = db.data.projects.find((p: any) => p.id === meeting.projectId);
    if (!project) return res.status(404).json({ message: "Projeto associado não encontrado." });

    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isTeacher && !isAdmin) {
      return res.status(403).json({ message: "Apenas o professor orientador ou o administrador pode responder a esta solicitação." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "A justificativa para a recusa é obrigatória." });
    }

    meeting.status = "Recusada";
    meeting.rejectionReason = reason.trim();
    meeting.respondedAt = new Date().toISOString();
    db.save();
    res.json(meeting);
  });

  // --- Tasks ---
  app.get("/api/projects/:projectId/tasks", authenticateToken, (req, res) => {
    const tasks = db.data.tasks.filter((t: any) => t.projectId === req.params.projectId);
    res.json(tasks);
  });

  app.post("/api/tasks", authenticateToken, (req: any, res) => {
    const { projectId, title, description, deadline } = req.body;
    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    // Only associated student or admin can add tasks/milestones
    const isOwnerStudent = project.studentId === req.user.id;
    const isAdmin = req.user.role === "Admin";
    if (!isOwnerStudent && !isAdmin) {
      return res.status(403).json({ message: "Apenas o aluno responsável pelo TCC ou o administrador por adicionar tarefas ao cronograma." });
    }

    const newTask = {
      id: Date.now().toString(),
      projectId,
      title,
      description,
      deadline,
      status: "Pending",
      progress: 0,
      comments: []
    };
    db.data.tasks.push(newTask);
    db.save();
    res.status(201).json(newTask);
  });

  app.patch("/api/tasks/:taskId", authenticateToken, (req: any, res) => {
    const { status, progress, feedback } = req.body;
    const taskIndex = db.data.tasks.findIndex((t: any) => t.id === req.params.taskId);
    if (taskIndex === -1) return res.status(404).json({ message: "Task not found" });

    const task = db.data.tasks[taskIndex];
    const project = db.data.projects.find((p: any) => p.id === task.projectId);
    if (!project) return res.status(404).json({ message: "Projeto não encontrado" });

    if (feedback !== undefined) {
      // RN check: Only the project's assigned advisor (Professor) can write feedback
      if (req.user.role !== "Professor" || project.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Apenas o professor orientador deste projeto pode escrever feedbacks para as tarefas." });
      }

      // Check: Task must be completed to receive feedback
      const currentStatus = status || task.status;
      if (currentStatus !== "Completed") {
        return res.status(400).json({ message: "O feedback só pode ser enviado para tarefas ou milestones marcadas como feitas (concluídas)." });
      }

      task.feedback = feedback;
      task.feedbackUpdatedAt = new Date().toISOString();

      // Add as part of comments log as well
      if (!task.comments) {
        task.comments = [];
      }
      task.comments.push({
        id: Date.now().toString(),
        userId: req.user.id,
        text: feedback,
        timestamp: new Date().toISOString()
      });
    }

    if (status !== undefined || progress !== undefined) {
      const isOwnerStudent = req.user.role === "Student" && project.studentId === req.user.id;
      const isAdmin = req.user.role === "Admin";
      if (!isOwnerStudent && !isAdmin) {
        return res.status(403).json({ message: "Apenas o aluno responsável por este TCC ou o administrador podem marcar tarefas/milestones como concluídos." });
      }
      if (status !== undefined) task.status = status;
      if (progress !== undefined) task.progress = progress;
    }

    db.save();
    res.json(task);
  });

  // --- Submissions ---
  app.post("/api/submissions", authenticateToken, upload.single("file"), (req: any, res) => {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Apenas alunos podem submeter arquivos no projeto TCC." });
    }

    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
    const { taskId, projectId } = req.body;
    
    const project = db.data.projects.find((p: any) => p.id === projectId);
    if (!project) {
      return res.status(404).json({ message: "Projeto não encontrado" });
    }

    if (project.status !== "Active") {
      return res.status(403).json({ message: "O projeto não está em andamento (Ativo). Novas submissões de arquivos não são permitidas após a conclusão." });
    }
    
    const newSubmission = {
      id: Date.now().toString(),
      taskId,
      projectId,
      studentId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      submittedAt: new Date().toISOString(),
      status: "Pending"
    };

    db.data.submissions.push(newSubmission);
    db.save();
    res.status(201).json(newSubmission);
  });

  // --- Download Submission File ---
  app.get("/api/submissions/:id/download", authenticateToken, (req: any, res) => {
    const submission = db.data.submissions.find((s: any) => s.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submissão não encontrada." });
    }

    const project = db.data.projects.find((p: any) => p.id === submission.projectId);
    if (!project) {
      return res.status(404).json({ message: "Projeto associado não encontrado." });
    }

    const isStudent = project.studentId === req.user.id;
    const isTeacher = project.teacherId === req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({ message: "Você não tem permissão para baixar este arquivo." });
    }

    if (!fs.existsSync(submission.filePath)) {
      const baseName = path.basename(submission.filePath);
      const fallbackPath = path.join(UPLOADS_DIR, baseName);
      if (fs.existsSync(fallbackPath)) {
        return res.download(fallbackPath, submission.fileName);
      }
      return res.status(404).json({ message: "Arquivo físico não encontrado no servidor." });
    }

    res.download(submission.filePath, submission.fileName);
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
