"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { debounce } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
const InvTable = React.lazy(() => import("../../components/InvTable"));
const ThrowModal = React.lazy(() => import("../../components/ThrowModal"));
const ChangePasswordModal = React.lazy(() =>
  import("../../components/ChangePasswordModal")
);

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering
  const [records, setRecords] = useState([]); // Initialize as an empty array
  const [filteredRecords, setFilteredRecords] = useState([]); // Initialize as an empty array
  const [showThrowMenu, setShowThrowMenu] = useState(false); // State to control the display of the throw menu
  const [selectedRecord, setSelectedRecord] = useState(null); // State to store the currently selected record for throw action
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Fetch records from the database on component mount
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch("/api/getRecords", {
          next: { revalidate: 0 },
          cache: "no-store",
        });
        const data = await response.json();
        setRecords(data || []); // Fallback to an empty array if data is undefined
        setFilteredRecords(data || []); // Fallback to an empty array if data is undefined
      } catch (error) {
        console.error("Error fetching records:", error);
      }
    };

    fetchRecords();
  }, []);

  // Debounced search handler to avoid frequent filtering
  const handleSearchChange = useCallback(
    debounce((term) => {
      if (term === "") {
        setFilteredRecords(records); // Reset to all records if search term is empty
      } else {
        const filtered = records.filter(
          (record) =>
            record.part.toLowerCase().includes(term.toLowerCase()) ||
            record.locator.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredRecords(filtered);
      }
    }, 500),
    [records]
  );

  // Handle throwing items
  const handleThrowSubmit = async (quantityToThrow) => {
    if (!selectedRecord || !quantityToThrow || quantityToThrow <= 0) {
      alert("Invalid quantity");
      return;
    }

    try {
      const remainingQty = selectedRecord.qty - quantityToThrow;

      const requestBody = {
        id: selectedRecord._id,
        qtyToThrow: quantityToThrow,
        remainingQty: remainingQty,
      };

      const response = await fetch("/api/updateRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update record.");
      }

      // Update the state for the records in the UI
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record._id === selectedRecord._id
            ? { ...record, qty: remainingQty }
            : record
        )
      );

      setFilteredRecords((prevFilteredRecords) =>
        prevFilteredRecords.map((record) =>
          record._id === selectedRecord._id
            ? { ...record, qty: remainingQty }
            : record
        )
      );

      console.log(`Successfully threw ${quantityToThrow} of`, selectedRecord);

      setShowThrowMenu(false); // Close modal
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to throw quantity, please try again.");
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch("/api/updateThrowPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password.");
      }

      alert("Password updated successfully.");
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password. Please try again.");
    }
  };

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const role = session?.user?.role;

  if (loading) {
    return <p>Loading...</p>;
  }

  const router = useRouter();

  if (!session) {
    router.push("/auth");
    return null;
  }

  // Update searchTerm state as user types
  const onSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Calculate the total quantity of filtered records
  const totalQuantity = filteredRecords.reduce(
    (sum, record) => sum + record.qty,
    0
  );

  // Handle record click to show the throw menu
  const handleRecordClick = (record) => {
    setSelectedRecord(record); // Set the selected record
    setShowThrowMenu(true); // Show the throw menu
  };

  return (
    <div
      style={{
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#EDEDEDF0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        {/* Search Input */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by Part or Locator"
            value={searchTerm}
            onChange={onSearchTermChange}
            style={{ padding: "10px", width: "300px" }}
          />
          <button
            className={styles.buttonAnimate}
            onClick={() => handleSearchChange(searchTerm)}
          >
            Search
          </button>
        </div>
        {role === "super" && (
          <button
            onClick={() => setShowPasswordModal(true)}
            className={styles.buttonAnimate}
          >
            Change Password
          </button>
        )}
        <div>
          <h3>Results</h3>
          <p>
            {filteredRecords.length} records | Total Quantity: {totalQuantity}
          </p>
        </div>
      </div>

      {/* Ensure records are not undefined */}
      <Suspense fallback={<div>Loading table...</div>}>
        <InvTable
          records={filteredRecords}
          handleRecordClick={handleRecordClick}
        />
      </Suspense>

      {/* Throw Modal */}
      {(role === "super" || role === "admin") &&
        showThrowMenu &&
        selectedRecord && (
          <Suspense fallback={<div>Loading modal...</div>}>
            <ThrowModal
              selectedRecord={selectedRecord}
              onClose={() => setShowThrowMenu(false)}
              onSubmit={handleThrowSubmit}
            />
          </Suspense>
        )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default InventoryPage;
