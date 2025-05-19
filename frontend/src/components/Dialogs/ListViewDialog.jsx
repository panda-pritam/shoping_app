import React, {useEffect, useState} from "react";
import {useTable, useGlobalFilter} from "react-table";
import {Pencil, Trash2, ZoomIn} from "lucide-react";
import axios from "axios";
import {toast} from "react-toastify";

const downloadCSV = data => {
  if (!data.length) return;
  const replacer = (key, value) => (value === null ? "" : value);
  const header = Object.keys(data[0]);
  const csv = [
    header.join(","),
    ...data.map(row =>
      header
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "storage_facilities.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ListViewDialog({
  data,
  setOpen,
  open,
  getZoom,
  openEdit,
  setOpenEdit,
  setSelectedData,
}) {
  const [filteredList, setFilteredList] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const TYPE_CHOICES = [
    {value: "drone", label: "Drone"},
    {value: "iot", label: "IoT Devices"},
    {value: "satellite", label: "Satellite Image"},
    {value: "distribution", label: "Distribution"},
    {value: "other", label: "Other"},
  ];

  useEffect(() => {
    if (open && data) {
      setFilteredList([...data]);
    }
  }, [open, data]);

  useEffect(() => {
    let filtered = [...data];

    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    if (searchInput.trim()) {
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          item.location_name.toLowerCase().includes(searchInput.toLowerCase())
      );
    }
    setFilteredList(filtered);
  }, [searchInput, typeFilter, data]);

  const handleDelete = async id => {
    try {
      let api_res = await axios.delete(
        `http://178.236.185.244:8008/locations/${id}/`
      );
      if (api_res) {
        toast.success("Deleted Successfully");
        setFilteredList(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleZoom = (lat, lng) => {
    getZoom(lat, lng);
    setOpen(false);
  };

  const handleEdit = item => {
    setSelectedData(item);
    setOpen(false);
    setOpenEdit(true);
  };

  const columns = React.useMemo(
    () => [
      {Header: "ID", accessor: "id"},
      {Header: "Name", accessor: "name"},
      {Header: "Location", accessor: "location_name"},
      {Header: "Type", accessor: "type"},
      {Header: "Status", accessor: "status"},
      {Header: "Last Serviced", accessor: "last_serviced_date"},
      {
        Header: "Coordinates",
        accessor: "coordinates",
        Cell: ({row}) => (
          <span>{`${row.original.lat}, ${row.original.lng}`}</span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({row}) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleZoom(row.original.lat, row.original.lng)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Zoom"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Edit"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const tableInstance = useTable(
    {columns, data: filteredList},
    useGlobalFilter
  );

  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} =
    tableInstance;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 overflow-scroll">
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setOpen(false)}
      />

      <div className="relative z-10 w-11/12 max-w-6xl p-6 overflow-auto bg-white text-black rounded-2xl shadow-2xl max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Storage Facilities
        </h2>

        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or location..."
            className="p-2 border rounded w-full max-w-sm"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />

          <select
            className="p-2 border rounded"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {TYPE_CHOICES.map(choice => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => downloadCSV(filteredList)}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>

        <table
          {...getTableProps()}
          className="w-full text-sm text-left border border-gray-300"
        >
          <thead className="bg-black text-white">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps()}
                    className="p-2 border border-gray-300"
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="hover:bg-gray-100">
                    {row.cells.map(cell => (
                      <td
                        {...cell.getCellProps()}
                        className="p-2 border border-gray-300"
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-600">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
