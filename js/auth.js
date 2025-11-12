// Firebase Configuration
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
} catch (error) {
    console.log('Firebase already initialized');
}

const auth = firebase.auth();
const database = firebase.database();

// Global state
let currentUser = null;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize Auth System
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthForms();
    checkAuthState();
});

function initializeAuthForms() {
    // Switch between login and signup forms
    if (showSignup && showLogin) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            switchToForm('signup');
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchToForm('login');
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

function switchToForm(formType) {
    const forms = {
        login: loginForm,
        signup: signupForm
    };

    Object.values(forms).forEach(form => {
        if (form) form.classList.remove('active');
    });

    if (forms[formType]) {
        forms[formType].classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user is banned
        const userData = await getUserData(user.uid);
        if (userData && userData.isBanned) {
            await auth.signOut();
            showNotification('Your account has been suspended. Please contact admin.', 'error');
            return;
        }
        
        showNotification('Successfully signed in!', 'success');
        
        // Redirect based on application status
        setTimeout(() => {
            checkApplicationStatus(user.uid);
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!name || !username || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (!isValidUsername(username)) {
        showNotification('Username can only contain letters, numbers, and underscores', 'error');
        return;
    }
    
    if (!document.getElementById('acceptTerms').checked) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }

    showLoading(true);
    
    try {
        // Check username availability
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
            showNotification('Username already taken. Please choose another one.', 'error');
            return;
        }
        
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user profile
        const userData = {
            name: name,
            username: username.toLowerCase(),
            email: email,
            profilePic: '',
            tag: 'Member of TEAM AXORN',
            followers: 0,
            following: 0,
            role: 'member',
            isBanned: false,
            joinDate: new Date().toISOString(),
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save user data
        await database.ref('users/' + user.uid).set(userData);
        await database.ref('usernames/' + username.toLowerCase()).set(user.uid);
        
        // Log signup
        await logUserAction('signup', user.uid, { name, username, email });
        
        showNotification('Account created successfully!', 'success');
        
        // Redirect to application page
        setTimeout(() => {
            window.location.href = 'apply.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Email address is already in use.';
            break;
        case 'auth/invalid-email':
            message = 'Invalid email address.';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many attempts. Please try again later.';
            break;
        default:
            message = error.message;
    }
    
    showNotification(message, 'error');
}

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = await getUserData(user.uid);
            
            if (currentUser && !currentUser.isBanned) {
                // User is authenticated and not banned
                const currentPage = window.location.pathname.split('/').pop();
                
                if (currentPage === 'index.html' || currentPage === '') {
                    checkApplicationStatus(user.uid);
                }
            } else if (currentUser && currentUser.isBanned) {
                await auth.signOut();
                showNotification('Your account has been suspended.', 'error');
            }
        } else {
            // User is signed out
            const currentPage = window.location.pathname.split('/').pop();
            const protectedPages = ['home.html', 'apply.html', 'profile.html', 'updates.html', 'members.html'];
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        }
    });
}

async function checkApplicationStatus(userId) {
    try {
        const snapshot = await database.ref('applications')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value');
        
        if (snapshot.exists()) {
            const applications = snapshot.val();
            const application = Object.values(applications)[0];
            
            if (application.status === 'approved') {
                window.location.href = 'home.html';
            } else {
                window.location.href = 'apply.html';
            }
        } else {
            window.location.href = 'apply.html';
        }
    } catch (error) {
        console.error('Error checking application status:', error);
        window.location.href = 'apply.html';
    }
}

// Utility Functions
async function getUserData(userId) {
    try {
        const snapshot = await database.ref('users/' + userId).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

async function checkUsernameAvailability(username) {
    try {
        const snapshot = await database.ref('usernames/' + username.toLowerCase()).once('value');
        return !snapshot.exists();
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

async function logUserAction(type, userId, data) {
    try {
        const logData = {
            type: type,
            userId: userId,
            data: data,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            ip: await getClientIP()
        };
        
        await database.ref('logs/').push(logData);
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
}

function showNotification(message, type = 'info', title = '') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    showLoading(true);
    auth.signOut().then(() => {
        showNotification('Successfully signed out', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }).catch((error) => {
        console.error('Logout error:', error);
        showNotification('Error signing out', 'error');
    }).finally(() => {
        showLoading(false);
    });
}

// Get current user data
async function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (user) {
            getUserData(user.uid).then(resolve).catch(reject);
        } else {
            reject('No user logged in');
        }
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        auth,
        database,
        getCurrentUser,
        showNotification,
        logout
    };
}
