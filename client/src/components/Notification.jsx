import React from 'react';
import { useNotification } from '../context/NotificationContext';
import './Notification.css';

const Notification = () => {
  const { notification } = useNotification();

  if (!notification) {
    return null;
  }

  return (
    <div className={`notification-container ${notification.type}`}>
      {notification.message}
    </div>
  );
};

export default Notification;
