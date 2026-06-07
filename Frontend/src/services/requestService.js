import axios from "axios";

export const getRequestStatus = async (requestId) => {
  const res = await axios.get(`/api/request/${requestId}`);
  return res.data;
};

export const createBloodRequest = async (data, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post("/api/request/create", data, { headers });
  return res.data;
};

export const getBloodRequestBackground = async () => {
  const res = await axios.get("/api/blood-request-background");
  return res.data;
};
