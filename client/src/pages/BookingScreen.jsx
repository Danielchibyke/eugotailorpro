import React from "react";
import { useState, useEffect, useMemo } from "react";
import "../App.css";
import "./styles/BookingScreen.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import api from "../utils/api";

export default function BookingScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    client: "",
    bookingDate: "",
    status: "Pending",
    notes: "",
    bookedBy: user ? user._id : "", // Replace with actual user ID if available
    design: "", // URL for the design image
  });
  const [currentBooking, setCurrentBooking] = useState(null);

  // search and select client in the booking form
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [clients, setClients] = useState([]);

  // Handle client selection from the dropdown
  const handleClientSelectChange = (e) => {
    const selectedClientId = e.target.value;
    const selectedClient = clients.find(
      (client) => client._id === selectedClientId
    );
    if (selectedClient) {
      setFormData((prevData) => ({
        ...prevData,
        client: selectedClient._id, // Set the selected client ID
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        client: "", // Reset client if no selection
      }));
    }
    setSearchQuery(""); // Clear search query when a client is selected
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    // Filter clients based on search query
    if (e.target.value.trim() === "") {
      setFilteredClients(clients); // Reset to all clients if search query is empty
      return;
    }
    // Filter clients based on search query
    if (clients.length > 0) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
          client.email.toLowerCase().includes(e.target.value.toLowerCase()) || // Assuming client has an 'email' property
          client.phone.toLowerCase().includes(e.target.value.toLowerCase()) // Assuming client has a 'phone' property
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients); // No clients to filter
    }
  };

  // Fetch clients from the API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get("/clients");
        if (data) {
          setClients(data);
        } else {
          setClients([]);
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching clients");
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, []);

  // Sample test data
  const testData = {
    client: "John Doe",
    bookingDate: "2023-10-01",
    status: "Pending",
    notes: "Initial consultation",
    bookedBy: user ? user._id : "testUserId", // Replace with actual user ID if available
    design: "https://example.com/design.jpg", // Replace with actual design URL if available
  };

  useEffect(() => {
    // Fetch bookings from the API
    // If the API call fails, use the test data
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get("/bookings");
        if (data) {
          setBookings(data);
        } else {
          setBookings(testData);
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching bookings");
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Fetch bookings from the API
  // If the API call fails, use the test data
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get("/bookings");
      if (data) {
        setBookings(data);
      } else {
        setBookings(testData);
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching bookings");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle booking details close
  const handleBookingDetailsClose = () => {
    setShowBookingDetails(false);
    setSelectedBooking(null);
  };


  // Handle booking edit and delete actions
  const handleEditBooking = async (booking) => {
    setCurrentBooking(booking);
    console.log("Editing booking:", booking);
    setFormData({
      client: booking.client ? booking.client._id : "", // Ensure client ID is set
      bookingDate: new Date(booking.bookingDate).toISOString().split("T")[0], // Format date to YYYY-MM-DD
      status: booking.status,
      notes: booking.notes,
      bookedBy: booking.bookedBy ? booking.bookedBy._id : user ? user._id : "",
      design: booking.design , // Ensure design is set
    });
    setIsFormVisible(true);
  };

  // Handle booking deletion
  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const response = await api.delete(`/bookings/${bookingId}`);
        if (response.status === 200) {
          setBookings(bookings.filter((booking) => booking._id !== bookingId));
          setSuccessMessage("Booking deleted successfully!");
          setShowBookingDetails(false); // Close booking details if open
          setSelectedBooking(null); // Reset selected booking
        } else {
          throw new Error("Failed to delete booking");
        }
      } catch (err) {
        setError(err.message || "An error occurred while deleting the booking");
      }
    }
  };

  // Handle creating a new booking
  const handleCreateBooking = () => {
    setIsFormVisible(true);
    setCurrentBooking(null); // Reset current booking for new booking
    setFormData({
      client: "", // Reset form data
      bookingDate: new Date().toISOString().split("T")[0], // Set to today's date
      status: "Pending",
      notes: "",
      bookedBy: user ? user._id : "", // Replace with actual user ID if available
      design: "", // URL for the design image
    });
  };

  // Handle form submission for creating or updating bookings
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      const bookingData = {
        client: formData.client,
        bookingDate: formData.bookingDate,
        status: formData.status,
        notes: formData.notes,
        bookedBy: formData.bookedBy,
        design: formData.design,
      };

      let response;
      if (currentBooking) {
        // Update existing booking
        response = await api.put(
          `/bookings/${currentBooking._id}`,
          bookingData
        );
        setSuccessMessage("Booking updated successfully!");
      } else {
        // Create new booking
        response = await api.post("/bookings", bookingData);
        setSuccessMessage("Booking created successfully!");
      }

      // Refresh bookings list after successful operation
      const { data } = await api.get("/bookings");
      setBookings(data || []); // Ensure bookings is set to an array
    } catch (err) {
      setError(err.message || "An error occurred while saving the booking");
    } finally {
      setIsFormVisible(false);
    }
  };

  // Handle closing the booking form
  const handleCloseForm = () => {
    setIsFormVisible(false);
    setCurrentBooking(null);
    setFormData({
      client: "",
      bookingDate: "",
      status: "Pending",
      notes: "",
      bookedBy: user ? user._id : "", // Replace with actual user ID if available
      design: "", // URL for the design image
    });
    setSuccessMessage(null);
    setError(null);
  };

  // Render the booking screen
  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    return (
     
        <div className="booking-details-overlay">
          <div key={selectedBooking._id} className="booking-details">
            <h2>Booking Details</h2>
            <p>
              <strong>Client:</strong> {selectedBooking.client.name}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(selectedBooking.bookingDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong> {selectedBooking.status}
            </p>
            <p>
              <strong>Notes:</strong> {selectedBooking.notes}
            </p>
            <p>
              <strong>Design URL:</strong> {selectedBooking.design}
            </p>
            <div className="booked-by">
                <strong>Booked By:</strong>{" "}
                {selectedBooking.bookedBy ? (
                  <span>{selectedBooking.bookedBy.name}</span>
                ) : (
                  <span>Unknown</span>
                )}
            </div>
            <div className="booking-actions">
            <button onClick={handleBookingDetailsClose} className="btn btn-accent">Close</button>
            <button onClick={() => handleDeleteBooking(selectedBooking._id)} className="btn btn-danger">
              Delete
            </button>
            <button onClick={() => handleEditBooking(selectedBooking)} className="btn btn-primary">
                Edit
            </button>
            </div>
            <BottomNavbar />
          </div>
        </div>
      
    );
  };

 
  


  // Main booking management screen
  if (loading) {
    return <p className="alert">Loading bookings...</p>;
  }
  if (error) {
    return <p className="alert alert-error">{error}</p>;
  }

  // Render the booking management screen with bookings list
  if (!user || !user.role === "admin") {
    return (
      <p className="alert alert-error">
        You do not have permission to view this page.
      </p>
    );
  }

  if (bookings.length > 0 && bookings[0].client === testData.client) {
    // If bookings are empty, show test data
    bookings.push(testData);
  }

  return (
    <div className="booking-screen background">
      <header className="booking-header">
        <button onClick={() => navigate("/")} className="back-button">
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h1>Booking Management</h1>
        <button onClick={handleCreateBooking} className="create-booking-button">
          Create Booking
        </button>
      </header>
      {successMessage ? (
        <p className="alert alert-success">{successMessage}</p>
      ) : (
        ""
      )}

      {showBookingDetails && selectedBooking ? renderBookingDetails() : null}

      {isFormVisible && (
        <div className="booking-form-overlay">
          <div className="booking-form-popup">
            <h2>{currentBooking ? "Edit Booking" : "Create Booking"}</h2>
            <form onSubmit={handleFormSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="client">Client Name</label>
                <select
                  name="client"
                  id="client"
                  onChange={handleClientSelectChange}
                  value={formData.client}
                >
                  <option value="" key={"select client"}>
                    Select Client
                  </option>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <option key={client._id + client.name} value={client._id} >
                        {client.name}
                      </option>
                    ))
                  ) : (
                    <option value={currentBooking?.client?._id || ""} key={"No clients found"}>
                      No clients found
                    </option>
                    )}
                    {clients.length === 0 && searchQuery.trim() === "" && (

                    <option value="" disabled key={"No clients found"}>
                      No clients found
                    </option>
                  )}
                </select>
                {/* Search input for clients */}
                <input
                  type="text"
                  id="searchClient"
                  name="searchClient"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search Clients"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bookingDate">Booking Date</label>
                <input
                  type="date"
                  id="bookingDate"
                  name="bookingDate"
                  value={formData.bookingDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="design">Design URL</label>
                <input
                  type="text"
                  id="design"
                  name="design"
                  value={formData.design}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" className="btn btn-accent submit-button">
                {currentBooking ? "Update Booking" : "Create Booking"}
              </button>
              <button
                type="button"
                className="btn cancel-button"
                onClick={handleCloseForm}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bookings-list">
        <h2>Bookings List</h2>
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.client.name}</td>
                  <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                  <td>{booking.status}</td>
                  <td>{booking.notes}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetails(true);
                       
                      }}
                    >
                      View Details
                    </button>
                    {user && user.role === "admin" && (
                      <>
                        <button onClick={() => handleEditBooking(booking)}>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No bookings available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <BottomNavbar />
    </div>
  );
}
