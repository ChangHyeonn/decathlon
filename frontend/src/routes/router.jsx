import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";

import SectionPage from "../pages/SectionPage";
import CustomerPage from "../pages/CustomerPage";
import SigninPage from "../pages/SigninPage";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/section" element={<SectionPage />} />
        <Route path="/customer" element={<CustomerPage />} />
      </Routes>
    </BrowserRouter>
  );
};
