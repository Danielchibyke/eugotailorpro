import React from "react";
import { useState, useEffect, useMemo } from "react";
import "../App.css";
import "./styles/BookingScreen.css";
import BookingCard from "../components/BookingCard";

import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import api from "../utils/api";
import { useBookings } from "../context/BookingContext";
import { useNavigate, useParams } from "react-router-dom";

export default function BookingScreen() {
    // Use the BookingContext to manage bookings
    const { bookings, setBookings, loading, setLoading, error, setError } = useBookings();  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get booking ID from URL
 
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    client: "",
    bookingDate: "",
    deliveryDate: "", // New field
    status: "Pending",
    notes: "",
    bookedBy: user ? user._id : "", // Replace with actual user ID if available
    design: "", // URL for the design image
    price: "",
    payment: "",
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

    const fetchBookingById = async (bookingId) => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        if (data) {
          handleEditBooking(data);
        } else {
          setError("Booking not found");
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching the booking");
      }
    };

    fetchClients();
    if (id) {
      fetchBookingById(id);
    } else {
      fetchBookings(); // Fetch all bookings if no ID is present
    }
  }, [id]);

  // Sample test data
  const testData = [
    {
      _id: '1',
      client: { name: 'John Doe' },
      bookingDate: '2023-10-01',
      status: 'Pending',
      notes: 'Initial consultation',
      bookedBy: { name: 'Test User' },
      design: 'https://example.com/design.jpg',
    },
  ];

  

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
      deliveryDate: booking.deliveryDate ? new Date(booking.deliveryDate).toISOString().split("T")[0] : "", // Format date to YYYY-MM-DD
      status: booking.status,
      notes: booking.notes,
      bookedBy: booking.bookedBy ? booking.bookedBy._id : user ? user._id : "",
      design: booking.design , // Ensure design is set
      price: booking.price || "",
      payment: booking.payment || "",
    });
    setIsFormVisible(true);
  };

  // Handle booking completion
  const handleCompleteBooking = async (bookingId) => {
    try {
      const { data } = await api.put(`/bookings/${bookingId._id}`, { status: 'Completed' });
      setBookings(bookings.map(b => (b._id === bookingId ? data : b)));
      setSuccessMessage("Booking marked as completed!");
    } catch (err) {
      setError("Failed to update booking status.");
    }
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
      deliveryDate: "", // New field
      status: "Pending",
      notes: "",
      bookedBy: user ? user._id : "", // Replace with actual user ID if available
      design: "", // URL for the design image
      price: "",
      payment: "",
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
        deliveryDate: formData.deliveryDate, // Include deliveryDate
        status: formData.status,
        notes: formData.notes,
        bookedBy: formData.bookedBy,
        design: formData.design,
        price: formData.price,
        payment: formData.payment,
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
      deliveryDate: "", // New field
      status: "Pending",
      notes: "",
      bookedBy: user ? user._id : "", // Replace with actual user ID if available
      design: "", // URL for the design image
    });
    setSuccessMessage(null);
    setError(null);
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

      <div className="bookings-list">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onComplete={handleCompleteBooking}
            />
          ))
        ) : (
          <p>No bookings available.</p>
        )}
      </div>

      {isFormVisible && (
        <BookingForm
          isFormVisible={isFormVisible}
          setIsFormVisible={setIsFormVisible}
          currentBooking={currentBooking}
          setCurrentBooking={setCurrentBooking}
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          handleFormSubmit={handleFormSubmit}
          handleCloseForm={handleCloseForm}
          handleClientSelectChange={handleClientSelectChange}
          handleSearchInputChange={handleSearchInputChange}
          searchQuery={searchQuery}
          filteredClients={filteredClients}
          clients={clients}
          handleEditBooking={handleEditBooking}
          handleDeleteBooking={handleDeleteBooking}
          selectedBooking={selectedBooking}
          bookings={bookings}
        />
      )}
    </div>
  );
}

export const BookingForm = ({formData, bookings, setFormData, isFormVisible, setIsFormVisible, currentBooking, setCurrentBooking,
  handleInputChange, handleFormSubmit, handleCloseForm, handleClientSelectChange,
handleSearchInputChange, searchQuery,  clients, handleEditBooking, handleDeleteBooking, filteredClients

})=>{
    
  return (
        <div className="booking-form">
         
        <div className="booking-form-overlay">
          <div className="booking-form-popup">
            <h2>{currentBooking ? "Edit Booking" : "Create Booking"}</h2>
            <form onSubmit={handleFormSubmit} className="booking-form-content">
              <div className="form-section">
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
                        <option key={client._id + client.name} value={client._id}>
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
                  <input
                    type="text"
                    id="searchClient"
                    name="searchClient"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Search Clients"
                  />
                </div>
              </div>

              <div className="form-section">
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
                  <label htmlFor="deliveryDate">Delivery Date</label>
                  <input
                    type="date"
                    id="deliveryDate"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
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
                  <label htmlFor="price">Price</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="payment">Payment</label>
                  <input
                    type="number"
                    id="payment"
                    name="payment"
                    value={formData.payment}
                    onChange={handleInputChange}
                  />
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
              </div>

              <div className="form-section full-width">
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
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
    
       <BottomNavbar />
        </div>
    );
}