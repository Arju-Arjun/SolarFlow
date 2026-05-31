import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./mobile.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CustomerForm from "./pages/CustomerForm";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/Customer/CustomerProfile";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers/add" element={<CustomerForm />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customer/:id" element={<CustomerProfile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;