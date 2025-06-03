import axios from "axios";
import { HOST } from "./config";

export const getCustomerList = async (page, date) => {
  const response = await axios.get(`${HOST}/api/customers?page=${page}&date=${date}`);

  return response.data;
};

export const getCustomerDetail = async () => {
  const response = await axios.get(`${HOST}/api/customers/101`);

  return response.data;
};
