import api from "./api";

export const getHomeContents = async () => {
  const res = await api.get("/admin/home-content");
  return res.data;
};

export const createHomeContent = async (data) => {
  const res = await api.post("/admin/home-content", data);
  return res.data;
};

export const updateHomeContent = async (id, data) => {
  const res = await api.put(`/admin/home-content/${id}`, data);
  return res.data;
};

export const deleteHomeContent = async (id) => {
  const res = await api.delete(`/admin/home-content/${id}`);
  return res.data;
};

export const uploadHomeMedia = async (formData) => {
  const res = await api.post("/admin/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
