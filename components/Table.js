import React from "react";
import { useTable, useFilters, useGlobalFilter, useSortBy } from "react-table";
import classes from "./Table.module.css";

// Table component
const Table = React.memo(({ columns, data }) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          sortBy: [
            {
              id: "time_updated", // The accessor for the column to sort by
              desc: true, // Sort in descending order (most recent first)
            },
          ],
        },
      },
      useFilters, // Use filters hook for individual column filtering
      useGlobalFilter, // Use global filter hook for global search
      useSortBy // Enable sorting functionality
    );

  return (
    <div className={classes.tableContainer}>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const headerGroupProps = headerGroup.getHeaderGroupProps();
            return (
              <tr key={headerGroupProps.key} style={headerGroupProps.style}>
                {headerGroup.headers.map((column) => {
                  const headerProps = column.getHeaderProps(
                    column.getSortByToggleProps()
                  ); // Add sorting toggle props
                  return (
                    <th key={headerProps.key} style={headerProps.style}>
                      {column.render("Header")}
                      <input
                        style={{ marginTop: "5px", width: "90%" }}
                        onChange={(e) =>
                          column.setFilter(e.target.value || undefined)
                        }
                        placeholder={`Filter ${column.render("Header")}`}
                      />
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            const rowProps = row.getRowProps();
            return (
              <tr key={rowProps.key} style={rowProps.style}>
                {row.cells.map((cell) => {
                  const cellProps = cell.getCellProps();
                  return (
                    <td key={cellProps.key} style={cellProps.style}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default Table;
