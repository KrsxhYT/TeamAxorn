// Authentication functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert after the form
    const form = document.querySelector('.center-wrap');
    form.parentNode.insertBefore(alertDiv, form.nextSibling);
    
    // Show alert
    alertDiv.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading') || createLoadingDiv();
    loadingDiv.style.display = show ? 'block' : 'none';
}

function createLoadingDiv() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="spinner"></div>';
    document.querySelector('.center-wrap').appendChild(loadingDiv);
    return loadingDiv;
}

// Login function
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    showLoading(true);

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
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
        showLoading(false);
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

    showLoading(true);

    try {
        // Check if username already exists
        const usernameSnapshot = await checkUsernameExists(username);
        if (usernameSnapshot.exists()) {
            showLoading(false);
            showAlert('Username already exists. Please choose a different one.', 'error');
            return;
        }

        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in database
        const userData = {
            name: name,
            username: username,
            email: email,
            hasApplied: false,
            createdAt: new Date().toISOString(),
            followers: 0,
            following: 0,
            profilePic: null
        };

        await createUser(user.uid, userData);
        showAlert('Account created successfully!', 'success');
        
        // Redirect to apply page after 2 seconds
        setTimeout(() => {
            window.location.href = 'apply.html';
        }, 2000);

    } catch (error) {
        showLoading(false);
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
            return 'Password is too weak.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return error.message;
    }
}

// Check authentication state
auth.onAuthStateChanged((user) => {
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
            }
        });
    } else if (!user && !window.location.pathname.endsWith('index.html')) {
        // User is not logged in and not on login page, redirect to login
        window.location.href = 'index.html';
    }
});

// Enter key support
document.addEventListener('DOMContentLoaded', function() {
    // Login form enter key
    document.getElementById('login-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    // Signup form enter key
    document.getElementById('signup-password')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            signup();
        }
    });
});
