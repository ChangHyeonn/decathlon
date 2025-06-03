import axios from "axios";
import { HOST } from "./config";

export const getCustomerList = async (page, date) => {
  const response = await axios.get(`${HOST}/api/customers?page=${page}&date=${date}`);

  return response.data;
};

export const getCustomerDetail = async (id) => {
  const response = await axios.get(`${HOST}/api/customers/${id}`);

  return response.data;
};
