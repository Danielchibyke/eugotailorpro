import firebase from '@react-native-firebase/app';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCCkIm0YrtVLD4NWuj3ZH3qth79XZiwFFY",
    authDomain: "eugotailorproject.firebaseapp.com",
    projectId: "eugotailorpro",
    storageBucket: "eugotailorpro.firebasestorage.app",
    messagingSenderId: "148211790744",
    appId: "1:148211790744:android:c80d99eb0ccdcb7dabb1ed",
   
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export default firebase;
