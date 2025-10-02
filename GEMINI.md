# Gemini Session Notes

This file is used to maintain context and notes for the Gemini CLI across sessions.

make sure what ever you implement doesn't break the existing codes. always keep in mind the affected codes or modules you are editing.

<overall_goal>
    Replicate the UI/UX and functionality of the web client application into the mobile React Native application, ensuring a good mobile user experience.
</overall_goal>

<recent_actions>
    - Refined the styling and responsiveness of the FinancialsScreen, including the modal form, to align with the overall application theme.
    - Adjusted ScrollView and modal view styles to ensure proper centering and responsiveness of the modal content.
    - Replicated the exact date picker implementation from FinancialsScreen to CashBookScreen, AddBookingScreen, and BookingDetailScreen, including all relevant props and styling.
    - Reviewed and updated LoginScreen, RegisterScreen, AddClientScreen, FinancialsScreen, AddBookingScreen, and BookingDetailScreen to ensure all input fields have clear, persistent labels for better UX and accessibility.
    - Performed general UI/UX polish across DashboardScreen, ClientsScreen, BookingsScreen, CashBookScreen, FinancialsScreen, AddBookingScreen, and BookingDetailScreen, refining spacing, alignment, and visual hierarchy for a cohesive and professional look.
</recent_actions>

<current_plan>
    1. [TODO] Consider future native features: If zoom/orientation are still desired, explore `expo-dev-client` for a more stable native module integration, but only after current stability is confirmed.
</current_plan>

<session_summary>
## Session Summary (September 22, 2025)

This session focused on fixing a bug in the reminder implementation, a range error in the AddBookingScreen, a bug in the in-app notification display, a bug in the reminder scheduling, and a timezone issue with reminders.

### Implemented Features:
- **Fixed Reminder Implementation:**
    - **Details:** Fixed a bug that prevented multiple reminders from being sent for a single booking. The `notificationSent` flag was removed from the `Booking` model and its usage was removed from the `agenda.js` file.
    - **Files Modified:**
        - `server/models/Booking.js`
        - `server/utils/agenda.js`
- **Fixed `RangeError` in `AddBookingScreen.jsx`:**
    - **Details:** Fixed a `RangeError: invalid array length` that occurred when interacting with the reminder dates in the booking form. Added checks to ensure that `reminderDates` is an array before processing it.
    - **Files Modified:**
        - `mobile/src/screens/AddBookingScreen.jsx`
- **Fixed In-App Notification Display:**
    - **Details:** Fixed a bug that prevented the in-app notification from displaying. Removed the `top` style from the notification component to prevent it from being rendered off-screen.
    - **Files Modified:**
        - `mobile/src/components/Notification.jsx`
        - `mobile/src/context/NotificationContext.jsx`
- **Fixed Reminder Scheduling:**
    - **Details:** Fixed a bug that prevented reminders from being scheduled. The `connectDB` function is now awaited before starting `agenda`.
    - **Files Modified:**
        - `server/server.js`
- **Fixed Reminder Timezone Issue:**
    - **Details:** Fixed a timezone issue where the reminder time was being converted to UTC. The `dayjs-plugin-utc` package is now used to handle timezone conversions.
    - **Files Modified:**
        - `mobile/src/screens/AddBookingScreen.jsx`
- **Improved Agenda Integration:**
    - **Details:** Improved the `agenda` integration by using the existing mongoose connection instead of creating a new one.
    - **Files Modified:**
        - `server/utils/agenda.js`
        - `server/server.js`
- **Added Logging to Reminder System:**
    - **Details:** Added logging to the reminder system to help debug the issue of reminders not being scheduled.
    - **Files Modified:**
        - `server/controllers/bookingController.js`
        - `server/utils/agenda.js`
- **Fixed Reminder Timezone Issue (Server-side):**
    - **Details:** Fixed a timezone issue where the reminder time was being converted to UTC on the server. `dayjs` is now used to parse the incoming date strings with the server's local timezone.
    - **Files Modified:**
        - `server/controllers/bookingController.js`

### Outstanding Issues / Next Steps:

*   **Reminder System Not Working:** The reminder system is still not working as expected. Agenda is not scheduling any jobs, even though the server logs show that Agenda has started. Further investigation is needed to determine why the `createBooking` and `updateBooking` functions are not being called.
*   **Reminder Notification Recipient:** The reminder is always sent to the user who created the booking (`bookedBy`). This might not be the desired behavior in all cases. This should be revisited in the future to make the recipient configurable.

</session_summary>

<session_summary>
## Session Summary (September 16, 2025) - Continued

This session focused on:

### 1. Removing the Reports Screen:
*   **Details:** The "Reports" screen and all its associated client-side and server-side components were completely removed from the application.
*   **Files Modified:**
    *   `mobile/src/screens/ReportsScreen.jsx` (Deleted)
    *   `mobile/src/navigation/AppNavigator.jsx` (Removed import and screen entry)
    *   `mobile/src/screens/DashboardScreen.jsx` (Removed quick action button)
    *   `server/controllers/reportingController.js` (Deleted)
    *   `server/routes/reportingRoutes.js` (Deleted)
    *   `server/server.js` (Removed import and usage of reporting routes)

### 2. Implementing Granular User Permissions:
*   **Details:** Enhanced the user management system to allow admins to assign and manage individual permissions for users, independent of their roles.
*   **Files Modified:**
    *   `server/models/User.js` (Added `customPermissions` field)
    *   `server/utils/permissions.js` (Added `getUserEffectivePermissions` function, updated `ROLES` and `ROLE_PERMISSIONS` to reflect `USER` role and removed `REPORTS_VIEW`)
    *   `server/middleware/authMiddleware.js` (Modified `authorize` middleware to use `getUserEffectivePermissions`)
    *   `server/controllers/authController.js` (Removed explicit `permissions` assignment in `registerUser` and `updateUserRole`, added `updateUserCustomPermissions` function, and included `customPermissions` in `loginUser` response)
    *   `server/routes/authRoutes.js` (Added `PUT /api/auth/users/:id/custom-permissions` route)
    *   `mobile/src/config/permissions.js` (Added `getUserEffectivePermissions` function, updated `ROLES` and `ROLE_PERMISSIONS` to reflect `USER` role and removed `REPORTS_VIEW`)
    *   `mobile/src/screens/UserManagementScreen.jsx` (Implemented UI for managing custom permissions, including a modal with checkboxes, and updated permission display to show effective permissions)
    *   `mobile/src/screens/ProfileScreen.jsx` (Modified conditional rendering of "User Management" button to use `PERMISSIONS.USERS_MANAGE` via `getUserEffectivePermissions`)

### 3. Implementing In-App Notifications for Permission Denied:
*   **Details:** Configured the application to display an in-app notification when a user attempts to access a feature without the required permissions.
*   **Files Modified:**
    *   `server/middleware/authMiddleware.js` (Changed error message for 403 Forbidden responses)
    *   `mobile/src/utils/api.js` (Added `setNotificationHandler` and logic to intercept 403 errors and trigger notifications)
    *   `mobile/App.jsx` (Ensured `setNotificationHandler` is called with `showNotification`)
    *   `mobile/src/context/NotificationContext.jsx` (Simplified notification animation and styling, removed `Animated` library usage, and added debug logs)

</session_summary>
