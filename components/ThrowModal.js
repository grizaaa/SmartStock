import React, { useState } from "react";

// Memoized ThrowModal to prevent unnecessary re-renders
const ThrowModal = React.memo(({ selectedRecord, onClose, onSubmit }) => {
  const [quantityToThrow, setQuantityToThrow] = useState(0); // Track user input for throw quantity
  const [adminPassword, setAdminPassword] = useState(""); // Track the password input
  const [passwordError, setPasswordError] = useState(""); // Track password validation error

  const handleSubmit = async () => {
    // Validate quantity input
    if (
      !quantityToThrow ||
      quantityToThrow <= 0 ||
      quantityToThrow > selectedRecord.qty
    ) {
      alert("Invalid quantity");
      return;
    }

    try {
      // Call the backend for password validation
      const response = await fetch("/api/throwPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        onSubmit(quantityToThrow);
        setQuantityToThrow(0);
        setAdminPassword("");
        setPasswordError("");
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setPasswordError("Error validating password. Please try again later.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#edededf0",
        padding: "20px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        borderRadius: "15px",
      }}
    >
      <h3>Throw Item</h3>
      <p>
        Part: {selectedRecord.part} | Locator: {selectedRecord.locator}
      </p>
      <input
        type="number"
        placeholder="Enter Quantity to Throw"
        min="1"
        max={selectedRecord.qty}
        value={quantityToThrow}
        onChange={(e) => setQuantityToThrow(parseInt(e.target.value, 10))}
        style={{ padding: "10px", width: "90%" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
        style={{ marginTop: "5px", padding: "10px", width: "90%" }}
      />
      {passwordError && <p style={{ color: "red" }}>{passwordError}</p>}
      <button
        onClick={handleSubmit}
        style={{
          padding: "10px",
          marginTop: "10px",
          width: "100%",
          backgroundColor: "#074d6f",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit
      </button>
      <button
        onClick={onClose}
        style={{
          padding: "10px",
          marginTop: "10px",
          width: "100%",
          backgroundColor: "#6F2907",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
});

export default ThrowModal;
