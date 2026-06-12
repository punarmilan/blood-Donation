import axios from "axios";

export const getGalleryImages = async () => {
  const savedLoc = localStorage.getItem("detected_location");
  let query = "";
  if (savedLoc) {
    try {
      const { country, state, city } = JSON.parse(savedLoc);
      query = `?country=${encodeURIComponent(country || "")}&state=${encodeURIComponent(state || "")}&city=${encodeURIComponent(city || "")}`;
    } catch (e) {
      console.error("Error parsing location for gallery", e);
    }
  }
  const res = await axios.get(`/api/public/impact-gallery${query}`);
  return res.data;
};

export const uploadGalleryImage = async (formData) => {
  const res = await axios.post("/api/impact-gallery/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const createGalleryImage = async (data) => {
  const res = await axios.post("/api/impact-gallery", data);
  return res.data;
};

export const updateGalleryImage = async (id, data) => {
  const res = await axios.put(`/api/impact-gallery/${id}`, data);
  return res.data;
};

export const deleteGalleryImage = async (id) => {
  const res = await axios.delete(`/api/impact-gallery/${id}`);
  return res.data;
};
