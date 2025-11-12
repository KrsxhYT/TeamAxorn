// Home Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeHomePage();
});

async function initializeHomePage() {
    showLoading(true);
    
    try {
        const user = await getCurrentUser();
        await loadUserWelcome(user);
        await loadHomeStats();
        await loadRecentUpdates();
        await checkAdminAccess();
        
    } catch (error) {
        console.error('Error initializing home page:', error);
        showNotification('Error loading dashboard', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUserWelcome(user) {
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        welcomeName.textContent = `Welcome back, ${user.name}!`;
    }
}

async function loadHomeStats() {
    try {
        // Load total members count
        const applicationsSnapshot = await database.ref('applications')
            .orderByChild('status')
            .equalTo('approved')
            .once('value');
        
        const applications = applicationsSnapshot.val();
        const totalMembers = applications ? Object.keys(applications).length : 20;
        
        // Update all total member counters
        document.getElementById('totalMembers').textContent = `${totalMembers}+ Members`;
        document.getElementById('statsTotalMembers').textContent = totalMembers;
        
        // Simulate online members (60% of total)
        const onlineMembers = Math.floor(totalMembers * 0.6);
        document.getElementById('onlineMembers').textContent = `${onlineMembers} Online`;
        document.getElementById('statsActiveMembers').textContent = onlineMembers;
        
        // Load pending applications count
        const pendingSnapshot = await database.ref('applications')
            .orderByChild('status')
            .equalTo('pending')
            .once('value');
        
        const pendingApps = pendingSnapshot.val();
        const pendingCount = pendingApps ? Object.keys(pendingApps).length : 0;
        document.getElementById('statsPending').textContent = pendingCount;
        
        // Update new updates count
        const updatesSnapshot = await database.ref('updates')
            .orderByChild('timestamp')
            .limitToLast(1)
            .once('value');
        
        const updates = updatesSnapshot.val();
        const updatesCount = updates ? Object.keys(updates).length : 0;
        document.getElementById('newUpdates').textContent = `${updatesCount} New Updates`;
        
        // Calculate growth rate (simulated)
        const growthRate = 95 + Math.floor(Math.random() * 5);
        document.getElementById('statsGrowth').textContent = `${growthRate}%`;
        
    } catch (error) {
        console.error('Error loading home stats:', error);
    }
}

async function loadRecentUpdates() {
    try {
        const snapshot = await database.ref('updates')
            .orderByChild('timestamp')
            .limitToLast(3)
            .once('value');
        
        const updates = snapshot.val();
        displayRecentUpdates(updates);
        
    } catch (error) {
        console.error('Error loading recent updates:', error);
        displayUpdatesError();
    }
}

function displayRecentUpdates(updates) {
    const updatesList = document.getElementById('updatesList');
    
    if (!updates || Object.keys(updates).length === 0) {
        updatesList.innerHTML = `
            <div class="update-item">
                <div class="update-content">
                    <p style="text-align: center; color: var(--text-secondary);">
                        No updates yet. Check back later for announcements.
                    </p>
                </div>
            </div>
        `;
        return;
    }
    
    const updatesArray = Object.entries(updates)
        .map(([id, update]) => ({ id, ...update }))
        .sort((a, b) => b.timestamp - a.timestamp);
    
    updatesList.innerHTML = updatesArray.map(update => createUpdateHTML(update)).join('');
}

function createUpdateHTML(update) {
    const timeAgo = DateUtils.formatRelativeTime(update.timestamp);
    const adminConfig = getAdminConfig(update.author.username);
    
    return `
        <div class="update-item">
            <div class="update-header">
                <div class="update-avatar">
                    ${update.author.profilePic ? 
                        `<img src="${update.author.profilePic}" alt="${update.author.name}" onerror="this.style.display='none'">` : 
                        ''
                    }
                    <div class="avatar-fallback">${getInitials(update.author.name)}</div>
                </div>
                <div class="update-info">
                    <div class="update-author">
                        <span class="author-name">${update.author.name}</span>
                        ${adminConfig ? `<span class="author-badge">${adminConfig.tag}</span>` : ''}
                    </div>
                    <div class="update-time">${timeAgo}</div>
                </div>
            </div>
            <div class="update-content">${escapeHtml(update.message)}</div>
        </div>
    `;
}

function displayUpdatesError() {
    const updatesList = document.getElementById('updatesList');
    updatesList.innerHTML = `
        <div class="update-item">
            <div class="update-content">
                <p style="text-align: center; color: var(--error-color);">
                    Error loading updates. Please try again later.
                </p>
            </div>
        </div>
    `;
}

async function checkAdminAccess() {
    try {
        const user = await getCurrentUser();
        const adminUsernames = ['krsxh', 'lord', 'teamaxorn'];
        
        if (adminUsernames.includes(user.username.toLowerCase())) {
            document.getElementById('adminQuickAccess').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
    }
}

function getAdminConfig(username) {
    const config = {
        'krsxh': { tag: 'Semxy Owner', tickColor: 'red' },
        'lord': { tag: 'Axorn Owner', tickColor: 'green' },
        'teamaxorn': { tag: 'Axorn Official', tickColor: 'blue' },
        'ghost': { tag: 'Leader', tickColor: 'blue' }
    };
    
    return config[username.toLowerCase()];
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Real-time updates listener
database.ref('updates').on('child_added', (snapshot) => {
    loadRecentUpdates();
    loadHomeStats(); // Refresh stats when new update is added
});

// Show loading function
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
}
