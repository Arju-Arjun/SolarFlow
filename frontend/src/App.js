import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./mobile.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CustomerForm from "./pages/CustomerForm";
import Customers from "./pages/Customers";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerProfile from "./pages/Customer/CustomerProfile";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/customer/:id" element={<CustomerProfile />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers/add" element={<CustomerForm />} />
          <Route path="/customers" element={<Customers />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
