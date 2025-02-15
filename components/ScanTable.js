import React from "react";

export default function ScanTable({ scanRecords }) {
  return (
    <div
      style={{
        maxHeight: "calc(78vh - 100px)", // Set a max height for scroll
        overflowY: "auto", // Enable vertical scrolling if content overflows
        overflowX: "auto", // Enable horizontal scrolling if needed
        marginTop: "20px",
        border: "1px solid #ddd", // Add border around the table container
        borderRadius: "4px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead style={{ position: "sticky", top: "0", zIndex: "1" }}>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Locator
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              PO
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Part Number
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Quantity
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              ID
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Barcode
            </th>
          </tr>
        </thead>
        <tbody>
          {scanRecords.map((record, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
              }}
            >
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.locator}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.po_no}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.part}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.qty}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.id}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                {record.barcode}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
