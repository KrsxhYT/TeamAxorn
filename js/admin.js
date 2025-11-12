// Admin-specific functionality
class AdminPanel {
    constructor() {
        this.currentAdmin = null;
        this.initializeAdminPanel();
    }
    
    initializeAdminPanel() {
        this.checkAdminAccess();
        this.setupEventListeners();
    }
    
    checkAdminAccess() {
        const user = firebase.auth().currentUser;
        if (user) {
            getUser(user.uid).then((snapshot) => {
                const userData = snapshot.val();
                if (userData && isAdmin(userData.username)) {
                    this.currentAdmin = userData.username;
                    this.showAdminFeatures();
                }
            });
        }
    }
    
    showAdminFeatures() {
        // Add admin menu items
        this.addAdminMenuItems();
        
        // Show admin panels
        this.showAdminPanels();
    }
    
    addAdminMenuItems() {
        if (this.currentAdmin === 'Krsxh') {
            // Add logs and kick options for Krsxh
            const legalLinks = document.querySelector('.legal-links');
            if (legalLinks) {
                legalLinks.innerHTML += `
                    <a href="#logs" class="legal-link admin-only" data-section="logs">Admin Logs</a>
                    <a href="#kick" class="legal-link admin-only" data-section="kick">Kick Member</a>
                `;
            }
        }
    }
    
    showAdminPanels() {
        // Implementation for showing admin-specific panels
    }
    
    setupEventListeners() {
        // Admin-specific event listeners
    }
    
    // Logs functionality
    async showLogs() {
        const users = await getAllUsers();
        const applications = await getApplications();
        
        const logsContainer = document.getElementById('logs-container');
        if (logsContainer) {
            logsContainer.innerHTML = this.generateLogsHTML(users, applications);
        }
    }
    
    generateLogsHTML(users, applications) {
        let html = '<div class="logs-section">';
        
        // User signups
        html += '<h4>User Signups</h4>';
        users.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            html += `
                <div class="log-card">
                    <div class="log-header">
                        <strong>${user.name}</strong> (@${user.username})
                    </div>
                    <div class="log-details">
                        Email: ${user.email}<br>
                        Joined: ${new Date(user.createdAt).toLocaleString()}
                    </div>
                </div>
            `;
        });
        
        // Applications
        html += '<h4>Applications</h4>';
        applications.forEach((childSnapshot) => {
            const app = childSnapshot.val();
            html += `
                <div class="log-card">
                    <div class="log-header">
                        <strong>${app.name}</strong> (@${app.username})
                    </div>
                    <div class="log-details">
                        Email: ${app.email}<br>
                        Mobile: ${app.mobile}<br>
                        IG: ${app.igUsername}<br>
                        Applied: ${new Date(app.appliedAt).toLocaleString()}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Kick functionality
    async kickUser(username) {
        if (confirm(`Are you sure you want to kick @${username}?`)) {
            try {
                await suspendUser(username);
                alert(`@${username} has been kicked from TEAM AXORN.`);
            } catch (error) {
                alert('Error kicking user: ' + error.message);
            }
        }
    }
    
    async unbanUser(username) {
        try {
            await unsuspendUser(username);
            alert(`@${username} has been unbanned.`);
        } catch (error) {
            alert('Error unbanning user: ' + error.message);
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AdminPanel !== 'undefined') {
        window.adminPanel = new AdminPanel();
    }
});

// Admin utility functions
function showAdminTools() {
    const user = firebase.auth().currentUser;
    if (user) {
        getUser(user.uid).then((snapshot) => {
            const userData = snapshot.val();
            if (userData && isAdmin(userData.username)) {
                // Show admin tools
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'block';
                });
            }
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}
