// client/src/components/OrderCard.js
import React from 'react';
import './OrderCard.css'; // Specific styles for Order Card
import { FiEdit, FiTrash2, FiCheckCircle } from 'react-icons/fi'; // For action icons

const OrderCard = ({ order, onEdit, onDelete, onComplete }) => {
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

    const formattedDate = new Date(order.bookingDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="order-card">
            {/* here the new order card */}
            <div className='order-card-wrapper'>
                <div className='order-card-header-wrapper'>
                    <div className='order-card-header-left'>

                    </div>
                    <div className='order-card-header-right'>
                        <span className='order-card-id'>Order ID: {order._id}</span>
                    </div>
                </div>
            </div>



            <div className="order-card-header">
                <h3 className="order-client-name">{order.client?.name || 'N/A'}</h3>
                <span className={`order-status ${getStatusClass(order.status)}`}>
                    {order.status}
                </span>
            </div>
            <div className="order-card-body">
                <div className="order-details">
                    <p className="order-detail-item">
                        <span className="detail-label">Service:</span> {order.serviceType}
                    </p>
                    <p className="order-detail-item">
                        <span className="detail-label">Date:</span> {order.bookingDate ? formattedDate : 'N/A'}
                    </p>
                    <p className="order-detail-item">
                        <span className="detail-label">Time:</span> {order.bookingTime || 'N/A'}
                    </p>
                </div>
                {order.designImageURL && (
                    <div className="order-design-thumbnail">
                        <img src={order.design} alt="Design" />
                    </div>
                )}
            </div>
            <div className="order-card-actions">
                <button className="btn-icon" onClick={() => onEdit(order._id)}>
                    <FiEdit />
                    <span>Edit</span>
                </button>
                {order.status === 'Pending' && (
                    <button className="btn-icon" onClick={() => onComplete(order._id)}>
                        <FiCheckCircle />
                        <span>Complete</span>
                    </button>
                )}
                <button className="btn-icon btn-icon-danger" onClick={() => onDelete(order._id)}>
                    <FiTrash2 />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
};

export default OrderCard;