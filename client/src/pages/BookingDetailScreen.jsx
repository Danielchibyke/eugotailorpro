// client/src/pages/BookingDetailScreen.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css'; // For general app structure
import './styles/BookingDetailScreen.css'; // Specific styles for this screen

const BookingDetailScreen = () => {
    const { id } = useParams(); // Get booking ID from URL
    const navigate = useNavigate();

    // Placeholder state for a single booking (will be fetched from API later)
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for editable fields
    const [clientName, setClientName] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState(''); // For general notes, can include measurements
    const [designImage, setDesignImage] = useState(null); // For file object
    const [designImagePreview, setDesignImagePreview] = useState(''); // For image URL/preview

    useEffect(() => {
        // In a real app, you would fetch the booking details using the 'id'
        // For now, simulate fetching data
        const fetchBookingDetails = async () => {
            setLoading(true);
            setError('');
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Placeholder data for a booking
                const fetchedBooking = {
                    _id: id,
                    client: { name: 'Daniel C.', phone: '123-456-7890', notes: 'Chest: 40, Waist: 32, Inseam: 30' },
                    serviceType: 'Custom Suit',
                    bookingDate: '2025-07-01T10:00:00Z',
                    deliveryDate: '2025-07-15', // Example date
                    status: 'pending',
                    notes: 'Special request: narrow lapels. Client prefers a slim fit.',
                    designImageURL: '/sample-design-1.jpg', // Placeholder for design image
                };

                setBooking(fetchedBooking);
                setClientName(fetchedBooking.client.name);
                setServiceType(fetchedBooking.serviceType);
                setDeliveryDate(fetchedBooking.deliveryDate);
                setStatus(fetchedBooking.status);
                setNotes(fetchedBooking.notes);
                setDesignImagePreview(fetchedBooking.designImageURL);

            } catch (err) {
                setError('Failed to fetch booking details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [id]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDesignImage(file);
            setDesignImagePreview(URL.createObjectURL(file)); // Create a local URL for preview
        } else {
            setDesignImage(null);
            setDesignImagePreview('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // In a real app, you would send this data to your backend API
        // This would involve FormData for file uploads

        const formData = new FormData();
        formData.append('clientName', clientName);
        formData.append('serviceType', serviceType);
        formData.append('deliveryDate', deliveryDate);
        formData.append('status', status);
        formData.append('notes', notes);
        if (designImage) {
            formData.append('designImage', designImage);
        }

        try {
            // Simulate API call to update booking
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Updating booking:', { id, clientName, serviceType, deliveryDate, status, notes, designImage });
            alert('Booking updated successfully!');
            navigate('/dashboard'); // Go back to dashboard after update
        } catch (err) {
            setError('Failed to update booking.');
            console.error(err);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading Booking Details...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!booking) {
        return <div className="no-booking-found">Booking not found.</div>;
    }

    return (
        <div className="booking-detail-container">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-button">&larr; Back</button>
                <h1 className="detail-heading">Booking Details</h1>
            </header>

            <main className="detail-content">
                <form onSubmit={handleSubmit} className="booking-form">
                    {/* Design Image Section */}
                    <div className="form-group image-upload-group">
                        <label>Design Image</label>
                        <div className="design-image-preview-container">
                            {designImagePreview ? (
                                <img src={designImagePreview} alt="Design Preview" className="design-image-preview" />
                            ) : (
                                <div className="no-image-placeholder">No Image Selected</div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="designImage"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file-input"
                        />
                        <label htmlFor="designImage" className="btn btn-primary file-input-label">
                            {designImagePreview ? 'Change Image' : 'Upload Image'}
                        </label>
                    </div>

                    <div className="form-group">
                        <label htmlFor="clientName">Client Name</label>
                        <input
                            type="text"
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="serviceType">Service Type</label>
                        <input
                            type="text"
                            id="serviceType"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="deliveryDate">Delivery Date</label>
                        <input
                            type="date"
                            id="deliveryDate"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="form-control"
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes & Measurements</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="5"
                            className="form-control"
                            placeholder="Add notes, client measurements (e.g., Chest: 40, Waist: 32)"
                        ></textarea>
                    </div>

                    <button type="submit" className="btn btn-accent save-button">Save Changes</button>
                </form>
            </main>

            <BottomNavbar />
        </div>
    );
};

export default BookingDetailScreen;