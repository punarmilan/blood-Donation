import api from "./api";

const adminService = {
  login: async (email, password) => {
    const res = await api.post("/admin/login", { email, password });
    return res.data;
  },
  getOrganizers: async () => {
    const res = await api.get("/admin/organizers");
    return res.data;
  },
  getTotalUsers: async () => {
    const res = await api.get("/admin/users/count");
    return res.data.count;
  },
  updateOrganizer: async (id, data) => {
    const res = await api.put(`/admin/organizers/${id}`, data);
    return res.data;
  },
  deleteOrganizer: async (id) => {
    const res = await api.delete(`/admin/organizers/${id}`);
    return res.data;
  },
  getEnquiries: async () => {
    const res = await api.get("/admin/enquiries");
    return res.data;
  },
  updateEnquiry: async (id, data) => {
    const res = await api.put(`/admin/enquiries/${id}`, data);
    return res.data;
  },
  approveEnquiry: async (id, password) => {
    const res = await api.patch(`/organizer-enquiry/${id}/approve`, password ? { password } : {});
    return res.data;
  },
  rejectEnquiry: async (id, reason) => {
    const res = await api.patch(`/organizer-enquiry/${id}/reject`, { reason });
    return res.data;
  },
  resetOrganizerPassword: async (id, password) => {
    const res = await api.put(`/admin/enquiries/${id}/reset-password`, { password });
    return res.data;
  },
  deleteEnquiry: async (id) => {
    const res = await api.delete(`/admin/enquiries/${id}`);
    return res.data;
  },
  getBloodRequests: async () => {
    const res = await api.get("/admin/blood-requests");
    return res.data;
  },
  updateBloodRequestStatus: async (id, status) => {
    const res = await api.patch(`/admin/blood-requests/${id}/status`, { status });
    return res.data;
  },
};

export default adminService;
