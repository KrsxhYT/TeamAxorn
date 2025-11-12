document.addEventListener('DOMContentLoaded', function() {
    const applyForm = document.getElementById('applyForm');
    const applicationModal = document.getElementById('applicationModal');
    const downloadCardBtn = document.getElementById('downloadCard');
    const goToHomeBtn = document.getElementById('goToHome');
    
    if (applyForm) {
        applyForm.addEventListener('submit', handleApplication);
    }
    
    if (downloadCardBtn) {
        downloadCardBtn.addEventListener('click', downloadApplicationCard);
    }
    
    if (goToHomeBtn) {
        goToHomeBtn.addEventListener('click', goToHome);
    }
    
    // Check if user already has an application
    checkExistingApplication();
});

async function checkExistingApplication() {
    try {
        const user = await getCurrentUser();
        const applicationsRef = database.ref('applications');
        
        applicationsRef.orderByChild('userId').equalTo(user.uid).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const applications = snapshot.val();
                const application = Object.values(applications)[0];
                
                if (application.status === 'approved') {
                    window.location.href = 'home.html';
                } else {
                    showApplicationStatus(application);
                }
            }
        });
    } catch (error) {
        console.error('Error checking application:', error);
    }
}

function showApplicationStatus(application) {
    const applyContainer = document.querySelector('.apply-container');
    applyContainer.innerHTML = `
        <div class="application-status">
            <div class="status-icon">⏳</div>
            <h2>Application Under Review</h2>
            <p>Your application is currently being reviewed by our team.</p>
            <div class="application-details">
                <p><strong>Name:</strong> ${application.name}</p>
                <p><strong>Applied on:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

async function handleApplication(e) {
    e.preventDefault();
    
    try {
        const user = await getCurrentUser();
        
        const applicationData = {
            userId: user.uid,
            name: document.getElementById('applicantName').value,
            banningYear: document.getElementById('banningYear').value,
            igUsername: document.getElementById('igUsername').value,
            igLink: document.getElementById('igLink').value,
            tgUsername: document.getElementById('tgUsername').value || '',
            tgId: document.getElementById('tgId').value || '',
            phone: document.getElementById('phoneNumber').value,
            status: 'pending',
            appliedAt: new Date().toISOString()
        };
        
        // Save application to database
        const applicationRef = database.ref('applications').push();
        await applicationRef.set(applicationData);
        
        // Log application
        logUserAction('application', user.uid, applicationData);
        
        // Show application card
        showApplicationCard(applicationData, user);
        
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Error submitting application: ' + error.message);
    }
}

function showApplicationCard(applicationData, user) {
    // Fill card details
    document.getElementById('cardName').textContent = applicationData.name;
    document.getElementById('cardUsername').textContent = user.username;
    document.getElementById('cardJoinDate').textContent = new Date().toLocaleDateString();
    document.getElementById('cardBanningYear').textContent = applicationData.banningYear;
    document.getElementById('cardIgUsername').textContent = applicationData.igUsername;
    document.getElementById('cardTgUsername').textContent = applicationData.tgUsername || 'Not provided';
    
    // Format phone number (show first 3 and last 3 digits)
    const phone = applicationData.phone;
    const formattedPhone = phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
    document.getElementById('cardPhone').textContent = formattedPhone;
    
    // Show modal
    applicationModal.classList.remove('hidden');
}

function downloadApplicationCard() {
    const card = document.querySelector('.application-card');
    
    html2canvas(card).then(canvas => {
        const link = document.createElement('a');
        link.download = 'team-axorn-membership-card.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function goToHome() {
    window.location.href = 'home.html';
}
