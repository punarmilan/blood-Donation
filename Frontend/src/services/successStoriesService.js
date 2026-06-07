import axios from "axios";

export const getStories = async (activeOnly = false) => {
  const url = activeOnly ? "/api/success-stories?active=true" : "/api/success-stories";
  const res = await axios.get(url);
  return res.data;
};

export const uploadStoryImage = async (formData) => {
  const res = await axios.post("/api/success-stories/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const createStory = async (data) => {
  const res = await axios.post("/api/success-stories", data);
  return res.data;
};

export const updateStory = async (id, data) => {
  const res = await axios.put(`/api/success-stories/${id}`, data);
  return res.data;
};

export const deleteStory = async (id) => {
  const res = await axios.delete(`/api/success-stories/${id}`);
  return res.data;
};
