// Enhanced Utility Functions

// Create particles background
function createParticlesBackground() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = Math.random() * 10 + 20;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        container.appendChild(particle);
    }
}

// Form validation helpers
const Validators = {
    email: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    username: (username) => {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    },
    
    password: (password) => {
        return password.length >= 8;
    },
    
    phone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    },
    
    url: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

// File handling utilities
const FileUtils = {
    readAsBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    validateImage: (file, maxSizeMB = 5) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = maxSizeMB * 1024 * 1024;
        
        if (!validTypes.includes(file.type)) {
            return { valid: false, error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' };
        }
        
        if (file.size > maxSize) {
            return { valid: false, error: `Image size must be less than ${maxSizeMB}MB` };
        }
        
        return { valid: true };
    }
};

// Date and time utilities
const DateUtils = {
    formatRelativeTime: (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;
        
        if (diff < minute) return 'Just now';
        if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
        if (diff < day) return `${Math.floor(diff / hour)}h ago`;
        if (diff < week) return `${Math.floor(diff / day)}d ago`;
        if (diff < month) return `${Math.floor(diff / week)}w ago`;
        if (diff < year) return `${Math.floor(diff / month)}mo ago`;
        return `${Math.floor(diff / year)}y ago`;
    },
    
    formatDate: (dateString, options = {}) => {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    formatDateTime: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Number formatting
const NumberUtils = {
    format: (number) => {
        return new Intl.NumberFormat('en-US').format(number);
    },
    
    formatCompact: (number) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(number);
    },
    
    formatPercentage: (number, decimals = 1) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }
};

// Local storage utilities
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

// API response handler
const ApiHandler = {
    handleResponse: async (response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    },
    
    handleError: (error, fallbackMessage = 'An error occurred') => {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || fallbackMessage,
            error: error
        };
    }
};

// DOM manipulation helpers
const DOM = {
    show: (element) => {
        if (element) element.classList.remove('hidden');
    },
    
    hide: (element) => {
        if (element) element.classList.add('hidden');
    },
    
    toggle: (element) => {
        if (element) element.classList.toggle('hidden');
    },
    
    enable: (element) => {
        if (element) element.disabled = false;
    },
    
    disable: (element) => {
        if (element) element.disabled = true;
    },
    
    addClass: (element, className) => {
        if (element) element.classList.add(className);
    },
    
    removeClass: (element, className) => {
        if (element) element.classList.remove(className);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Validators,
        FileUtils,
        DateUtils,
        NumberUtils,
        Storage,
        ApiHandler,
        DOM
    };
}
