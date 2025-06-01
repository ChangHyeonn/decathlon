import axios from "axios";
import { HOST } from "./config";

export const getCustomerList = async () => {
  const response = await axios.get(`${HOST}/api/customers?page=1`);

  return response.data;
};
