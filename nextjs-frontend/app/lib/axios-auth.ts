import axios from "axios";

const axiosAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosAuth;
