// Apply Page Functionality
let currentApplication = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApplyPage();
});

async function initializeApplyPage() {
    showLoading(true);
    
    try {
        const user = await getCurrentUser();
        await checkExistingApplication(user);
        initializeFormHandlers();
        
    } catch (error) {
        console.error('Error initializing apply page:', error);
        showNotification('Error loading application form', 'error');
    } finally {
        showLoading(false);
    }
}

async function checkExistingApplication(user) {
    try {
        const snapshot = await database.ref('applications')
            .orderByChild('userId')
            .equalTo(user.uid)
            .once('value');
        
        if (snapshot.exists()) {
            const applications = snapshot.val();
            currentApplication = Object.values(applications)[0];
            showApplicationStatus(currentApplication);
        }
    } catch (error) {
        console.error('Error checking existing application:', error);
    }
}

function showApplicationStatus(application) {
    const applyForm = document.getElementById('applyForm');
    const statusContainer = document.getElementById('applicationStatus');
    
    if (!applyForm || !statusContainer) return;
    
    applyForm.classList.add('hidden');
    statusContainer.classList.remove('hidden');
    
    let statusConfig = {
        pending: {
            icon: '⏳',
            title: 'Application Under Review',
            description: 'Your application is being reviewed by our team. We\'ll notify you once a decision is made.',
            color: 'warning'
        },
        approved: {
            icon: '✅',
            title: 'Application Approved!',
            description: 'Congratulations! Your application has been approved. Welcome to Team AXORN!',
            color: 'success'
        },
        rejected: {
            icon: '❌',
            title: 'Application Rejected',
            description: 'Unfortunately, your application was not approved at this time.',
            color: 'error'
        }
    };
    
    const config = statusConfig[application.status] || statusConfig.pending;
    
    statusContainer.innerHTML = `
        <div class="application-status">
            <div class="status-icon">${config.icon}</div>
            <h2 class="status-title">${config.title}</h2>
            <p class="status-description">${config.description}</p>
            
            <div class="status-details">
                <p><strong>Application Details:</strong></p>
                <p><strong>Name:</strong> ${application.name}</p>
                <p><strong>Applied on:</strong> ${DateUtils.formatDate(application.appliedAt)}</p>
                <p><strong>Status:</strong> <span style="color: var(--${config.color}-color); text-transform: capitalize;">${application.status}</span></p>
            </div>
            
            ${application.status === 'approved' ? `
                <div class="form-actions" style="margin-top: 1.5rem; border-top: none; padding-top: 0;">
                    <button onclick="goToHome()" class="btn btn-primary">
                        🏠 Go to Dashboard
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function initializeFormHandlers() {
    const applyForm = document.getElementById('applyForm');
    const downloadBtn = document.getElementById('downloadCard');
    const goToHomeBtn = document.getElementById('goToHome');
    
    if (applyForm) {
        applyForm.addEventListener('submit', handleApplicationSubmit);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadApplicationCard);
    }
    
    if (goToHomeBtn) {
        goToHomeBtn.addEventListener('click', goToHome);
    }
    
    // Add real-time validation
    initializeFormValidation();
}

function initializeFormValidation() {
    const igLinkInput = document.getElementById('igLink');
    const phoneInput = document.getElementById('phoneNumber');
    
    if (igLinkInput) {
        igLinkInput.addEventListener('blur', validateInstagramLink);
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function validateInstagramLink() {
    const input = document.getElementById('igLink');
    const value = input.value.trim();
    
    if (value && !value.includes('instagram.com')) {
        showFieldError(input, 'Please enter a valid Instagram profile URL');
        return false;
    }
    
    clearFieldError(input);
    return true;
}

function formatPhoneNumber() {
    const input = document.getElementById('phoneNumber');
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    
    if (value.length >= 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length >= 3) {
        value = value.replace(/(\d{3})(\d{0,3})/, '$1-$2');
    }
    
    input.value = value;
}

function showFieldError(input, message) {
    clearFieldError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = 'var(--error-color)';
    errorDiv.style.fontSize = '0.75rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = 'var(--error-color)';
}

function clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    input.style.borderColor = '';
}

async function handleApplicationSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await getCurrentUser();
        const formData = getFormData();
        
        const applicationData = {
            userId: user.uid,
            ...formData,
            status: 'pending',
            appliedAt: new Date().toISOString(),
            applicationId: generateApplicationId()
        };
        
        // Save application to database
        const applicationRef = database.ref('applications').push();
        await applicationRef.set(applicationData);
        
        // Log application submission
        await logUserAction('application', user.uid, {
            applicationId: applicationRef.key,
            ...formData
        });
        
        currentApplication = applicationData;
        
        showNotification('Application submitted successfully!', 'success');
        showApplicationCard(applicationData, user);
        
    } catch (error) {
        console.error('Error submitting application:', error);
        showNotification('Error submitting application. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function validateForm() {
    const requiredFields = [
        'applicantName',
        'banningYear',
        'igUsername',
        'igLink',
        'phoneNumber'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Validate Instagram link
    if (!validateInstagramLink()) {
        isValid = false;
    }
    
    return isValid;
}

function getFormData() {
    return {
        name: document.getElementById('applicantName').value.trim(),
        banningYear: document.getElementById('banningYear').value,
        igUsername: document.getElementById('igUsername').value.trim(),
        igLink: document.getElementById('igLink').value.trim(),
        tgUsername: document.getElementById('tgUsername').value.trim() || 'Not provided',
        tgId: document.getElementById('tgId').value.trim() || 'Not provided',
        phone: document.getElementById('phoneNumber').value.trim()
    };
}

function generateApplicationId() {
    return 'APP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function showApplicationCard(applicationData, user) {
    // Fill card details
    document.getElementById('cardName').textContent = applicationData.name;
    document.getElementById('cardUsername').textContent = user.username;
    document.getElementById('cardJoinDate').textContent = DateUtils.formatDate(applicationData.appliedAt);
    document.getElementById('cardBanningYear').textContent = applicationData.banningYear;
    document.getElementById('cardIgUsername').textContent = applicationData.igUsername;
    document.getElementById('cardTgUsername').textContent = applicationData.tgUsername;
    
    // Format phone number for display
    const phone = applicationData.phone;
    const formattedPhone = phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
    document.getElementById('cardPhone').textContent = formattedPhone;
    
    // Show modal
    openApplicationModal();
}

function openApplicationModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function downloadApplicationCard() {
    const card = document.querySelector('.application-card');
    
    showNotification('Generating download...', 'info');
    
    html2canvas(card, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `team-axorn-membership-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        showNotification('Membership card downloaded!', 'success');
    }).catch(error => {
        console.error('Error generating card:', error);
        showNotification('Error downloading card', 'error');
    });
}

function goToHome() {
    window.location.href = 'home.html';
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
    
    const submitBtn = document.querySelector('#applyForm button[type="submit"]');
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
