// Mock data and functions for development
export const loadMocks = (axiosInstance) => {
  // Mock interceptor for development
  axiosInstance.interceptors.request.use((config) => {
    // Add mock logic here if needed
    return config;
  });
};
