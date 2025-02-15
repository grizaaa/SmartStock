"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ScanTable from "../../components/ScanTable"; // Import the ScanTable component
import styles from "./styles.module.css";

export default function Scan() {
  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [error, setError] = useState("");
  const [locator, setLocator] = useState(""); // State for storing the locator input
  const [isLocatorValid, setIsLocatorValid] = useState(false); // State for locator validation
  const [scanResult, setScanResult] = useState(""); // State for storing the last scanned result
  const [scanRecords, setScanRecords] = useState([]); // State for storing all scanned records
  const debounceTimeoutRef = useRef(null);

  const { data: session, status } = useSession();
  const loading = status === "loading";
  const barcodeInputRef = useRef(null);
  const locatorInputRef = useRef(null); // Ref for the locator input field
  const qrInputRef = useRef(null); // Ref for the QR code input field

  useEffect(() => {
    // Focus on the barcode input if the session is fully loaded
    if (barcodeInputRef.current && !loading) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 100); // Adjust the delay if necessary
    }
  }, [loading, workerBarcode]); // Watch for session loading state and workerBarcode changes

  // Debounced function for validating worker barcode
  useEffect(() => {
    if (workerBarcode.length > 0) {
      // Clear any existing timeout before setting a new one
      clearTimeout(debounceTimeoutRef.current);

      // Set a new timeout to validate the barcode after 300ms
      debounceTimeoutRef.current = setTimeout(() => {
        validateWorkerBarcode(workerBarcode);
      }, 500);
    } else {
      setIsWorkerValid(false);
      setError("");
    }

    // Cleanup the timeout when the component unmounts or when workerBarcode changes
    return () => clearTimeout(debounceTimeoutRef.current);
  }, [workerBarcode]);

  useEffect(() => {
    if (isLocatorValid && qrInputRef.current && !qrInputRef.current.disabled) {
      setTimeout(() => {
        qrInputRef.current.focus();
      }, 100);
    }
  }, [isLocatorValid]);

  if (loading) {
    return <p>Loading...</p>;
  }

  const router = useRouter();

  if (!session) {
    router.push("/auth");
    return null;
  }

  // Function to validate worker barcode by calling API
  const validateWorkerBarcode = async (barcode) => {
    try {
      const response = await fetch("/api/validateWorker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerBarcode: barcode }),
      });
      const data = await response.json();
      setIsWorkerValid(data.valid);

      if (data.valid) {
        setError("");
        // Autofocus the locator input field after worker validation success
        if (locatorInputRef.current) {
          locatorInputRef.current.focus();
        }
      } else {
        setError("Invalid worker barcode. Please enter a valid barcode.");
      }
    } catch (error) {
      console.error("Error validating worker barcode:", error);
      setError("An error occurred during validation.");
    }
  };

  // Function to validate locator input by calling API
  const validateLocator = async (locatorValue) => {
    try {
      const response = await fetch("/api/validateLocator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locator: locatorValue }),
      });
      const data = await response.json();
      setIsLocatorValid(data.valid);

      if (data.valid) {
        setError("");
        // Autofocus the QR code input field after locator validation success
        if (qrInputRef.current) {
          qrInputRef.current.focus();
        }
      } else {
        setError("Invalid locator. Please enter a valid locator.");
      }
    } catch (error) {
      console.error("Error validating locator:", error);
      setError("An error occurred during validation.");
    }
  };

  // Update worker barcode input and validate it
  const handleWorkerBarcodeChange = (e) => {
    const barcode = e.target.value;
    setWorkerBarcode(barcode);

    if (barcode.length > 0) {
      validateWorkerBarcode(barcode);
    } else {
      setIsWorkerValid(false);
      setError("");
    }
  };

  // Handle locator input change and validate it
  const handleLocatorChange = (event) => {
    const locatorValue = event.target.value;
    setLocator(locatorValue);

    if (locatorValue.length > 0) {
      validateLocator(locatorValue);
    } else {
      setIsLocatorValid(false);
      setError("");
    }
  };

  // Handle item scan input change when the QR code is scanned
  const handleInputChange = (event) => {
    const scannedData = event.target.value;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setScanResult(scannedData);

      const [po_no, part, qty, id, barcode] = scannedData.split(".");
      if (po_no && part && qty && id && barcode) {
        const existingRecordIndex = scanRecords.findIndex(
          (record) => record.id === parseInt(id, 10)
        );

        if (existingRecordIndex !== -1) {
          setScanRecords((prevRecords) => {
            const updatedRecords = [...prevRecords];
            updatedRecords[existingRecordIndex] = {
              ...updatedRecords[existingRecordIndex],
              locator,
              qty: parseInt(qty, 10),
            };
            return updatedRecords;
          });
        } else {
          const newRecord = {
            locator,
            po_no,
            part,
            qty: parseInt(qty, 10),
            id: id,
            barcode,
          };
          setScanRecords((prevRecords) => [...prevRecords, newRecord]);
        }
      }

      event.target.value = ""; // Optionally clear input after processing
    }, 500); // Debounce delay
  };

  // Function to handle the submission of records
  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/submitRecords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scanRecords), // Send records with timeSubmitted preserved
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success:", result);

      // Clear all records after successful submission
      setScanRecords([]); // Reset scanRecords to an empty array
      setScanResult(""); // Clear the last scan result
      setLocator(""); // Optionally clear the locator input
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const canPrint = () => {
    return isWorkerValid && isLocatorValid && scanRecords.length > 0;
  };

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 6px 14px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#EDEDEDF0",
      }}
    >
      {/* Input field for locator where the items will be stored */}
      <div style={{ display: "flex", flexDirection: "row", gap: "50px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="barcodeInput"
              style={{
                fontSize: "18px",
                width: "89px",
                textAlign: "right",
              }}
            >
              Barcode:
            </label>
            <input
              id="barcodeInput"
              type="text"
              placeholder="Enter Barcode"
              value={workerBarcode}
              onChange={handleWorkerBarcodeChange}
              ref={barcodeInputRef}
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
            />
          </div>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="locatorInput"
              style={{
                fontSize: "18px",
                width: "85px",
                textAlign: "right",
              }}
            >
              Locator:
            </label>
            <input
              id="locatorInput"
              type="text"
              placeholder="Enter Locator"
              value={locator}
              onChange={handleLocatorChange}
              ref={locatorInputRef} // Add ref to the locator input
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
              disabled={!isWorkerValid}
            />
          </div>
          <div style={{ display: "grid" }}>
            <label
              htmlFor="qrInput"
              style={{
                fontSize: "18px",
                width: "94px",
                textAlign: "right",
              }}
            >
              QR Code:
            </label>
            <input
              id="qrInput"
              type="text"
              placeholder="Scan QR Code here"
              onChange={handleInputChange}
              ref={qrInputRef} // Add ref to the QR code input
              style={{
                width: "300px",
                padding: "10px",
                fontSize: "16px",
                marginLeft: "10px",
              }}
              disabled={!isWorkerValid || !isLocatorValid}
            />
          </div>
        </div>
        <div>
          <h2>Latest Scan Result:</h2>
          <div id="result" style={{ marginBottom: "18px" }}>
            <span className="result">{scanResult}</span>
          </div>
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className={styles.buttonAnimate}
            disabled={!canPrint()}
          >
            Submit Records
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>

      {/* Render the ScanTable component */}
      <ScanTable scanRecords={scanRecords} />
    </div>
  );
}
