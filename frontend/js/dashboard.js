const token = localStorage.getItem("token");
const API_AUTH = "http://localhost:3000/api/auth";
const API_INVESTMENTS = "http://localhost:3000/api/investments";

// Redirect if not logged in
if (!token) {
  window.location.href = "index.html";
}

// Fetch logged-in user email
fetch(`${API_AUTH}/user`, {
  headers: { "Authorization": `Bearer ${token}` }
})
  .then(res => res.json())
  .then(user => {
    if (user.email) {
      document.getElementById("userEmail").textContent = `Logged in as: ${user.email}`;
    } else {
      window.location.href = "index.html";
    }
  })
  .catch(() => window.location.href = "index.html");

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// Load investments
async function loadInvestments() {
  const res = await fetch(API_INVESTMENTS, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  const table = document.getElementById("investmentTable");
  table.innerHTML = "";

  data.forEach(inv => {
    const gainLossClass = inv.gain_loss_value >= 0 ? "text-green-600" : "text-red-600";
    table.innerHTML += `
      <tr>
        <td class="border p-2">${new Date(inv.date).toLocaleDateString()}</td>
        <td class="border p-2">${inv.symbol}</td>
        <td class="border p-2">${inv.company_name}</td>
        <td class="border p-2">${inv.quantity}</td>
        <td class="border p-2">₦${inv.purchase_price}</td>
        <td class="border p-2">₦${inv.current_price || "-"}</td>
        <td class="border p-2">₦${inv.purchase_value || "-"}</td>
        <td class="border p-2 ${gainLossClass}">
          ₦${inv.gain_loss_value || "-"} (${inv.gain_loss_percent || 0}%)
        </td>
      </tr>
    `;
  });
}

// Add investment
document.getElementById("investmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newInvestment = {
    date: document.getElementById("date").value,
    symbol: document.getElementById("symbol").value,
    company_name: document.getElementById("company_name").value,
    quantity: parseFloat(document.getElementById("quantity").value),
    purchase_price: parseFloat(document.getElementById("purchase_price").value),
    current_price: parseFloat(document.getElementById("current_price").value) || null,
  };

  const res = await fetch(API_INVESTMENTS, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
    body: JSON.stringify(newInvestment)
  });

  if (res.ok) {
    loadInvestments();
    e.target.reset();
  } else {
    alert("Failed to add investment");
  }
});

// Initial load
loadInvestments();
