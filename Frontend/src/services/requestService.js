import api from "./api";

export const getRequestStatus = async (requestId) => {
  const res = await api.get(`/request/${requestId}`);
  return res.data;
};

export const createBloodRequest = async (data) => {
  const res = await api.post("/request/create", data);
  return res.data;
};

export const getBloodRequestBackground = async () => {
  const savedLoc = localStorage.getItem("detected_location");
  let query = "";
  if (savedLoc) {
    try {
      const { country, state, city } = JSON.parse(savedLoc);
      query = `?country=${encodeURIComponent(country || "")}&state=${encodeURIComponent(state || "")}&city=${encodeURIComponent(city || "")}`;
    } catch (e) {
      console.error("Error parsing location for blood request background", e);
    }
  }
  const res = await api.get(`/public/blood-request-background${query}`);
  return res.data;
};

export const checkMobile = async (mobile) => {
  const res = await api.post("/auth/check-mobile", { mobile });
  return res.data;
};

export const getLiveBloodRequests = async (state) => {
  const res = await api.get(`/request/live?state=${encodeURIComponent(state)}`);
  return res.data;
};

export const getAllLiveRequests = async (filters) => {
  const res = await api.get("/request/all-live", { params: filters });
  return res.data;
};
