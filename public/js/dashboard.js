// Advanced WhatsApp Bot - Dashboard JavaScript

class BotDashboard {
    constructor() {
        this.statusCheckInterval = null;
        this.qrRefreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startStatusMonitoring();
        this.addAnimations();
        this.setupNotifications();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-status');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshStatus());
        }

        // Copy command buttons
        document.querySelectorAll('.command-list li').forEach(item => {
            item.addEventListener('click', () => this.copyCommand(item.textContent));
        });

        // QR code refresh
        const qrRefreshBtn = document.getElementById('qr-refresh');
        if (qrRefreshBtn) {
            qrRefreshBtn.addEventListener('click', () => this.refreshQR());
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    async refreshStatus() {
        try {
            this.showLoading('status-card');
            
            const response = await fetch('/status');
            const data = await response.json();
            
            this.updateStatusDisplay(data);
            this.showNotification('Status updated successfully', 'success');
        } catch (error) {
            console.error('Failed to refresh status:', error);
            this.showNotification('Failed to refresh status', 'error');
        } finally {
            this.hideLoading('status-card');
        }
    }

    async refreshQR() {
        try {
            this.showLoading('qr-container');
            
            // Reload the QR page
            window.location.reload();
        } catch (error) {
            console.error('Failed to refresh QR:', error);
            this.showNotification('Failed to refresh QR code', 'error');
        }
    }

    updateStatusDisplay(data) {
        // Update connection status
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            if (data.connected) {
                statusIndicator.className = 'status-indicator online';
                statusText.textContent = '✅ Connected';
                statusText.style.color = '#28a745';
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = '❌ Disconnected';
                statusText.style.color = '#dc3545';
            }
        }

        // Update timestamp
        const timestampElement = document.querySelector('.last-update');
        if (timestampElement) {
            timestampElement.textContent = `Last update: ${new Date(data.timestamp).toLocaleString()}`;
        }

        // Update stats if available
        if (data.stats) {
            this.updateStats(data.stats);
        }
    }

    updateStats(stats) {
        const statElements = {
            'uptime': document.querySelector('.stat-uptime'),
            'memory': document.querySelector('.stat-memory'),
            'reconnects': document.querySelector('.stat-reconnects')
        };

        if (statElements.uptime && stats.uptime) {
            statElements.uptime.textContent = this.formatUptime(stats.uptime);
        }

        if (statElements.memory && stats.memory) {
            statElements.memory.textContent = this.formatBytes(stats.memory.used);
        }

        if (statElements.reconnects && stats.reconnectAttempts !== undefined) {
            statElements.reconnects.textContent = stats.reconnectAttempts;
        }
    }

    startStatusMonitoring() {
        // Check status every 30 seconds
        this.statusCheckInterval = setInterval(() => {
            this.refreshStatus();
        }, 30000);

        // Auto-refresh QR page every 30 seconds if on QR page
        if (window.location.pathname === '/qr') {
            this.qrRefreshInterval = setInterval(() => {
                window.location.reload();
            }, 30000);
        }
    }

    copyCommand(command) {
        const cleanCommand = command.trim();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(cleanCommand).then(() => {
                this.showNotification(`Copied: ${cleanCommand}`, 'success');
            }).catch(() => {
                this.fallbackCopy(cleanCommand);
            });
        } else {
            this.fallbackCopy(cleanCommand);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification(`Copied: ${text}`, 'success');
        } catch (err) {
            this.showNotification('Failed to copy command', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const loader = document.createElement('div');
            loader.className = 'loading-overlay';
            loader.innerHTML = '<div class="loading"></div>';
            container.appendChild(loader);
        }
    }

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const loader = container.querySelector('.loading-overlay');
            if (loader) {
                loader.remove();
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    addAnimations() {
        // Add fade-in animation to cards
        const cards = document.querySelectorAll('.status-card, .feature-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Add hover effects
        this.addHoverEffects();
    }

    addHoverEffects() {
        // Enhanced button hover effects
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Card hover effects
        document.querySelectorAll('.feature-card, .status-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            });
        });
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        this.showNotification(`Switched to ${isDark ? 'light' : 'dark'} theme`, 'info');
    }

    setupNotifications() {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Show welcome message
        setTimeout(() => {
            this.showNotification('Dashboard loaded successfully!', 'success');
        }, 1000);
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
        if (this.qrRefreshInterval) {
            clearInterval(this.qrRefreshInterval);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.botDashboard = new BotDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.botDashboard) {
        window.botDashboard.destroy();
    }
});

// Utility functions for global use
window.BotUtils = {
    copyToClipboard: (text) => {
        if (window.botDashboard) {
            window.botDashboard.copyCommand(text);
        }
    },
    
    showNotification: (message, type) => {
        if (window.botDashboard) {
            window.botDashboard.showNotification(message, type);
        }
    },
    
    refreshStatus: () => {
        if (window.botDashboard) {
            window.botDashboard.refreshStatus();
        }
    }
};

