// Firebase Configuration and Initialization
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

// Database References
const database = firebase.database();

// Admin configuration
const ADMIN_CONFIG = {
    'krsxh': {
        tag: 'Semxy Owner',
        followers: 99000,
        tickColor: 'red',
        canPostUpdates: true,
        canManageUsers: true,
        canViewLogs: true
    },
    'lord': {
        tag: 'Axorn Owner',
        followers: 98000,
        tickColor: 'green',
        canPostUpdates: true,
        canManageUsers: true,
        canViewLogs: true
    },
    'teamaxorn': {
        tag: 'Axorn Official account',
        followers: 98000,
        tickColor: 'blue',
        canPostUpdates: true,
        canManageUsers: false,
        canViewLogs: false
    },
    'ghost': {
        tag: 'Leader',
        followers: 98000,
        tickColor: 'blue',
        canPostUpdates: false,
        canManageUsers: false,
        canViewLogs: false
    }
};

// Utility Functions
class TeamAxornDB {
    // User Management
    static async createUser(userId, userData) {
        try {
            await database.ref('users/' + userId).set(userData);
            await database.ref('usernames/' + userData.username.toLowerCase()).set(userId);
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async getUser(userId) {
        try {
            const snapshot = await database.ref('users/' + userId).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    static async updateUser(userId, updates) {
        try {
            await database.ref('users/' + userId).update(updates);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Application Management
    static async createApplication(applicationData) {
        try {
            const ref = await database.ref('applications').push(applicationData);
            return ref.key;
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    }

    static async getApplications() {
        try {
            const snapshot = await database.ref('applications').once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting applications:', error);
            throw error;
        }
    }

    // Updates Management
    static async createUpdate(updateData) {
        try {
            const ref = await database.ref('updates').push(updateData);
            return ref.key;
        } catch (error) {
            console.error('Error creating update:', error);
            throw error;
        }
    }

    static async getUpdates(limit = 50) {
        try {
            const snapshot = await database.ref('updates')
                .orderByChild('timestamp')
                .limitToLast(limit)
                .once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting updates:', error);
            throw error;
        }
    }

    // Admin Functions
    static async kickUser(username) {
        try {
            const userId = await this.getUserIdByUsername(username);
            if (userId) {
                await database.ref('users/' + userId).update({ isBanned: true });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error kicking user:', error);
            throw error;
        }
    }

    static async unbanUser(username) {
        try {
            const userId = await this.getUserIdByUsername(username);
            if (userId) {
                await database.ref('users/' + userId).update({ isBanned: false });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error unbanning user:', error);
            throw error;
        }
    }

    static async getUserIdByUsername(username) {
        try {
            const snapshot = await database.ref('usernames/' + username.toLowerCase()).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user ID:', error);
            throw error;
        }
    }

    // Statistics
    static async getTotalMembers() {
        try {
            const snapshot = await database.ref('users').once('value');
            const users = snapshot.val();
            return users ? Object.keys(users).length : 0;
        } catch (error) {
            console.error('Error getting total members:', error);
            throw error;
        }
    }

    static async getApprovedMembers() {
        try {
            const applicationsSnapshot = await database.ref('applications')
                .orderByChild('status')
                .equalTo('approved')
                .once('value');
            return applicationsSnapshot.numChildren();
        } catch (error) {
            console.error('Error getting approved members:', error);
            throw error;
        }
    }
}

// Initialize default admin accounts
async function initializeAdminAccounts() {
    const adminAccounts = [
        { username: 'krsxh', email: 'krsxh@teamaxorn.com', name: 'Krsxh' },
        { username: 'lord', email: 'lord@teamaxorn.com', name: 'Lord' },
        { username: 'teamaxorn', email: 'official@teamaxorn.com', name: 'Team AXORN' },
        { username: 'ghost', email: 'ghost@teamaxorn.com', name: 'Ghost' }
    ];

    for (const admin of adminAccounts) {
        try {
            const userId = await TeamAxornDB.getUserIdByUsername(admin.username);
            if (!userId) {
                console.log(`Creating admin account for ${admin.username}`);
                // In a real implementation, you would create these accounts properly
            }
        } catch (error) {
            console.error(`Error initializing admin account ${admin.username}:`, error);
        }
    }
}

// Call initialization
initializeAdminAccounts();
