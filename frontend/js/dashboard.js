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
    if (user.email) {
      document.getElementById("userEmail").textContent = `Hello, ${user.email}`;
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

// Load investments using cookies
async function loadInvestments() {
  try {
    console.log('Loading investments...'); // Debug log
    const res = await fetch(API_INVESTMENTS, {
      method: "GET",
      credentials: "include"
    });
   
    if (!res.ok) {
      console.error('Failed to fetch investments, status:', res.status); // Debug log
      throw new Error('Failed to fetch investments');
    }
   
    const data = await res.json();
    console.log('Investments data:', data); // Debug log
    const table = document.getElementById("investmentsTable");
    table.innerHTML = "";
    
    if (data.length === 0) {
      table.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-gray-500">No investments found. Add your first investment above!</td></tr>';
      return;
    }
    
    data.forEach(inv => {
      const gainLossClass = inv.gain_loss_value >= 0 ? "text-green-600" : "text-red-600";
      table.innerHTML += `
        <tr class="border-b">
          <td class="p-2">${new Date(inv.date).toLocaleDateString()}</td>
          <td class="p-2 font-medium">${inv.symbol}</td>
          <td class="p-2">${inv.company_name}</td>
          <td class="p-2 text-right">${inv.quantity}</td>
          <td class="p-2 text-right">₦${parseFloat(inv.purchase_price).toFixed(2)}</td>
          <td class="p-2 text-right">₦${inv.current_price ? parseFloat(inv.current_price).toFixed(2) : "-"}</td>
          <td class="p-2 text-right">₦${inv.purchase_value ? parseFloat(inv.purchase_value).toFixed(2) : "-"}</td>
          <td class="p-2 text-right">₦${inv.current_value ? parseFloat(inv.current_value).toFixed(2) : "-"}</td>
          <td class="p-2 text-right ${gainLossClass}">
            ₦${inv.gain_loss_value ? parseFloat(inv.gain_loss_value).toFixed(2) : "-"}
            (${inv.gain_loss_percent ? parseFloat(inv.gain_loss_percent).toFixed(2) : "0"}%)
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error loading investments:', error);
  }
}

// Add investment function with better error handling
async function addInvestment(investmentData) {
  try {
    console.log('Adding investment:', investmentData); // Debug log
    
    const res = await fetch(API_INVESTMENTS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(investmentData)
    });
    
    console.log('Add investment response status:', res.status); // Debug log
    
    if (res.ok) {
      const responseData = await res.json();
      console.log('Investment added successfully:', responseData); // Debug log
      loadInvestments();
      return true;
    } else {
      // Try to get error message from response
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
      console.log('Form submitted'); // Debug log
      
      // Get form values
      const date = document.getElementById("date").value;
      const symbol = document.getElementById("symbol").value;
      const company_name = document.getElementById("company_name").value;
      const quantity = document.getElementById("quantity").value;
      const purchase_price = document.getElementById("purchase_price").value;
      const current_price = document.getElementById("current_price").value;
      
      console.log('Form values:', { date, symbol, company_name, quantity, purchase_price, current_price }); // Debug log
      
      // Basic validation
      if (!date || !symbol || !company_name || !quantity || !purchase_price) {
        alert('Please fill in all required fields');
        return;
      }
      
      const investmentData = {
        date: date,
        symbol: symbol.toUpperCase(), // Convert to uppercase
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

// Initial load
loadInvestments();