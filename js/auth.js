// Authentication functions
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to buttons
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', signup);
    }
    
    // Enter key support
    document.getElementById('login-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('signup-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            signup();
        }
    });
});

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    // Insert after the form
    const form = document.querySelector('.center-wrap');
    if (form) {
        form.parentNode.insertBefore(alertDiv, form.nextSibling);
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.display = 'none';
        }
    }, 5000);
}

function showLoading(buttonId, show) {
    const loadingDiv = document.getElementById(buttonId + '-loading');
    const button = document.getElementById(buttonId);
    
    if (loadingDiv && button) {
        if (show) {
            loadingDiv.style.display = 'block';
            button.disabled = true;
            button.style.opacity = '0.7';
        } else {
            loadingDiv.style.display = 'none';
            button.disabled = false;
            button.style.opacity = '1';
        }
    }
}

// Login function
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    showLoading('login-btn', true);

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("User logged in:", user.uid);
        
        // Check if user has applied
        const userData = await getUser(user.uid);
        if (userData.exists()) {
            const userInfo = userData.val();
            if (userInfo.hasApplied) {
                window.location.href = 'home.html';
            } else {
                window.location.href = 'apply.html';
            }
        } else {
            window.location.href = 'apply.html';
        }
    } catch (error) {
        showLoading('login-btn', false);
        console.error("Login error:", error);
        showAlert(getAuthErrorMessage(error), 'error');
    }
}

// Signup function
async function signup() {
    const name = document.getElementById('signup-name').value;
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !username || !email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    if (username.length < 3) {
        showAlert('Username must be at least 3 characters', 'error');
        return;
    }

    showLoading('signup-btn', true);

    try {
        // Check if username already exists
        const usernameSnapshot = await checkUsernameExists(username);
        if (usernameSnapshot.exists()) {
            showLoading('signup-btn', false);
            showAlert('Username already exists. Please choose a different one.', 'error');
            return;
        }

        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log("User created:", user.uid);

        // Create user profile in database
        const userData = {
            name: name,
            username: username,
            email: email,
            hasApplied: false,
            createdAt: new Date().toISOString(),
            followers: 0,
            following: 0,
            profilePic: null,
            userId: user.uid
        };

        await createUser(user.uid, userData);
        showAlert('Account created successfully! Redirecting...', 'success');
        
        // Redirect to apply page after 2 seconds
        setTimeout(() => {
            window.location.href = 'apply.html';
        }, 2000);

    } catch (error) {
        showLoading('signup-btn', false);
        console.error("Signup error:", error);
        showAlert(getAuthErrorMessage(error), 'error');
    }
}

// Error message handler
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email already in use. Please use a different email.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return 'Authentication failed: ' + error.message;
    }
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
    
    if (user && window.location.pathname.endsWith('index.html')) {
        // User is logged in and on login page, redirect based on application status
        getUser(user.uid).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.hasApplied) {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'apply.html';
                }
            } else {
                window.location.href = 'apply.html';
            }
        }).catch(error => {
            console.error("Error checking user data:", error);
        });
    } else if (!user && !window.location.pathname.endsWith('index.html')) {
        // User is not logged in and not on login page, redirect to login
        window.location.href = 'index.html';
    }
});
