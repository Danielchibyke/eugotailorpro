import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookingCard.css'; // Specific styles for Booking Card
import { FiEdit, FiTrash2, FiCheckCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi'; // For action icons

const BookingCard = ({ booking, onEdit, onDelete, onComplete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const navigate = useNavigate();

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const handleViewMeasurement = (clientId) => {
        navigate(`/clients/${clientId}`);
    };
    // Determine status class for styling
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'status-pending';
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return '';
        }
    };

    const formattedBookingDate = new Date(booking.bookingDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const formattedDeliveryDate = booking.deliveryDate ? new Date(booking.deliveryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) : 'N/A';

    return (
        <div className="booking-card" onClick={toggleExpanded}>
            <div className="booking-card-header">
                <h3 className="booking-client-name">{booking.client?.name || 'N/A'}</h3>
                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                    {booking.status}
                </span>
                <div className="expand-icon">
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </div>
            </div>
            <div className="booking-card-body">
                <div className="booking-details">
                    <p className="booking-detail-item">
                        <span className="detail-label">Booking Date:</span> {booking.bookingDate ? formattedBookingDate : 'N/A'}
                    </p>
                    <p className="booking-detail-item">
                        <span className="detail-label">Delivery Date:</span> {formattedDeliveryDate}
                    </p>
                    <p className="booking-detail-item">
                        <span className="detail-label">Booked By:</span> {booking.bookedBy?.name || 'N/A'}
                    </p>
                </div>
                {booking.design && (
                    <div className="booking-design-thumbnail">
                        <img src={booking.design} alt="Design" />
                    </div>
                )}
            </div>
            {isExpanded && (
                <div className="booking-card-expanded-details">
                    <p className="booking-detail-item">
                        <span className="detail-label">Notes:</span> {booking.notes || 'N/A'}
                    </p>
                    {/* Add more details here if needed when expanded */}
                </div>
            )}
            <div className="booking-card-actions">
                {booking.client?._id && (
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleViewMeasurement(booking.client._id); }}>
                        <span>View Measurement</span>
                    </button>
                )}
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(booking); }}>
                    <FiEdit />
                    <span>Edit</span>
                </button>
                {booking.status === 'Pending' && (
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onComplete(booking); }}>
                        <FiCheckCircle />
                        <span>Complete</span>
                    </button>
                )}
                <button className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); onDelete(booking._id); }}>
                    <FiTrash2 />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
};

export default BookingCard;