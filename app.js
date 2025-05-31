const express = require('express');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const connectDatabase = require('./config/connectDatabase');
const cors = require("cors");

// Configure environment variables
dotenv.config({path: path.join(__dirname, 'config', 'config.env')});

// Connect to database
connectDatabase();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ extended: true, limit: '5000mb' }));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Express app running!',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Import and use course routes ONLY if files exist
try {
    const courseRoutes = require('./routes/courseRoutes');
    app.use('/api/courses', courseRoutes);
    console.log('Course routes loaded successfully');
} catch (error) {
    console.log('Course routes not found, skipping...');
}

// Error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});


// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
    console.log(`Server listening to Port ${process.env.PORT} in ${process.env.NODE_ENV}`);
});