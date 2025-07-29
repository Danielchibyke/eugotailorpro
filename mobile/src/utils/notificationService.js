import messaging, { getMessaging } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  try {
    // Request permissions for notifications
    const authStatus = await getMessaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      // console.log('Authorization status:', authStatus);
      alert('Failed to get push token for push notification! Permission not granted.');
      return;
    }

    // Get the FCM token
    token = await getMessaging().getToken();
    // console.log('FCM Push Token:', token);

    // For Android, you might want to create a default channel if not already done in Firebase console
    // This is typically handled by Firebase itself or in native code for more complex setups.
    // For basic functionality, it's often not explicitly needed here.
    if (Platform.OS === 'android') {
      // You can optionally create a channel here if needed, but Firebase usually handles default.
      // Example (if you need a custom channel):
      // const channel = new firebase.notifications.Android.Channel('default', 'Default Channel', firebase.notifications.Android.Importance.Max)
      //   .setDescription('A default channel for notifications');
      // firebase.notifications().android.createChannel(channel);
    }

  } catch (e) {
    console.error('Error getting FCM push token or requesting permissions:', e);
    alert(`Failed to get push token: ${e.message}`);
  }

  return token;
}