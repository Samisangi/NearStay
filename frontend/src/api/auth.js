import api from './axiosInstance';

/**
 * Sends login credentials and returns the server response.
 * The refresh-token cookie is set automatically by the browser (httpOnly).
 */
export const loginUser = (data) => api.post('/auth/login', data);

/**
 * Registers a new user account (seeker or owner).
 */
export const registerUser = (data) => api.post('/auth/register', data);
