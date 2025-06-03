import axios from "axios";
import { HOST } from "./config";

export const getGraphToday = async () => {
  const response = await axios.get(`${HOST}/api/zones/today-stay-times`);

  return response.data;
};

export const getGraphWeekly = async () => {
  const response = await axios.get(`${HOST}/api/zones/weekly-stay-times`);

  return response.data;
};

export const getGraphMonthly = async () => {
  const response = await axios.get(`${HOST}/api/zones/monthly-stay-times`);

  return response.data;
};
