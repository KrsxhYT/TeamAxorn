// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA7vNgtXViBRMW9gxxwbK6mjwpSa_iFzZ0",
    authDomain: "kryeeapks-68238.firebaseapp.com",
    databaseURL: "https://kryeeapks-68238-default-rtdb.firebaseio.com",
    projectId: "kryeeapks-68238",
    storageBucket: "kryeeapks-68238.firebasestorage.app",
    messagingSenderId: "427737484998",
    appId: "1:427737484998:web:5bd91758dc08a6f13c11c7",
    measurementId: "G-0W1LBEW0XG"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

const auth = firebase.auth();
const database = firebase.database();

// Admin configuration
const ADMINS = {
    "Krsxh": {
        tag: "Semxy Owner",
        followers: 99000,
        verified: true,
        color: "#ff4081"
    },
    "Lord": {
        tag: "Axorn Owner",
        followers: 98000,
        verified: true,
        color: "#4caf50"
    },
    "TeamAxorn": {
        tag: "Axorn Official account",
        followers: 98000,
        verified: true,
        color: "#2196f3"
    },
    "Ghost": {
        tag: "Leader",
        followers: 98000,
        verified: true,
        color: "#2196f3"
    }
};

// Utility functions
function isAdmin(username) {
    return ADMINS.hasOwnProperty(username);
}

function getAdminInfo(username) {
    return ADMINS[username] || null;
}

function canSendUpdates(username) {
    const allowedAdmins = ["Krsxh", "Lord", "TeamAxorn"];
    return allowedAdmins.includes(username);
}

// Database references
const usersRef = database.ref('users');
const applicationsRef = database.ref('applications');
const updatesRef = database.ref('updates');
const suspendedRef = database.ref('suspended');

// User management functions
function createUser(userId, userData) {
    return usersRef.child(userId).set(userData);
}

function getUser(userId) {
    return usersRef.child(userId).once('value');
}

function updateUser(userId, updates) {
    return usersRef.child(userId).update(updates);
}

function getAllUsers() {
    return usersRef.once('value');
}

function checkUsernameExists(username) {
    return usersRef.orderByChild('username').equalTo(username).once('value');
}

// Application functions
function submitApplication(userId, applicationData) {
    return applicationsRef.child(userId).set(applicationData);
}

function getApplications() {
    return applicationsRef.once('value');
}

// Updates functions
function postUpdate(updateData) {
    return updatesRef.push(updateData);
}

function getUpdates() {
    return updatesRef.once('value');
}

// Suspension functions
function suspendUser(username) {
    return suspendedRef.child(username).set(true);
}

function unsuspendUser(username) {
    return suspendedRef.child(username).remove();
}

function isSuspended(username) {
    return suspendedRef.child(username).once('value');
}
