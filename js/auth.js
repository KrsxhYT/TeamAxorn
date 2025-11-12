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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');

// Switch between login and signup forms
if (showSignup && showLogin) {
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
    });
}

// Sign Up Function
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        // Validate username
        if (!isValidUsername(username)) {
            alert('Username can only contain letters, numbers, and underscores.');
            return;
        }
        
        // Check if username is available
        checkUsernameAvailability(username).then((isAvailable) => {
            if (!isAvailable) {
                alert('Username already taken. Please choose another one.');
                return;
            }
            
            // Create user with Firebase Auth
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    
                    // Create user profile in database
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
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    };
                    
                    // Save user data
                    database.ref('users/' + user.uid).set(userData);
                    
                    // Create username mapping
                    database.ref('usernames/' + username.toLowerCase()).set(user.uid);
                    
                    // Log signup
                    logUserAction('signup', user.uid, { name, username, email });
                    
                    alert('Account created successfully!');
                    window.location.href = 'apply.html';
                })
                .catch((error) => {
                    console.error('Signup error:', error);
                    alert('Error creating account: ' + error.message);
                });
        });
    });
}

// Login Function
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // Check if user is banned
                database.ref('users/' + user.uid).once('value').then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData && userData.isBanned) {
                        alert('Your account has been suspended. Please contact admin.');
                        auth.signOut();
                        return;
                    }
                    
                    // Check if user has applied
                    database.ref('applications').orderByChild('userId').equalTo(user.uid).once('value').then((appSnapshot) => {
                        if (appSnapshot.exists()) {
                            const applications = appSnapshot.val();
                            const application = Object.values(applications)[0];
                            if (application.status === 'approved') {
                                window.location.href = 'home.html';
                            } else {
                                window.location.href = 'apply.html';
                            }
                        } else {
                            window.location.href = 'apply.html';
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('Login error:', error);
                alert('Error signing in: ' + error.message);
            });
    });
}

// Check username availability
function checkUsernameAvailability(username) {
    return database.ref('usernames/' + username.toLowerCase()).once('value')
        .then((snapshot) => {
            return !snapshot.exists();
        });
}

// Validate username
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
}

// Log user actions
function logUserAction(type, userId, data) {
    const logData = {
        type: type,
        userId: userId,
        data: data,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    database.ref('logs/').push(logData);
}

// Get current user data
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (user) {
            database.ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    resolve({
                        uid: user.uid,
                        ...snapshot.val()
                    });
                })
                .catch(reject);
        } else {
            reject('No user logged in');
        }
    });
}

// Check auth state and redirect
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        database.ref('users/' + user.uid).once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData && !userData.isBanned) {
                const currentPage = window.location.pathname.split('/').pop();
                
                // Check if user has applied
                database.ref('applications').orderByChild('userId').equalTo(user.uid).once('value').then((appSnapshot) => {
                    if (appSnapshot.exists()) {
                        const applications = appSnapshot.val();
                        const application = Object.values(applications)[0];
                        
                        if (application.status === 'approved' && currentPage === 'index.html') {
                            window.location.href = 'home.html';
                        } else if (application.status !== 'approved' && currentPage !== 'apply.html') {
                            window.location.href = 'apply.html';
                        }
                    } else if (currentPage !== 'apply.html' && currentPage !== 'index.html') {
                        window.location.href = 'apply.html';
                    }
                });
            } else if (userData && userData.isBanned) {
                alert('Your account has been suspended. Please contact admin.');
                auth.signOut();
                window.location.href = 'index.html';
            }
        });
    } else {
        // User is signed out
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
    }
});

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}
