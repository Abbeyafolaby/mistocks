    const API_BASE = "http://localhost:3000/api/auth";

    // Register
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
        alert("Registered successfully! Please login.");
        window.location.href = "index.html";
        } else {
        alert("Registration failed!");
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

        const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for cookies
        body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
        alert("Login successful!");
        window.location.href = "dashboard.html";
        } else {
        alert("Invalid credentials!");
        }
    });
    }
