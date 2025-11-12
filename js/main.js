// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Menu functionality
    const menuBtn = document.getElementById('menu-btn');
    const legalModal = document.getElementById('legal-modal');
    const legalClose = document.getElementById('legal-close');
    
    if (menuBtn && legalModal) {
        menuBtn.addEventListener('click', function() {
            legalModal.classList.add('active');
        });
    }
    
    if (legalClose && legalModal) {
        legalClose.addEventListener('click', function() {
            legalModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    if (legalModal) {
        legalModal.addEventListener('click', function(e) {
            if (e.target === legalModal) {
                legalModal.classList.remove('active');
            }
        });
    }
    
    // Update member counts
    updateMemberCounts();
    
    // Check authentication state
    checkAuthState();
}

function updateMemberCounts() {
    getAllUsers().then((snapshot) => {
        let totalMembers = 0;
        snapshot.forEach(() => {
            totalMembers++;
        });
        
        // Update all total member counters
        const totalMemberElements = document.querySelectorAll('#total-members, #total-members-count');
        totalMemberElements.forEach(element => {
            element.textContent = totalMembers;
        });
    });
}

function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user && !window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
    });
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = now - past;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
    if (hours > 0) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
    if (minutes > 0) return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
    return 'Just now';
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        getTimeAgo,
        updateMemberCounts
    };
}
