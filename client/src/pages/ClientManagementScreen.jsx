// client/src/pages/ClientManagementScreen.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
const { id } = useParams(); // Destructure id from useParams()

  const defaultMeasurement = {
    chest: [0, 0],
    waist: 0,
    roundsleeve: [0, 0, 0],
    shoulder: 0,
    toplength: 0,
    trouserlength: 0,
    thigh: 0,
    knee: 0,
    ankle: 0,
    neck: 0,
    sleeveLength: [0, 0, 0],
  };

  // State for the new/edit client form
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState(null); // Client being edited or viewed
  const [viewingClientDetails, setViewingClientDetails] = useState(false); // New state for viewing details
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    measurement: defaultMeasurement,
  });

  useEffect(() => {
    const fetchClientById = async (clientId) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/clients/${clientId}`);
        if (data) {
          setCurrentClient(data);
          setViewingClientDetails(true); // Set to true for viewing
          setIsFormVisible(false); // Ensure form is hidden
        } else {
          setError("Client not found.");
        }
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to fetch client.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientById(id);
    } else {
      fetchClients();
      setViewingClientDetails(false); // Ensure viewing is false when not on a specific client page
    }
  }, [id]);

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/clients");
      setClients(data || []);
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
    const path = name.split(".");
    const field = path[1];

    setFormData((prev) => {
      const newMeasurement = { ...prev.measurement };

      if (path.length === 3) {
        // Array field
        const index = parseInt(path[2], 10);
        const newArray = [...newMeasurement[field]];
        newArray[index] = Number(value) || 0;
        newMeasurement[field] = newArray;
      } else {
        // Simple field
        newMeasurement[field] = Number(value) || 0;
      }

      return {
        ...prev,
        measurement: newMeasurement,
      };
    });
  };

  const handleAddClientClick = () => {
    setCurrentClient(null); // Clear any client being edited
    setFormData({
      // Reset form for new client
      name: "",
      phone: "",
      email: "",
      address: "",
      measurement: defaultMeasurement, // Use the default measurement object
    });
    setIsFormVisible(true);
    setViewingClientDetails(false); // Ensure viewing details is false when adding a new client
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
      measurement: { ...defaultMeasurement, ...client.measurement }, // Merge with default
    });
    setIsFormVisible(true);
    setViewingClientDetails(false); // Ensure viewing details is false when editing
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
        setSuccessMessage("Client updated successfully!");
        if (id) {
          setCurrentClient(data); // Update currentClient with the latest data
          setViewingClientDetails(true); // Go back to viewing details
          setIsFormVisible(false); // Hide form
        }
      } else {
        // Add new client
        const { data } = await api.post("/clients", formData);
        setClients([data, ...clients]); // Add new client to the top
        setSuccessMessage("Client added successfully!");
        if (id) {
          navigate('/clients'); // Navigate back to general client list if came from specific client view
        }
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
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
        if (currentClient && currentClient._id === clientId) {
          navigate('/clients'); // Navigate back to general client list if the viewed client was deleted
        }
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
        {viewingClientDetails || isFormVisible ? (
          <button onClick={() => navigate('/clients')} className="back-button">
            &larr; Back to Clients
          </button>
        ) : (
          <button onClick={() => navigate(-1)} className="back-button">
            &larr; Back
          </button>
        )}
        <h1 className="detail-heading">Client Management</h1>
        {!viewingClientDetails && !isFormVisible && (
          <button
            onClick={handleAddClientClick}
            className="btn btn-primary add-button"
          >
            Add New Client
          </button>
        )}
      </header>

      <main className="client-management-content">
        {error && <p className="alert alert-error">{error}</p>}
        {successMessage && (
          <p className="alert alert-success">{successMessage}</p>
        )}

        {viewingClientDetails && currentClient && (
          <div className="client-detail-card">
            <button onClick={() => navigate('/clients')} className="back-button">
              &larr; Back to Clients
            </button>
            <h2>Client Details</h2>
            <div className="detail-section">
              <h3>Personal Information</h3>
              <p><strong>Name:</strong> {currentClient.name}</p>
              <p><strong>Phone:</strong> {currentClient.phone}</p>
              {currentClient.email && <p><strong>Email:</strong> {currentClient.email}</p>}
              {currentClient.address && <p><strong>Address:</strong> {currentClient.address}</p>}
            </div>

            {currentClient.measurement && (
              <div className="detail-section">
                <h3>Measurements</h3>
                <h4>Top Measurements</h4>
                <p><strong>Neck:</strong> {currentClient.measurement.neck || 'N/A'}</p>
                <p><strong>Shoulder:</strong> {currentClient.measurement.shoulder || 'N/A'}</p>
                <p><strong>Chest:</strong> {currentClient.measurement.chest?.join(', ') || 'N/A'}</p>
                <p><strong>Sleeve Length:</strong> {currentClient.measurement.sleeveLength?.join(', ') || 'N/A'}</p>
                <p><strong>Round Sleeve:</strong> {currentClient.measurement.roundsleeve?.join(', ') || 'N/A'}</p>
                <p><strong>Top Length:</strong> {currentClient.measurement.toplength || 'N/A'}</p>

                <h4>Bottom Measurements</h4>
                <p><strong>Waist:</strong> {currentClient.measurement.waist || 'N/A'}</p>
                <p><strong>Thigh:</strong> {currentClient.measurement.thigh || 'N/A'}</p>
                <p><strong>Knee:</strong> {currentClient.measurement.knee || 'N/A'}</p>
                <p><strong>Ankle:</strong> {currentClient.measurement.ankle || 'N/A'}</p>
                <p><strong>Trouser Length:</strong> {currentClient.measurement.trouserlength || 'N/A'}</p>
              </div>
            )}

            <div className="detail-actions">
              <button
                onClick={() => handleEditClientClick(currentClient)}
                className="btn btn-info"
              >
                Edit Client
              </button>
            </div>
          </div>
        )}

        {!viewingClientDetails && isFormVisible && (
          <div className="client-form-overlay">
            <div className="client-form-popup">
              <h2 className="form-heading">
                {currentClient ? "Edit Client" : "Add New Client"}
              </h2>
              <form onSubmit={handleFormSubmit}>
                <div className="form-row">
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
                </div>
                <div className="form-row">
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
                </div>
                <div className="form-group full-width">
                  <label htmlFor="measurements">Measurements</label>
                  <div id="measurements">
                    <h4>Top Measurements</h4>
                    <div className="measurement-row">
                      <div className="measurement-group">
                        <span>Neck (N)</span>
                        <input
                          type="number"
                          id="neck"
                          name="measurement.neck"
                          placeholder="Neck"
                          value={formData.measurement.neck || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                      <div className="measurement-group">
                        <span>Shoulder (SH)</span>
                        <input
                          type="number"
                          id="shoulder"
                          name="measurement.shoulder"
                          placeholder="Shoulder"
                          value={formData.measurement.shoulder || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                      <div className="measurement-group">
                        <span>Chest (CH)</span>
                        {[0, 1].map((index) => (
                          <input
                            key={`chest-${index}`}
                            type="number"
                            id="chest"
                            name={`measurement.chest.${index}`}
                            placeholder={`Chest ${index + 1}`}
                            value={formData.measurement.chest[index] || ""}
                            onChange={handleMeasurementChange}
                            className="form-control"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="measurement-row">
                      <div className="measurement-group">
                        <span>Sleeve Length (SL)</span>
                        {[0, 1, 2].map((index) => (
                          <input
                            key={`sleeveLength-${index}`}
                            type="number"
                            name={`measurement.sleeveLength.${index}`}
                            value={formData.measurement.sleeveLength[index] || ""}
                            onChange={handleMeasurementChange}
                            placeholder={`SL ${index + 1}`}
                            className="form-control"
                          />
                        ))}
                      </div>
                      <div className="measurement-group">
                        <span>Round Sleeve (RS)</span>
                        {[0, 1, 2].map((index) => (
                          <input
                            key={`roundsleeve-${index}`}
                            type="number"
                            name={`measurement.roundsleeve.${index}`}
                            value={formData.measurement.roundsleeve[index] || ""}
                            onChange={handleMeasurementChange}
                            placeholder={`RS ${index + 1}`}
                            className="form-control"
                          />
                        ))}
                      </div>
                      <div className="measurement-group">
                        <span>Top Length (L)</span>
                        <input
                          type="number"
                          id="toplength"
                          name="measurement.toplength"
                          placeholder="Top Length"
                          value={formData.measurement.toplength || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <h4>Bottom Measurements</h4>
                    <div className="measurement-row">
                      <div className="measurement-group">
                        <span>Waist (W)</span>
                        <input
                          type="number"
                          id="waist"
                          name="measurement.waist"
                          placeholder="Waist"
                          value={formData.measurement.waist || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                      <div className="measurement-group">
                        <span>Thigh (T)</span>
                        <input
                          type="number"
                          id="thigh"
                          name="measurement.thigh"
                          placeholder="Thigh"
                          value={formData.measurement.thigh || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                      <div className="measurement-group">
                        <span>Knee (K)</span>
                        <input
                          type="number"
                          id="knee"
                          name="measurement.knee"
                          placeholder="Knee"
                          value={formData.measurement.knee || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="measurement-row">
                      <div className="measurement-group">
                        <span>Ankle (A)</span>
                        <input
                          type="number"
                          id="ankle"
                          name="measurement.ankle"
                          placeholder="Ankle"
                          value={formData.measurement.ankle || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                      <div className="measurement-group">
                        <span>Trouser Length (L)</span>
                        <input
                          type="number"
                          id="trouserlength"
                          name="measurement.trouserlength"
                          placeholder="Trouser Length"
                          value={formData.measurement.trouserlength || ""}
                          onChange={handleMeasurementChange}
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-accent save-button">
                    {currentClient ? "Update Client" : "Add Client"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormVisible(false);
                      if (id) {
                        setViewingClientDetails(true);
                      }
                    }}
                    className="btn btn-secondary cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!viewingClientDetails && (
          <div className="client-list">
            <div className="search-input-container">
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
              <p className="no-clients-message">No clients found matching your search.</p>
            )}
          </div>
        )}
      </main>

      <BottomNavbar />
    </div>
  );
};

export default ClientManagementScreen;
