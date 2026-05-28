import { useState } from "react";
import { customersAPI } from "../api";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import useConfirm from "../hooks/useConfirm";

function CustomerForm() {
  const navigate = useNavigate();
  const { ConfirmDialog, confirm } = useConfirm();

  const [customer, setCustomer] = useState({
    name: "",
    place: "",
    capacity: "",
    mobile: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "capacity") {
      setCustomer({ ...customer, [name]: value === "" ? "" : Number(value) });
    } else {
      setCustomer({ ...customer, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const confirmed = await confirm("Save this customer record?");
    if (!confirmed) return;

    try {
      await customersAPI.create(customer);

      setSuccess("Customer added successfully");
      setTimeout(() => navigate("/customers"), 1200);

    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div className="page-shell">
      <div><div className="home-icon" onClick={() => navigate("/dashboard")}>
          <FaHome /></div>
      
        </div>
      <div className="card">
        <h2>Add Customer</h2>

        <form onSubmit={handleSubmit}>

          <label>Name</label>
<input
  name="name"
  value={customer.name || ""}
  onChange={(e) => {
    const value = e.target.value;

    // only letters + space
    if (!/^[a-zA-Z\s]*$/.test(value)) return;

    setCustomer({ ...customer, name: value });
  }}
  required
/>

<label>Place</label>
<input
  name="place"
  value={customer.place || ""}
  onChange={(e) => {
    const value = e.target.value;

    // allow letters + space only (optional rule)
    if (!/^[a-zA-Z\s]*$/.test(value)) return;

    setCustomer({ ...customer, place: value });
  }}
  required
/>

<label>Capacity</label>
<div style={{ position: "relative" }}>
  <input
    type="text"
    inputMode="numeric"
    name="capacity"
    value={customer.capacity || ""}
    onChange={(e) => {
      const value = e.target.value;

      // ONLY digits allowed
      if (!/^\d*$/.test(value)) return;

      setCustomer({ ...customer, capacity: value });
    }}
    required
    style={{ paddingRight: "40px" }}
  />

  <span
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#555"
    }}
  >
    KW
  </span>
</div>

<label>Mobile</label>
<input
  name="mobile"
  value={customer.mobile || ""}
  onChange={(e) => {
    const value = e.target.value;

    // only numbers + max 10 digits
    if (!/^\d*$/.test(value)) return;
    if (value.length > 10) return;

    setCustomer({ ...customer, mobile: value });
  }}
  required
/>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit">Save Customer</button>
        </form>
      </div>
      {ConfirmDialog}
    </div>
  );
}

export default CustomerForm;