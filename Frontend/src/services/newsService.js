import axios from "axios";
import api from "./api"; // If applicable, though we can just use axios directly for now to preserve existing behavior

// Get all news (optional filter by published status)
export const getNews = async (publishedOnly = false) => {
  const url = publishedOnly ? "/api/news?published=true" : "/api/news";
  const res = await axios.get(url);
  return res.data;
};

// Get public news
export const getPublicNews = async () => {
  const savedLoc = localStorage.getItem("detected_location");
  let query = "";
  if (savedLoc) {
    try {
      const { country, state, city } = JSON.parse(savedLoc);
      query = `?country=${encodeURIComponent(country || "")}&state=${encodeURIComponent(state || "")}&city=${encodeURIComponent(city || "")}`;
    } catch (e) {
      console.error("Error parsing location for news", e);
    }
  }
  const res = await axios.get(`/api/public/news-awareness${query}`);
  return res.data;
};

// Get single news by slug
export const getNewsBySlug = async (slug) => {
  const res = await axios.get(`/api/news/${slug}`);
  return res.data;
};

// Upload news image
export const uploadNewsImage = async (formData) => {
  const res = await axios.post("/api/news/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Create news article
export const createNews = async (data) => {
  const res = await axios.post("/api/news", data);
  return res.data;
};

// Update news article
export const updateNews = async (id, data) => {
  const res = await axios.put(`/api/news/${id}`, data);
  return res.data;
};

// Delete news article
export const deleteNews = async (id) => {
  const res = await axios.delete(`/api/news/${id}`);
  return res.data;
};
