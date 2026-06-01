const API_URL = "/api";

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("tcc_token");
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    } as any;

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Something went wrong");
    }

    return response.json();
  },

  auth: {
    login: (data: any) => api.request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: any) => api.request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  },

  institutions: {
    list: () => api.request("/institutions"),
    create: (data: any) => api.request("/institutions", { method: "POST", body: JSON.stringify(data) }),
  },

  courses: {
    list: () => api.request("/courses"),
    create: (data: any) => api.request("/courses", { method: "POST", body: JSON.stringify(data) }),
  },

  admin: {
    users: () => api.request("/admin/users"),
  },

  profile: {
    get: () => api.request("/profile"),
    update: (data: any) => api.request("/profile", { method: "PUT", body: data instanceof FormData ? data : JSON.stringify(data) }),
  },

  professors: {
    list: () => api.request("/professors"),
  },

  projects: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return api.request(`/projects${query}`);
    },
    create: (data: any) => api.request("/projects", { method: "POST", body: JSON.stringify(data) }),
    respondToInvite: (id: string, action: "accept" | "reject") => api.request(`/projects/${id}/invite`, { method: "POST", body: JSON.stringify({ action }) }),
    approveCatalog: (id: string) => api.request(`/projects/${id}/approve`, { method: "POST" }),
    complete: (id: string) => api.request(`/projects/${id}/complete`, { method: "POST" }),
    reprove: (id: string) => api.request(`/projects/${id}/reprove`, { method: "POST" }),
  },

  tasks: {
    listByProject: (projectId: string) => api.request(`/projects/${projectId}/tasks`),
    create: (data: any) => api.request("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (taskId: string, data: any) => api.request(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  submissions: {
    listByProject: (projectId: string) => api.request(`/projects/${projectId}/submissions`),
    create: (formData: FormData) => api.request("/submissions", { method: "POST", body: formData }),
    download: async (submissionId: string) => {
      const token = localStorage.getItem("tcc_token");
      const response = await fetch(`/api/submissions/${submissionId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Erro ao baixar arquivo.");
      }
      return response.blob();
    },
  },

  messages: {
    listByProject: (projectId: string) => api.request(`/projects/${projectId}/messages`),
    create: (projectId: string, content: string) => api.request(`/projects/${projectId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  },

  meetings: {
    listByProject: (projectId: string) => api.request(`/projects/${projectId}/meetings`),
    create: (projectId: string, data: { title: string; description: string; dateTime: string }) => 
      api.request(`/projects/${projectId}/meetings`, { method: "POST", body: JSON.stringify(data) }),
    accept: (meetingId: string) => api.request(`/meetings/${meetingId}/accept`, { method: "POST" }),
    reject: (meetingId: string, reason: string) => 
      api.request(`/meetings/${meetingId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  }
};
