require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Proxy middleware for Flask backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}));

// Import routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));