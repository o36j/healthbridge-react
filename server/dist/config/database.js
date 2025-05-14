"use strict";
/**
 * MongoDB Database Connection Configuration
 *
 * This module establishes and manages the connection to the MongoDB database,
 * configuring connection options, handling connection events, and ensuring
 * proper cleanup on application shutdown.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded
dotenv_1.default.config();
/**
 * Establishes a connection to MongoDB using the URI from environment variables
 * Sets up connection event handlers and graceful shutdown procedures
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        // MongoDB connection options for optimal performance and reliability
        const options = {
            maxPoolSize: 10, // Maximum number of connections in the connection pool
            serverSelectionTimeoutMS: 5000, // Timeout for server selection
            socketTimeoutMS: 45000, // Timeout for socket operations
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true, // Enable retryable writes
            retryReads: true, // Enable retryable reads
        };
        // Connect to MongoDB with configured options
        await mongoose_1.default.connect(mongoURI, options);
        // Set up event listeners for connection status monitoring
        mongoose_1.default.connection.on('error', (err) => {
            // Connection error occurred
        });
        mongoose_1.default.connection.on('disconnected', () => {
            // MongoDB disconnected
        });
        mongoose_1.default.connection.on('reconnected', () => {
            // MongoDB reconnected
        });
        // Ensure clean shutdown when application terminates
        process.on('SIGINT', async () => {
            try {
                // Close database connection gracefully
                await mongoose_1.default.connection.close();
                process.exit(0);
            }
            catch (err) {
                process.exit(1);
            }
        });
    }
    catch (error) {
        // Log connection errors and exit if connection cannot be established
        process.exit(1);
    }
};
exports.default = connectDB;
