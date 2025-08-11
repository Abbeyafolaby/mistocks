const config = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://your-railway-app-url.railway.app'
};

export default config;