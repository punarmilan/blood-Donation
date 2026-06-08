import api from "./api";

const organizerService = {
  login: async (email, password) => {
    const res = await api.post("/auth/organizer-login", { email, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get("/organizer/profile");
    return res.data;
  },
  getMyCamps: async () => {
    const res = await api.get("/organizer/my-camps");
    return res.data;
  },
  getMyDonors: async (campId) => {
    const res = await api.get(`/organizer/my-donors?campId=${campId}`);
    return res.data;
  },
  getCampDetails: async (campId) => {
    const res = await api.get(`/organizer/camp/${campId}`);
    return res.data;
  },
  getCampRegistrations: async (campId) => {
    const res = await api.get(`/organizer/registrations/${campId}`);
    return res.data;
  },
  getReports: async () => {
    const res = await api.get("/organizer/reports");
    return res.data;
  },
  checkWAStatus: async () => {
    const res = await api.get("/wa/status");
    return res.data;
  },
  shareCamp: async (campId, phone) => {
    const res = await api.post("/wa/share-camp", { campId, phone });
    return res.data;
  },
  shareReport: async (data) => {
    const res = await api.post("/wa/share-report", data);
    return res.data;
  },
  submitEnquiry: async (data) => {
    const res = await api.post("/organizer-enquiry", data);
    return res.data;
  },
  updateCampDonor: async (id, data) => {
    const res = await api.put(`/organizer/donor/${id}`, data);
    return res.data;
  },
  deleteCampDonor: async (id) => {
    const res = await api.delete(`/organizer/donor/${id}`);
    return res.data;
  },
  getWhatsAppStatus: async () => {
    const res = await api.get("/organizer/whatsapp/status");
    return res.data;
  },
  startWhatsApp: async () => {
    const res = await api.post("/organizer/whatsapp/start");
    return res.data;
  },
  disconnectWhatsApp: async () => {
    const res = await api.post("/organizer/whatsapp/disconnect");
    return res.data;
  },
};

export default organizerService;
