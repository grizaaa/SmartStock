import { useState, useCallback } from "react";
import { debounce } from "lodash";
import QRCodeTemplate from "./QRCodeTemplate"; // Import your template component
import QRCodeTemplateA4 from "./QRCodeTemplateA4"; // Import your template component
import { createRoot } from "react-dom/client"; // Use React 18 createRoot
import styles from "./QRCodeGenerator.module.css";

const QRCodeGenerator = () => {
  const [workerBarcode, setWorkerBarcode] = useState("");
  const [isWorkerValid, setIsWorkerValid] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copy, setCopy] = useState(1);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(true);

  // Function to validate worker barcode by calling API
  const validateWorkerBarcode = useCallback(
    debounce(async (barcode) => {
      try {
        const response = await fetch("/api/validateWorker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerBarcode: barcode }),
        });
        const data = await response.json();
        setIsWorkerValid(data.valid);

        if (!data.valid) {
          setError("Invalid worker barcode. Please enter a valid barcode.");
        } else {
          setError("");
        }
      } catch (error) {
        console.error("Error validating worker barcode:", error);
        setError("An error occurred during validation.");
      }
    }, 300),
    []
  );

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

  // Function to handle PO number input
  const handlePoNumberChange = (e) => setPoNumber(e.target.value);

  // Function to generate a unique ID
  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    return `${timestamp}${randomNum}`;
  };

  // Debounced part number autocomplete
  const fetchSuggestions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetch(
          `/api/items?partNumber=${encodeURIComponent(inputValue)}`
        );
        const data = await response.json();
        setSuggestions(data);
        setIsSuggestionsVisible(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 500),
    []
  );

  // Function to handle part number input and fetch autocomplete suggestions
  const handlePartNumberChange = (e) => {
    const inputValue = e.target.value;
    setPartNumber(inputValue);

    if (inputValue.length > 2) {
      fetchSuggestions(inputValue);
    } else {
      setSuggestions([]);
    }
  };

  // Handle key press (up/down arrows and Enter key)
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      selectSuggestion(activeSuggestionIndex);
    }
  };

  // Handle suggestion selection by clicking or pressing Enter
  const selectSuggestion = (index) => {
    const selected = suggestions[index];
    setPartNumber(selected.part_number);
    setQuantity(selected.quantity);
    setIsSuggestionsVisible(false); // Hide suggestions after selection
    setActiveSuggestionIndex(-1);
  };

  // Highlight matched part in suggestions (e.g., "HTV" in "HTV41-4399T")
  const highlightMatch = (text, match) => {
    if (!text || !match) return text;

    const regex = new RegExp(`(${match})`, "i");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className={styles.match}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Function to validate input fields
  const validateInputs = () => {
    if (isNaN(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return false;
    }

    if (isNaN(copy) || copy <= 0) {
      setError("Copy must be a positive number.");
      return false;
    }

    setError(""); // Clear any previous errors
    return true;
  };

  const canPrint = () => {
    return (
      isWorkerValid &&
      (poNumber?.trim() || "") !== "" &&
      (partNumber?.trim() || "") !== "" && // Use optional chaining
      quantity > 0 &&
      copy > 0
    );
  };

  const handlePrint = () => {
    if (!validateInputs()) {
      return; // Do not proceed if inputs are not valid
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Print QR Codes</title>
        <style>
        html {
          width: 80mm;
          height: 80mm;
        }
        body {
          width: 80mm; /* Ensure the body width matches the thermal paper width */
          height: 80mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        #print-root {
         width: 100%;
         height: 100%;
        }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);

    printWindow.document.close();

    const printRoot = printWindow.document.getElementById("print-root");
    const root = createRoot(printRoot); // Initialize React in the print window

    const templates = [];
    for (let i = 0; i < copy; i++) {
      const uniqueId = generateUniqueId();
      templates.push(
        <QRCodeTemplate
          key={i}
          poNumber={poNumber}
          partNumber={partNumber}
          quantity={quantity}
          uniqueId={uniqueId}
          workerBarcode={workerBarcode}
        />
      );
    }

    root.render(<>{templates}</>); // Render all templates within the print window

    // Trigger the print
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintA4 = () => {
    if (!validateInputs()) {
      return; // Do not proceed if inputs are not valid
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Print QR Codes on A4</title>
      <style>
      @page {
        size: A4 landscape; /* Change this if you're using a different paper size */
        margin: 1mm;
      }
      body {
        width: 210mm; /* A4 paper width */
        height: 297mm; /* A4 paper height */
        margin: 0;
        padding: 0mm; 
        font-family: Arial, sans-serif;
        box-sizing: border-box;
      }

      #print-root {
        width: 100%; 
        height: 100%; 
        display: grid;
        grid-template-columns: repeat(6, 1fr); /* 6 columns per row */
        grid-template-rows: repeat(4, 1fr); /* Four rows to fit 3x4 layout */
        gap: 1mm;
        page-break-inside: avoid;
      }
      </style>
    </head>
    <body>
      <div id="print-root"></div>
    </body>
    </html>
  `);

    printWindow.document.close();

    const printRoot = printWindow.document.getElementById("print-root");
    const root = createRoot(printRoot); // Initialize React in the print window

    const templates = [];
    for (let i = 0; i < copy; i++) {
      // 12 QR Codes for 3x4 grid
      const uniqueId = generateUniqueId();
      templates.push(
        <QRCodeTemplateA4
          key={i}
          poNumber={poNumber}
          partNumber={partNumber}
          quantity={quantity}
          uniqueId={uniqueId}
          workerBarcode={workerBarcode} // Pass the worker barcode to the A4 template
        />
      );
    }

    root.render(<>{templates}</>); // Render all templates within the print window

    // Trigger the print
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className={styles.container}>
      {/* Worker Barcode Field */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Worker Barcode:</label>
        <input
          type="text"
          value={workerBarcode}
          onChange={handleWorkerBarcodeChange}
          className={styles.input}
        />
      </div>

      {/* PO Number Field */}
      <div className={styles.formGroup}>
        <label className={styles.label}>PO Number:</label>
        <input
          type="text"
          value={poNumber}
          onChange={handlePoNumberChange}
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>

      {/* Part Number Field with Autocomplete */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Part Number:</label>
        <input
          type="text"
          value={partNumber}
          onChange={handlePartNumberChange}
          onKeyDown={handleKeyDown}
          className={styles.input}
          disabled={!isWorkerValid}
        />

        {suggestions.length > 0 && isSuggestionsVisible && (
          <ul className={styles.suggestionsList} role="listbox">
            {suggestions.map((item, index) => (
              <li
                key={index}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                className={`${styles.suggestionItem} ${
                  index === activeSuggestionIndex ? styles.active : ""
                }`}
                onClick={() => selectSuggestion(index)}
              >
                {highlightMatch(
                  item.part_number || "Not Found",
                  partNumber || ""
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity Field */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Quantity:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>

      {/* Copy Field */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Copy:</label>
        <input
          type="number"
          value={copy}
          onChange={(e) => setCopy(e.target.value)}
          min="1"
          className={styles.input}
          disabled={!isWorkerValid}
        />
      </div>

      {/* Error Display */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Print Buttons */}
      <div className={styles.buttonGroup}>
        <button
          onClick={handlePrint}
          className={styles.button}
          disabled={!canPrint()}
        >
          Print QR Codes
        </button>
        <button
          onClick={handlePrintA4}
          className={styles.button}
          disabled={!canPrint()}
        >
          Print on A4
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
