import config from './config.js';

const API_AUTH = `${config.API_URL}/api/auth`;
const API_PROFILE = `${config.API_URL}/api/profile`;
const API_INVESTMENTS = `${config.API_URL}/api/investments`;


// Show message function
function showMessage(message, type = 'success') {
  const container = document.getElementById('messageContainer');
  const messageDiv = document.createElement('div');
  
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  
  messageDiv.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg mb-2`;
  messageDiv.textContent = message;
  
  container.appendChild(messageDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

// Logout function
function logout() {
  fetch(`${API_AUTH}/logout`, {
    method: "GET",
    credentials: "include"
  }).then(() => {
    window.location.href = "index.html";
  });
}

// Load user profile
async function loadProfile() {
  try {
    const res = await fetch(`${API_PROFILE}/`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error('Failed to load profile');
    }

    const user = await res.json();
    
    // Update profile display
    const displayName = user.username || user.email.split('@')[0];
    const initials = displayName.substring(0, 2).toUpperCase();
    
    document.getElementById('displayName').textContent = displayName;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userInitials').textContent = initials;
    document.getElementById('memberSince').textContent = 
      `Member since: ${new Date(user.created_at).toLocaleDateString()}`;
    
    // Pre-fill current username
    document.getElementById('newUsername').value = user.username || '';
    document.getElementById('newEmail').value = user.email;
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showMessage('Failed to load profile data', 'error');
    // Redirect to login if not authenticated
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

// Load user statistics
async function loadUserStats() {
  try {
    const res = await fetch(`${API_PROFILE}/stats`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error('Failed to load stats');
    }

    const stats = await res.json();
    
    // Update statistics
    document.getElementById('totalInvestments').textContent = stats.total_investments || '0';
    document.getElementById('totalInvested').textContent = 
      stats.total_invested ? `₦${parseFloat(stats.total_invested).toFixed(2)}` : '₦0';
    document.getElementById('currentValue').textContent = 
      stats.current_value ? `₦${parseFloat(stats.current_value).toFixed(2)}` : '₦0';
    document.getElementById('priceUpdates').textContent = 
      `${stats.investments_with_price || 0}/${stats.total_investments || 0}`;

    // Show top performers if any
    if (stats.top_performers && stats.top_performers.length > 0) {
      const section = document.getElementById('topPerformersSection');
      const container = document.getElementById('topPerformers');
      
      section.classList.remove('hidden');
      container.innerHTML = '';
      
      stats.top_performers.forEach(stock => {
        const performanceClass = stock.performance_percent >= 0 ? 'text-green-600' : 'text-red-600';
        const performanceIcon = stock.performance_percent >= 0 ? '📈' : '📉';
        
        container.innerHTML += `
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">${stock.symbol}</span>
              <span class="${performanceClass}">${performanceIcon}</span>
            </div>
            <p class="text-xs text-gray-600 truncate">${stock.company_name}</p>
            <p class="text-sm ${performanceClass} font-medium">
              ${parseFloat(stock.performance_percent).toFixed(2)}%
            </p>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Update username
document.getElementById('usernameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('newUsername').value.trim();
  
  if (!username || username.length < 3) {
    showMessage('Username must be at least 3 characters long', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_PROFILE}/username`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('Username updated successfully!');
      // Update display name
      document.getElementById('displayName').textContent = username;
      document.getElementById('userInitials').textContent = username.substring(0, 2).toUpperCase();
    } else {
      showMessage(data.message || 'Failed to update username', 'error');
    }
  } catch (error) {
    console.error('Error updating username:', error);
    showMessage('Network error. Please try again.', 'error');
  }
});

// Update email
document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('newEmail').value.trim();
  const currentPassword = document.getElementById('currentPasswordForEmail').value;
  
  if (!email || !currentPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_PROFILE}/email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, currentPassword })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('Email updated successfully!');
      document.getElementById('userEmail').textContent = email;
      document.getElementById('currentPasswordForEmail').value = '';
    } else {
      showMessage(data.message || 'Failed to update email', 'error');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    showMessage('Network error. Please try again.', 'error');
  }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  
  if (!currentPassword || !newPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showMessage('New password must be at least 6 characters long', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_PROFILE}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('Password changed successfully!');
      document.getElementById('passwordForm').reset();
    } else {
      showMessage(data.message || 'Failed to change password', 'error');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showMessage('Network error. Please try again.', 'error');
  }
});

// Export user data
async function exportData() {
  try {
    const res = await fetch(API_INVESTMENTS, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }

    const investments = await res.json();
    
    // Create CSV content
    const headers = ['Date', 'Symbol', 'Company', 'Quantity', 'Purchase Price', 'Current Price', 'Purchase Value', 'Current Value', 'Gain/Loss'];
    const csvContent = [
      headers.join(','),
      ...investments.map(inv => [
        inv.date,
        inv.symbol,
        `"${inv.company_name}"`, // Quotes to handle commas in company names
        inv.quantity,
        inv.purchase_price,
        inv.current_price || '',
        inv.purchase_value || '',
        inv.current_value || '',
        inv.gain_loss_value || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stockvista-investments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Investment data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    showMessage('Failed to export data', 'error');
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadProfile();
  loadUserStats();
});