const API_BASE = "http://localhost:3000/api/auth"; 

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const username = document.getElementById("username").value;

    // Basic validation
    if (!email || !password || !username) {
      alert("Please fill in all fields");
      return;
    }

    if (username.length < 3) {
      alert("Username must be at least 3 characters long");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, username }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registered successfully! Please login.");
        window.location.href = "login.html";
      } else {
        alert(data.error || "Registration failed!");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Network error. Please try again.");
    }
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      } else {
        alert(data.error || "Invalid credentials!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please try again.");
    }
  });
}