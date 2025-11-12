// Authentication functions
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  if (loginTab && signupTab) {
    loginTab.addEventListener('click', function() {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.classList.add('active');
      signupForm.classList.remove('active');
    });
    
    signupTab.addEventListener('click', function() {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.classList.add('active');
      loginForm.classList.remove('active');
    });
  }
  
  // Login form submission
  const loginFormEl = document.getElementById('login-form');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Check if user has applied
          const userId = userCredential.user.uid;
          getUser(userId).then((snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.hasApplied) {
              window.location.href = 'home.html';
            } else {
              window.location.href = 'apply.html';
            }
          });
        })
        .catch((error) => {
          alert('Login failed: ' + error.message);
        });
    });
  }
  
  // Signup form submission
  const signupFormEl = document.getElementById('signup-form');
  if (signupFormEl) {
    signupFormEl.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const username = document.getElementById('signup-username').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      // Check if username is available
      getAllUsers().then((snapshot) => {
        let usernameExists = false;
        snapshot.forEach((childSnapshot) => {
          const user = childSnapshot.val();
          if (user.username === username) {
            usernameExists = true;
          }
        });
        
        if (usernameExists) {
          alert('Username already exists. Please choose a different one.');
          return;
        }
        
        // Create user
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const userId = userCredential.user.uid;
            
            // Create user profile
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
            
            return createUser(userId, userData);
          })
          .then(() => {
            window.location.href = 'apply.html';
          })
          .catch((error) => {
            alert('Signup failed: ' + error.message);
          });
      });
    });
  }
  
  // Check if user is logged in
  auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.endsWith('index.html')) {
      // User is logged in and on login page, redirect based on application status
      getUser(user.uid).then((snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.hasApplied) {
          window.location.href = 'home.html';
        } else {
          window.location.href = 'apply.html';
        }
      });
    } else if (!user && !window.location.pathname.endsWith('index.html')) {
      // User is not logged in and not on login page, redirect to login
      window.location.href = 'index.html';
    }
  });
});
