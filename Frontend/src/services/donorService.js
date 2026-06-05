import api from "./api";

const donorService = {
  getAllDonors: async () => {
    const res = await api.get("/donors");
    return res.data;
  },
  getDonorsByCamp: async (campId) => {
    const res = await api.get(`/donors/camp/${campId}`);
    return res.data;
  },
  registerDonor: async (data) => {
    const res = await api.post("/donors", data);
    return res.data;
  },
  updateDonor: async (id, data) => {
    const res = await api.put(`/donors/${id}`, data);
    return res.data;
  },
  deleteDonor: async (id) => {
    const res = await api.delete(`/donors/${id}`);
    return res.data;
  },
};

export default donorService;
