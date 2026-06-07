import axios from "axios";

export const getNearbyBloodBanks = async (lat, lng, radius, bloodGroup, searchQuery) => {
  const res = await axios.get("/api/blood-banks/nearby", {
    params: {
      lat,
      lng,
      radius,
      bloodGroup,
      search: searchQuery,
    },
  });
  return res.data;
};
