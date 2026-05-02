// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA0i7-rcvzgJK3vrphCFswRMX-8gXAjhWI",
    authDomain: "votesphere-9929.firebaseapp.com",
    projectId: "votesphere-9929",
    storageBucket: "votesphere-9929.firebasestorage.app",
    messagingSenderId: "724010174336",
    appId: "1:724010174336:web:b4ae770a592aff89002365",
    measurementId: "G-4F977EDHN7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);