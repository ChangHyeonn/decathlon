import axios from "axios";
import { HOST } from "./config";

export const getGraphToday = async () => {
  const response = await axios.get(`${HOST}/api/zones/today-stay-times`);

  return response.data;
};
