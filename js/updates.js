// Updates Page Functionality
let isAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeUpdatesPage();
});

async function initializeUpdatesPage() {
    showLoading(true);
    
    try {
        const user = await getCurrentUser();
        await loadAdminInfo();
        await checkAdminPermissions(user);
        await loadUpdates();
        initializeRealTimeUpdates();
        
    } catch (error) {
        console.error('Error initializing updates page:', error);
        showNotification('Error loading updates', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadAdminInfo() {
    try {
        const snapshot = await database.ref('applications')
            .orderByChild('status')
            .equalTo('approved')
            .once('value');
        
        const applications = snapshot.val();
        const totalMembers = applications ? Object.keys(applications).length : 20;
        const onlineMembers = Math.floor(totalMembers * 0.6);
        
        document.getElementById('totalMembersCount').textContent = totalMembers;
        document.getElementById('onlineMembersCount').textContent = onlineMembers;
        
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

async function checkAdminPermissions(user) {
    const adminUsernames = ['krsxh', 'lord', 'teamaxorn'];
    
    if (adminUsernames.includes(user.username.toLowerCase())) {
        isAdmin = true;
        document.getElementById('updateFormContainer').classList.remove('hidden');
        initializeUpdateForm();
    }
}

function initializeUpdateForm() {
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdatePost);
    }
}

async function handleUpdatePost(e) {
    e.preventDefault();
    
    const message = document.getElementById('updateMessage').value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    showFormLoading(true);
    
    try {
        const user = await getCurrentUser();
        
        const updateData = {
            author: {
                uid: user.uid,
                name: user.name,
                username: user.username,
                profilePic: user.profilePic || '',
                role: user.role || 'member'
            },
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            createdAt: new Date().toISOString(),
            isPinned: false
        };
        
        await database.ref('updates').push(updateData);
        
        // Clear form
        document.getElementById('updateMessage').value = '';
        
        showNotification('Update posted successfully!', 'success');
        
    } catch (error) {
        console.error('Error posting update:', error);
        showNotification('Error posting update: ' + error.message, 'error');
    } finally {
        showFormLoading(false);
    }
}

function clearUpdateForm() {
    document.getElementById('updateMessage').value = '';
}

async function loadUpdates() {
    try {
        const snapshot = await database.ref('updates')
            .orderByChild('timestamp')
            .limitToLast(50)
            .once('value');
        
        const updates = snapshot.val();
        displayUpdates(updates);
        
    } catch (error) {
        console.error('Error loading updates:', error);
        displayUpdatesError();
    }
}

function displayUpdates(updates) {
    const updatesList = document.getElementById('updatesList');
    
    if (!updates || Object.keys(updates).length === 0) {
        updatesList.innerHTML = `
            <div class="no-updates">
                <div class="icon">📢</div>
                <h3>No Updates Yet</h3>
                <p>Check back later for announcements from the admin team</p>
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
    const isPinned = update.isPinned;
    
    return `
        <div class="update-item ${isPinned ? 'pinned' : ''}" data-update-id="${update.id}">
            <div class="update-header">
                <div class="update-avatar">
                    ${update.author.profilePic ? 
                        `<img src="${update.author.profilePic}" alt="${update.author.name}" onerror="this.style.display='none'">` : 
                        ''
                    }
                    <div class="avatar-fallback">${getInitials(update.author.name)}</div>
                    ${adminConfig ? `<div class="verified-badge ${adminConfig.tickColor}">✓</div>` : ''}
                </div>
                
                <div class="update-author-info">
                    <div class="update-author">
                        <span class="author-name">${update.author.name}</span>
                        <span class="author-username">@${update.author.username}</span>
                        ${adminConfig ? `<span class="author-tag ${getTagClass(update.author.username)}">${adminConfig.tag}</span>` : ''}
                    </div>
                    
                    <div class="update-meta">
                        <span class="update-time">${timeAgo}</span>
                        ${isAdmin ? `
                            <div class="update-actions">
                                <button class="update-action" onclick="pinUpdate('${update.id}', ${!isPinned})" title="${isPinned ? 'Unpin' : 'Pin'}">
                                    ${isPinned ? '📌' : '📍'}
                                </button>
                                <button class="update-action" onclick="deleteUpdate('${update.id}')" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="update-content">${formatUpdateContent(update.message)}</div>
        </div>
    `;
}

function formatUpdateContent(message) {
    // Basic markdown-like formatting
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
}

function displayUpdatesError() {
    const updatesList = document.getElementById('updatesList');
    updatesList.innerHTML = `
        <div class="no-updates">
            <div class="icon">❌</div>
            <h3>Error Loading Updates</h3>
            <p>Please try refreshing the page</p>
        </div>
    `;
}

function initializeRealTimeUpdates() {
    database.ref('updates').on('child_added', (snapshot) => {
        loadUpdates(); // Reload updates when new one is added
    });
    
    database.ref('updates').on('child_changed', (snapshot) => {
        loadUpdates(); // Reload updates when one is modified
    });
    
    database.ref('updates').on('child_removed', (snapshot) => {
        loadUpdates(); // Reload updates when one is removed
    });
}

async function pinUpdate(updateId, pinState) {
    try {
        await database.ref('updates/' + updateId).update({
            isPinned: pinState
        });
        
        showNotification(pinState ? 'Update pinned' : 'Update unpinned', 'success');
    } catch (error) {
        console.error('Error pinning update:', error);
        showNotification('Error updating pin status', 'error');
    }
}

async function deleteUpdate(updateId) {
    if (!confirm('Are you sure you want to delete this update? This action cannot be undone.')) {
        return;
    }
    
    try {
        await database.ref('updates/' + updateId).remove();
        showNotification('Update deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting update:', error);
        showNotification('Error deleting update', 'error');
    }
}

function refreshUpdates() {
    showLoading(true);
    loadUpdates().finally(() => showLoading(false));
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

function getTagClass(username) {
    const config = {
        'krsxh': 'owner',
        'lord': 'owner',
        'teamaxorn': 'official',
        'ghost': 'leader'
    };
    
    return config[username.toLowerCase()] || '';
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function showFormLoading(show) {
    const submitBtn = document.querySelector('#updateForm button[type="submit"]');
    if (submitBtn) {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        if (btnText && btnLoader) {
            btnText.classList.toggle('hidden', show);
            btnLoader.classList.toggle('hidden', !show);
        }
        
        submitBtn.disabled = show;
    }
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
}
