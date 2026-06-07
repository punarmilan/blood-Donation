import api from "./api";

const campService = {
  getCamps: async () => {
    const res = await api.get("/camps");
    return res.data;
  },
  getCampsWithCount: async () => {
    const res = await api.get("/camps/with-count");
    return res.data;
  },
  createCamp: async (data) => {
    const res = await api.post("/camps", data);
    return res.data;
  },
  updateCamp: async (id, data) => {
    const response = await api.put(`/camps/${id}`, data);
    return response.data;
  },
  deleteCamp: async (id) => {
    const response = await api.delete(`/camps/${id}`);
    return response.data;
  },
  uploadCampPhotos: async (id, formData) => {
    const response = await api.post(`/camps/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  getCampById: async (id) => {
    const response = await api.get(`/camps/${id}`);
    return response.data;
  },
  completeCamp: async (id, formData) => {
    const response = await api.patch(`/camps/${id}/complete`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }
};

export default campService;
