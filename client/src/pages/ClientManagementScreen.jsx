// client/src/pages/ClientManagementScreen.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavbar from "../components/BottomNavbar";
import api from "../utils/api";
import "../App.css";
import "./styles/ClientManagementScreen.css"; // Create this CSS file next

const ClientManagementScreen = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const measurement = {
    chest: Array(2).fill(""),
    waist: 0,
    roundsleeve: Array(3).fill(""),
    shoulder: 0,
    toplength: 0,
    trouserlength: 0,
    thigh: 0,
    knee: 0,
    ankle: 0,
    neck: 0,
    sleeveLength: Array(3).fill(""),
  };

  // State for the new/edit client form
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState(null); // Client being edited
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    measurement: measurement,
  });

  const testData = {
    _id: { $oid: "685d75da2152fa388fdf32e8" },
    name: "Helen",
    email: "joelgonzjoel00@gmail.com",
    phone: "0808775748",
    address: "amagu",
    createdBy: { $oid: "68555286c7f73d0628366be9" },
    measurement: {
        chest: [0,89],
        waist: 0,
        roundsleeve:[223,56,6],
        shoulder: 0,
        toplength: 0,
        trouserlength: 0,
        thigh: 0,
        knee: 0,
        ankle: 0,
        neck: 0,
        sleeveLength: [56,90,67],
    },
    createdAt: { $date: { $numberLong: "1750955482747" } },
    updatedAt: { $date: { $numberLong: "1750955482747" } },
    __v: { $numberInt: "0" },
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/clients");
      if(data){
          setClients(data);
         
      }else{
        setClients(testData)
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to fetch clients.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("measurement.")) {
      const path = name.split(".");
      const field = path[1];

      setFormData((prev) => {
        // For array fields (path has 3 parts: measurement.field.index)
        if (path.length === 3) {
          const index = parseInt(path[2]);
          // Ensure the array exists and is the correct length
          const currentArray = Array.isArray(prev.measurement[field])
            ? prev.measurement[field]
            : [];

          return {
            ...prev,
            measurement: {
              ...prev.measurement,
              [field]: [
                ...currentArray.slice(0, index),
                value === "" ? "" : Number(value),
                ...currentArray.slice(index + 1),
              ],
            },
          };
        }
        // For regular number fields
        return {
          ...prev,
          measurement: {
            ...prev.measurement,
            [field]: value === "" ? "" : Number(value),
          },
        };
      });
    } else {
      // Handle top-level fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddClientClick = () => {
    setCurrentClient(null); // Clear any client being edited
    setFormData({
      // Reset form for new client
      name: "",
      phone: "",
      email: "",
      address: "",
      measurement: measurement, // Use the default measurement object
    });
    setIsFormVisible(true);
    setSuccessMessage(""); // Clear any previous success message
    setError(""); // Clear any previous error
  };

  const handleEditClientClick = (client) => {
    setCurrentClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      address: client.address || "",
      measurement: client.measurement || measurement, // Use existing measurement or default
    });
    setIsFormVisible(true);
    setSuccessMessage("");
    setError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      if (currentClient) {
        // Update existing client

        const { data } = await api.put(
          `/clients/${currentClient._id}`,
          formData
        );
        setClients(
          clients.map((client) => (client._id === data._id ? data : client))
        );
        console.log(clients);
        setSuccessMessage("Client updated successfully!");
      } else {
        // Add new client
        const { data } = await api.post("/clients", formData);
        setClients([data, ...clients]); // Add new client to the top
        setSuccessMessage("Client added successfully!");
      }
      setIsFormVisible(false); // Hide form after submission
      fetchClients(); // Re-fetch to ensure latest data and sort order
    } catch (err) {
      console.error("Client form submission error:", err);
      setError(
        err.response?.data?.msg ||
          "Failed to save client. Please check your inputs."
      );
      // For validation errors from backend, display specific error messages
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((e) => e.msg).join(", "));
      }
    }
  };

  //for searching clients
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async (clientId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this client? This cannot be undone."
      )
    ) {
      setError("");
      setSuccessMessage("");
      try {
        await api.delete(`/clients/${clientId}`);
        setClients(clients.filter((client) => client._id !== clientId));
        setSuccessMessage("Client deleted successfully!");
      } catch (err) {
        console.error("Failed to delete client:", err);
        setError(
          err.response?.data?.msg ||
            "Failed to delete client. They might have associated bookings. Or you do not have permission to delete this client."
        );
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Clients...</div>;
  }

  return (
    <div className="client-management-container background">
      <header className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          &larr; Back
        </button>
        <h1 className="detail-heading">Client Management</h1>
        <button
          onClick={handleAddClientClick}
          className="btn btn-primary add-button"
        >
          Add New Client
        </button>
      </header>

      <main className="client-management-content">
        {error && <p className="alert alert-error">{error}</p>}
        {successMessage && (
          <p className="alert alert-success">{successMessage}</p>
        )}

        {isFormVisible && (
          <div className="client-form-overlay">
            <div className="client-form-popup">
              <h2 className="form-heading">
                {currentClient ? "Edit Client" : "Add New Client"}
              </h2>
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel" // Use type tel for phone numbers
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email (Optional)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address (Optional)</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="form-control"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="measurements">Measurements</label>
                  <div id="measurements">
                    {/* For top measurements */}

                    <span>Top</span>
                    <div id="top">
                      <span>N</span>{" "}
                      <input
                        type="number"
                        id="neck"
                        name="measurement.neck"
                        placeholder="Neck (inches)"
                        value={formData.measurement.neck || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>SH</span>{" "}
                      <input
                        type="number"
                        id="shoulder"
                        name="measurement.shoulder"
                        placeholder="Shoulder (inches)"
                        value={formData.measurement.shoulder || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>CH</span>{" "}
                      {[0, 1].map((index) => (
                        <input
                          key={`chest-${index}`}
                          type="number"
                          id="chest"
                          name={`measurement.chest.${index}`}
                          placeholder="Chest (inches)"
                          value={formData.measurement.chest[index] || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      ))}
                      <span>SL</span>{" "}
                      {[0, 1, 2].map((index) => (
                        <input
                          key={`sleeveLength-${index}`}
                          type="number"
                          name={`measurement.sleeveLength.${index}`}
                          value={formData.measurement.sleeveLength[index] || ""}
                          onChange={handleMeasurementChange}
                          placeholder={`sleeve length ${index + 1}`}
                          className="form-control"
                        />
                      ))}
                      <span>RS</span>{" "}
                      {[0, 1, 2].map((index) => (
                        <input
                          key={`roundsleeve-${index}`}
                          type="number"
                          name={`measurement.roundsleeve.${index}`}
                          value={formData.measurement.roundsleeve[index] || ""}
                          onChange={handleMeasurementChange}
                          placeholder={`Measurement ${index + 1}`}
                          className="form-control"
                        />
                      ))}
                      <span>L</span>{" "}
                      <input
                        type="number"
                        id="toplength"
                        name="measurement.toplength"
                        placeholder="Top Length (inches)"
                        value={formData.measurement.toplength || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                    </div>

                    {/* For trouser measurements */}
                    <span>Down</span>
                    <div id="down">
                      <span>W</span>{" "}
                      <input
                        type="number"
                        id="waist"
                        name="measurement.waist"
                        placeholder="Waist (inches)"
                        value={formData.measurement.waist || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>LP</span>{" "}
                      <input
                        type="number"
                        id="thigh"
                        name="measurement.thigh"
                        placeholder="Thigh (inches)"
                        value={formData.measurement.thigh || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>K</span>{" "}
                      <input
                        type="number"
                        id="knee"
                        name="measurement.knee"
                        placeholder="Knee (inches)"
                        value={formData.measurement.knee || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>C</span>{" "}
                      <input
                        type="number"
                        id="ankle"
                        name="measurement.ankle"
                        placeholder="Ankle (inches)"
                        value={formData.measurement.ankle || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                      <span>L</span>{" "}
                      <input
                        type="number"
                        id="trouserlength"
                        name="measurement.trouserlength"
                        placeholder="Trouser Length (inches)"
                        value={formData.measurement.trouserlength || ""}
                        onChange={handleMeasurementChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-accent save-button">
                    {currentClient ? "Update Client" : "Add Client"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="btn btn-secondary cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Client List */}
        <div className="client-list">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control search-input"
            />
          </div>
          {clients.length === 0 && !loading ? (
            <p className="no-clients-message">
              No clients found. Add a new client to get started!
            </p>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div key={client._id} className="client-card">
                <div className="client-info">
                  <h3>{client.name}</h3>
                  <p>
                    <strong>Phone:</strong> {client.phone}
                  </p>
                  {client.email && (
                    <p>
                      <strong>Email:</strong> {client.email}
                    </p>
                  )}
                  {client.address && (
                    <p>
                      <strong>Address:</strong> {client.address}
                    </p>
                  )}
                  {client.measurement && (
                    <p>
                      <strong>Measurements:</strong>{" "}
                      Chest:{" "}
                      {client.measurement.chest.join(", ")}, Waist:{" "}
                      {client.measurement.waist}, Roundsleeve:{" "}
                      {client.measurement.roundsleeve.join(", ")}, Shoulder:{" "}
                      {client.measurement.shoulder}, Top Length:{" "}
                      {client.measurement.toplength}, Trouser Length:{" "}
                      {client.measurement.trouserlength}, Thigh:{" "}
                      {client.measurement.thigh}, Knee:{" "}
                      {client.measurement.knee}, Ankle:{" "}
                      {client.measurement.ankle}, Neck:{" "}
                      {client.measurement.neck}, Sleeve Lengths:{" "}
                      {client.measurement.sleeveLength.join(", ")}
                    </p>
                  )}
                </div>
                <div className="client-actions">
                  <button
                    onClick={() => handleEditClientClick(client)}
                    className="btn btn-info edit-client-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client._id)}
                    className="btn btn-danger delete-client-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-clients-message">No clients found.</p>
          )}
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
};

export default ClientManagementScreen;
