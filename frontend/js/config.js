const config = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://mistocks-production.up.railway.app'
};

export default config;