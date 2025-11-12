// Profile Page Functionality
let currentUser = null;
let originalUsername = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeProfilePage();
});

async function initializeProfilePage() {
    showLoading(true);
    
    try {
        currentUser = await getCurrentUser();
        originalUsername = currentUser.username;
        await loadProfileData(currentUser);
        initializeEditForm();
        
    } catch (error) {
        console.error('Error initializing profile page:', error);
        showNotification('Error loading profile', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProfileData(user) {
    // Update profile view
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileUsername').textContent = '@' + user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('followersCount').textContent = user.followers || 0;
    document.getElementById('followingCount').textContent = user.following || 0;
    document.getElementById('postsCount').textContent = user.postsCount || 0;
    
    // Set tag based on role
    const tagElement = document.getElementById('profileTag');
    const adminConfig = getAdminConfig(user.username);
    
    if (adminConfig) {
        tagElement.textContent = adminConfig.tag;
        tagElement.className = 'profile-tag ' + getTagClass(user.username);
    } else {
        tagElement.textContent = 'Member of TEAM AXORN';
        tagElement.className = 'profile-tag';
    }
    
    // Set bio
    const bioElement = document.getElementById('profileBio');
    if (user.bio) {
        bioElement.textContent = user.bio;
    } else {
        bioElement.textContent = 'No bio yet. Tell everyone about yourself!';
        bioElement.style.color = 'var(--text-secondary)';
        bioElement.style.fontStyle = 'italic';
    }
    
    // Set join date
    if (user.joinDate) {
        document.getElementById('joinDate').textContent = DateUtils.formatDate(user.joinDate);
    }
    
    // Set phone
    if (user.phone) {
        document.getElementById('profilePhone').textContent = user.phone;
    }
    
    // Set avatar
    updateAvatarDisplay(user.profilePic, user.name);
    
    // Load social links
    await loadSocialLinks(user);
}

function updateAvatarDisplay(profilePic, name) {
    const avatarImg = document.getElementById('profileAvatar');
    const avatarFallback = document.getElementById('avatarFallback');
    const previewImg = document.getElementById('avatarPreview');
    const previewFallback = document.getElementById('avatarPreviewFallback');
    
    const initials = getInitials(name);
    
    if (profilePic) {
        avatarImg.src = profilePic;
        avatarImg.style.display = 'block';
        avatarFallback.style.display = 'none';
        
        previewImg.src = profilePic;
        previewImg.style.display = 'block';
        previewFallback.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarFallback.style.display = 'flex';
        avatarFallback.textContent = initials;
        
        previewImg.style.display = 'none';
        previewFallback.style.display = 'flex';
        previewFallback.textContent = initials;
    }
}

async function loadSocialLinks(user) {
    const socialLinksContainer = document.getElementById('socialLinks');
    
    // For now, we'll show static social links
    // In a real app, these would come from user data
    const socialLinks = [
        {
            platform: 'Instagram',
            handle: user.igUsername || 'Not connected',
            icon: '📷',
            color: '#E4405F'
        },
        {
            platform: 'Telegram',
            handle: user.tgUsername || 'Not connected',
            icon: '💬',
            color: '#0088CC'
        }
    ];
    
    const hasLinks = socialLinks.some(link => link.handle !== 'Not connected');
    
    if (!hasLinks) {
        socialLinksContainer.innerHTML = '<div class="no-links">No social links connected yet</div>';
        return;
    }
    
    socialLinksContainer.innerHTML = socialLinks.map(link => `
        <a href="#" class="social-link" style="border-left-color: ${link.color}">
            <div class="social-icon" style="background: ${link.color}">
                ${link.icon}
            </div>
            <div class="social-info">
                <div class="social-platform">${link.platform}</div>
                <div class="social-handle">${link.handle}</div>
            </div>
        </a>
    `).join('');
}

function initializeEditForm() {
    const editForm = document.getElementById('editProfileForm');
    const avatarInput = document.getElementById('avatarInput');
    
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Fill edit form with current data
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
}

function openEditProfile() {
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('editProfileView').classList.remove('hidden');
}

function closeEditProfile() {
    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('editProfileView').classList.add('hidden');
    // Reset form to original values
    initializeEditForm();
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    
    if (!name || !username) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (bio.length > 200) {
        showNotification('Bio must be 200 characters or less', 'error');
        return;
    }
    
    showFormLoading(true);
    
    try {
        // Check if username changed and is available
        if (username !== originalUsername) {
            const isAvailable = await checkUsernameAvailability(username);
            if (!isAvailable) {
                showNotification('Username already taken. Please choose another one.', 'error');
                return;
            }
        }
        
        const updates = {
            name: name,
            username: username.toLowerCase(),
            bio: bio,
            phone: phone,
            updatedAt: new Date().toISOString()
        };
        
        // Update username mapping if username changed
        if (username !== originalUsername) {
            // Remove old username mapping
            await database.ref('usernames/' + originalUsername).remove();
            // Add new username mapping
            await database.ref('usernames/' + username.toLowerCase()).set(currentUser.uid);
        }
        
        // Update user data
        await database.ref('users/' + currentUser.uid).update(updates);
        
        // Update local user data
        currentUser = { ...currentUser, ...updates };
        originalUsername = username.toLowerCase();
        
        // Reload profile
        await loadProfileData(currentUser);
        
        closeEditProfile();
        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    } finally {
        showFormLoading(false);
    }
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const validation = FileUtils.validateImage(file);
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        updateAvatarPreview(base64Image);
        saveAvatar(base64Image);
    };
    reader.readAsDataURL(file);
}

function updateAvatarPreview(base64Image) {
    const previewImg = document.getElementById('avatarPreview');
    const previewFallback = document.getElementById('avatarPreviewFallback');
    
    previewImg.src = base64Image;
    previewImg.style.display = 'block';
    previewFallback.style.display = 'none';
}

async function saveAvatar(base64Image) {
    try {
        await database.ref('users/' + currentUser.uid).update({
            profilePic: base64Image,
            updatedAt: new Date().toISOString()
        });
        
        // Update current user data
        currentUser.profilePic = base64Image;
        
        // Update profile view
        updateAvatarDisplay(base64Image, currentUser.name);
        
        showNotification('Profile picture updated!', 'success');
        
    } catch (error) {
        console.error('Error saving avatar:', error);
        showNotification('Error saving profile picture', 'error');
    }
}

function removeAvatar() {
    const previewImg = document.getElementById('avatarPreview');
    const previewFallback = document.getElementById('avatarPreviewFallback');
    const initials = getInitials(currentUser.name);
    
    previewImg.style.display = 'none';
    previewFallback.style.display = 'flex';
    previewFallback.textContent = initials;
    
    // Remove from database
    database.ref('users/' + currentUser.uid).update({
        profilePic: '',
        updatedAt: new Date().toISOString()
    });
    
    // Update current user data
    currentUser.profilePic = '';
    
    // Update profile view
    updateAvatarDisplay('', currentUser.name);
    
    showNotification('Profile picture removed', 'success');
}

function shareProfile() {
    const profileUrl = `https://team-axorn.vercel.app/profile/${currentUser.username}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${currentUser.name} - Team AXORN`,
            text: `Check out ${currentUser.name}'s profile on Team AXORN`,
            url: profileUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(profileUrl).then(() => {
            showNotification('Profile link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback fallback: show URL
            prompt('Copy this link to share:', profileUrl);
        });
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
    const submitBtn = document.querySelector('#editProfileForm button[type="submit"]');
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
