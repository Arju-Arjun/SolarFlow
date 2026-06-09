import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./mobile.css";
import { isAuthenticated } from "./auth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CustomerForm from "./pages/CustomerForm";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/Customer/CustomerProfile";
// 💡 Import the new SupplementDocuments page component
import SupplementDocuments from "./SupplementDocuments"; 

import ProtectedRoute from "./components/ProtectedRoute";

const AuthRedirect = () =>
  isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<AuthRedirect />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Authenticated / Protected Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers/add" element={<CustomerForm />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customer/:id" element={<CustomerProfile />} />
          
          {/* 💡 Registered the /Supplement path cleanly inside the protected wrapper */}
          <Route path="/Supplement" element={<SupplementDocuments />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;