const API_AUTH = "http://localhost:3000/api/auth";
const API_INVESTMENTS = "http://localhost:3000/api/investments";

// Fetch logged-in user info using cookies
fetch(`${API_AUTH}/user`, {
  method: "GET",
  credentials: "include",
})
  .then(res => {
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  })
  .then(user => {
    if (user.username || user.email) {
      const displayName = user.username || user.email;
      document.getElementById("userEmail").textContent = `Hello, ${displayName}`;
    } else {
      window.location.href = "index.html";
    }
  })
  .catch(() => {
    console.log('Authentication failed, redirecting to home');
    window.location.href = "index.html";
  });

// Logout function
function logout() {
  fetch(`${API_AUTH}/logout`, {
    method: "GET",
    credentials: "include"
  }).then(() => {
    window.location.href = "index.html";
  });
}

// Update investment price
async function updateInvestmentPrice(investmentId, currentPrice) {
  try {
    const res = await fetch(`${API_INVESTMENTS}/${investmentId}/price`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ current_price: parseFloat(currentPrice) })
    });

    if (res.ok) {
      console.log('Price updated successfully');
      loadInvestments(); // Reload the table
      return true;
    } else {
      const errorData = await res.json();
      console.error('Failed to update price:', errorData.message);
      alert(errorData.message || 'Failed to update price');
      return false;
    }
  } catch (error) {
    console.error('Error updating price:', error);
    alert("Network error: Failed to update price");
    return false;
  }
}

// Delete investment
async function deleteInvestment(investmentId, symbol) {
  if (!confirm(`Are you sure you want to delete the investment in ${symbol}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_INVESTMENTS}/${investmentId}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (res.ok) {
      console.log('Investment deleted successfully');
      loadInvestments(); // Reload the table
    } else {
      const errorData = await res.json();
      console.error('Failed to delete investment:', errorData.message);
      alert(errorData.message || 'Failed to delete investment');
    }
  } catch (error) {
    console.error('Error deleting investment:', error);
    alert("Network error: Failed to delete investment");
  }
}

// Show price update modal
function showUpdatePriceModal(investmentId, symbol, currentPrice) {
  const modal = document.getElementById('priceUpdateModal');
  const form = document.getElementById('priceUpdateForm');
  const symbolSpan = document.getElementById('modalSymbol');
  const priceInput = document.getElementById('modalCurrentPrice');
  
  symbolSpan.textContent = symbol;
  priceInput.value = currentPrice || '';
  modal.classList.remove('hidden');
  
  // Handle form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    const newPrice = priceInput.value;
    
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (await updateInvestmentPrice(investmentId, newPrice)) {
      hideUpdatePriceModal();
    }
  };
}

// Hide price update modal
function hideUpdatePriceModal() {
  const modal = document.getElementById('priceUpdateModal');
  modal.classList.add('hidden');
}

// Load investments using cookies
async function loadInvestments() {
  try {
    console.log('Loading investments...');
    const res = await fetch(API_INVESTMENTS, {
      method: "GET",
      credentials: "include"
    });
   
    if (!res.ok) {
      console.error('Failed to fetch investments, status:', res.status);
      throw new Error('Failed to fetch investments');
    }
   
    const data = await res.json();
    console.log('Investments data:', data);
    const table = document.getElementById("investmentsTable");
    table.innerHTML = "";
    
    if (data.length === 0) {
      table.innerHTML = '<tr><td colspan="10" class="p-4 text-center text-gray-500">No investments found. Add your first investment above!</td></tr>';
      return;
    }
    
    data.forEach(inv => {
      const gainLossClass = inv.gain_loss_value >= 0 ? "text-green-600" : "text-red-600";
      const hasCurrentPrice = inv.current_price !== null;
      
      table.innerHTML += `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-2">${new Date(inv.date).toLocaleDateString()}</td>
          <td class="p-2 font-medium">${inv.symbol}</td>
          <td class="p-2">${inv.company_name}</td>
          <td class="p-2 text-right">${inv.quantity}</td>
          <td class="p-2 text-right">₦${parseFloat(inv.purchase_price).toFixed(2)}</td>
          <td class="p-2 text-right">
            ${hasCurrentPrice ? `₦${parseFloat(inv.current_price).toFixed(2)}` : '-'}
          </td>
          <td class="p-2 text-right">₦${inv.purchase_value ? parseFloat(inv.purchase_value).toFixed(2) : "-"}</td>
          <td class="p-2 text-right">
            ${hasCurrentPrice && inv.current_value ? `₦${parseFloat(inv.current_value).toFixed(2)}` : '-'}
          </td>
          <td class="p-2 text-right ${gainLossClass}">
            ${hasCurrentPrice && inv.gain_loss_value !== null ? 
              `₦${parseFloat(inv.gain_loss_value).toFixed(2)} (${parseFloat(inv.gain_loss_percent).toFixed(2)}%)` : 
              '-'}
          </td>
          <td class="p-2 text-center">
            <div class="flex gap-1 justify-center">
              <button 
                onclick="showUpdatePriceModal(${inv.id}, '${inv.symbol}', ${inv.current_price})"
                class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                title="Update current price"
              >
                Update Price
              </button>
              <button 
                onclick="deleteInvestment(${inv.id}, '${inv.symbol}')"
                class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                title="Delete investment"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    // Calculate and display portfolio summary
    displayPortfolioSummary(data);

    // Mobile cards view
    const mobileContainer = document.getElementById("mobileInvestments");
    mobileContainer.innerHTML = "";

    if (data.length === 0) {
      mobileContainer.innerHTML = `
        <div class="p-6 text-center text-slate-500">
          No investments found. Add your first investment above!
        </div>
      `;
      return;
    }

    data.forEach(inv => {
      const gainLossClass = inv.gain_loss_value >= 0 ? "text-green-600" : "text-red-600";
      const hasCurrentPrice = inv.current_price !== null;
      
      mobileContainer.innerHTML += `
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-slate-900">${inv.symbol}</h3>
              <p class="text-sm text-slate-600">${inv.company_name}</p>
            </div>
            <div class="flex gap-2">
              <button 
                onclick="showUpdatePriceModal(${inv.id}, '${inv.symbol}', ${inv.current_price})"
                class="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Update
              </button>
              <button 
                onclick="deleteInvestment(${inv.id}, '${inv.symbol}')"
                class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-slate-600">Purchase Date</p>
              <p class="font-medium">${new Date(inv.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="text-slate-600">Quantity</p>
              <p class="font-medium">${inv.quantity} shares</p>
            </div>
            <div>
              <p class="text-slate-600">Purchase Price</p>
              <p class="font-medium">₦${parseFloat(inv.purchase_price).toFixed(2)}</p>
            </div>
            <div>
              <p class="text-slate-600">Current Price</p>
              <p class="font-medium">${hasCurrentPrice ? `₦${parseFloat(inv.current_price).toFixed(2)}` : '-'}</p>
            </div>
            <div>
              <p class="text-slate-600">Total Investment</p>
              <p class="font-medium">₦${parseFloat(inv.purchase_value).toFixed(2)}</p>
            </div>
            <div>
              <p class="text-slate-600">Current Value</p>
              <p class="font-medium">
                ${hasCurrentPrice ? `₦${parseFloat(inv.current_value).toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
          
          ${hasCurrentPrice ? `
            <div class="mt-4 pt-4 border-t border-slate-200">
              <p class="text-slate-600 text-sm">Gain/Loss</p>
              <p class="font-bold ${gainLossClass}">
                ₦${parseFloat(inv.gain_loss_value).toFixed(2)}
                <span class="text-sm">(${parseFloat(inv.gain_loss_percent).toFixed(2)}%)</span>
              </p>
            </div>
          ` : ''}
        </div>
      `;
    });
  } catch (error) {
    console.error('Error loading investments:', error);
  }
}

// Display portfolio summary
function displayPortfolioSummary(investments) {
  let totalPurchaseValue = 0;
  let totalCurrentValue = 0;
  let investmentsWithCurrentPrice = 0;

  investments.forEach(inv => {
    if (inv.purchase_value) {
      totalPurchaseValue += parseFloat(inv.purchase_value);
    }
    if (inv.current_value) {
      totalCurrentValue += parseFloat(inv.current_value);
      investmentsWithCurrentPrice++;
    }
  });

  const totalGainLoss = totalCurrentValue - totalPurchaseValue;
  const totalGainLossPercent = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue * 100) : 0;
  const gainLossClass = totalGainLoss >= 0 ? "text-green-600" : "text-red-600";

  const summaryElement = document.getElementById('portfolioSummary');
  if (summaryElement) {
    summaryElement.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-medium text-blue-800">Total Investments</h4>
          <p class="text-2xl font-bold text-blue-600">${investments.length}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-800">Total Purchase Value</h4>
          <p class="text-2xl font-bold text-gray-600">₦${totalPurchaseValue.toFixed(2)}</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <h4 class="font-medium text-purple-800">Current Value</h4>
          <p class="text-2xl font-bold text-purple-600">
            ${investmentsWithCurrentPrice > 0 ? `₦${totalCurrentValue.toFixed(2)}` : 'Update prices'}
          </p>
          ${investmentsWithCurrentPrice < investments.length ? 
            `<p class="text-sm text-purple-500">${investmentsWithCurrentPrice}/${investments.length} with current prices</p>` : 
            ''}
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-medium text-green-800">Total Gain/Loss</h4>
          <p class="text-2xl font-bold ${gainLossClass}">
            ${investmentsWithCurrentPrice > 0 ? 
              `₦${totalGainLoss.toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)` : 
              'Update prices'}
          </p>
        </div>
      </div>
    `;
  }
}

// Add investment function
async function addInvestment(investmentData) {
  try {
    console.log('Adding investment:', investmentData);
    
    const res = await fetch(API_INVESTMENTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(investmentData)
    });
    
    console.log('Add investment response status:', res.status);
    
    if (res.ok) {
      const responseData = await res.json();
      console.log('Investment added successfully:', responseData);
      loadInvestments();
      return true;
    } else {
      let errorMessage = "Failed to add investment";
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.log('Could not parse error response');
      }
      
      console.error('Failed to add investment:', errorMessage);
      alert(errorMessage);
      return false;
    }
  } catch (error) {
    console.error('Error adding investment:', error);
    alert("Network error: Failed to add investment");
    return false;
  }
}

// Add investment form handler with validation
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById("investmentForm");
  
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      
      const date = document.getElementById("date").value;
      const symbol = document.getElementById("symbol").value;
      const company_name = document.getElementById("company_name").value;
      const quantity = document.getElementById("quantity").value;
      const purchase_price = document.getElementById("purchase_price").value;
      const current_price = document.getElementById("current_price").value;
      
      console.log('Form values:', { date, symbol, company_name, quantity, purchase_price, current_price });
      
      if (!date || !symbol || !company_name || !quantity || !purchase_price) {
        alert('Please fill in all required fields');
        return;
      }
      
      const investmentData = {
        date: date,
        symbol: symbol.toUpperCase(),
        company_name: company_name,
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchase_price),
        current_price: current_price ? parseFloat(current_price) : null,
      };
      
      if (await addInvestment(investmentData)) {
        e.target.reset();
        console.log('Form reset after successful addition');
      }
    });
  } else {
    console.error('Investment form not found!');
  }
});


    // Show/hide loading spinner
    function showLoading() {
      document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    function hideLoading() {
      document.getElementById('loadingSpinner').classList.add('hidden');
    }

    // Mobile menu toggle
    document.getElementById('menu-button').addEventListener('click', function() {
      const dropdown = document.getElementById('dropdown-menu');
      dropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      const menuButton = document.getElementById('menu-button');
      const dropdown = document.getElementById('dropdown-menu');
      
      if (!menuButton.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
      }
    });


        // Export data function
    async function exportData() {
      try {
        showLoading();
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
            `"${inv.company_name}"`,
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
        
        hideLoading();
        alert('Investment data exported successfully!');
      } catch (error) {
        hideLoading();
        console.error('Error exporting data:', error);
        alert('Failed to export data');
      }
    }

// Initial load
loadInvestments();