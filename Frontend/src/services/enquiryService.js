import axios from "axios";

export const submitOrganizerEnquiry = async (data) => {
  const res = await axios.post("/api/organizer-enquiry/submit", data);
  return res.data;
};
