import axios from "axios";

export const getStories = async (activeOnly = false) => {
  const savedLoc = localStorage.getItem("detected_location");
  let query = "";
  if (savedLoc) {
    try {
      const { country, state, city } = JSON.parse(savedLoc);
      query = `?country=${encodeURIComponent(country || "")}&state=${encodeURIComponent(state || "")}&city=${encodeURIComponent(city || "")}`;
    } catch (e) {
      console.error("Error parsing location for success stories", e);
    }
  }
  
  // Localized success-stories endpoint
  const prefix = query ? `&` : `?`;
  const res = await axios.get(`/api/public/success-stories${query}${activeOnly ? `${prefix}active=true` : ""}`);
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
