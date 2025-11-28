/**
 * Environment Configuration
 * 
 * Centralized configuration for environment variables.
 * This ensures consistent API URL usage across the application.
 */

/**
 * Backend API base URL
 * Defaults to localhost:3001 for development if VITE_API_URL is not set
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Environment mode
 */
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;
