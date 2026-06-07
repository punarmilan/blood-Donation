import axios from "axios";

export const getMe = async (token) => {
  const res = await axios.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const registerUser = async (userData) => {
  const res = await axios.post("/api/auth/register", userData);
  return res.data;
};

export const changePassword = async (data, token) => {
  const res = await axios.post("/api/auth/change-password", data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
