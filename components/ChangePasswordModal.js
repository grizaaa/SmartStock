"use client";

import React, { useState } from "react";

const ChangePasswordModal = ({ onClose, onPasswordChange }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError(""); // Clear any previous error
    setSuccess(""); // Clear any previous success message

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await fetch("/api/updateThrowPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onPasswordChange) onPasswordChange(); // Notify parent of the change if needed
    } catch (error) {
      console.error("Error updating password:", error);
      setError(error.message || "Something went wrong. Please try again.");
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
      <h3>Change Throw Password</h3>
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        style={{ padding: "10px", width: "95%", marginBottom: "10px" }}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ padding: "10px", width: "95%", marginBottom: "10px" }}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ padding: "10px", width: "95%", marginBottom: "10px" }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
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
};

export default ChangePasswordModal;
