import axios from 'axios'; // Import thư viện axios để thực hiện HTTP requests


class HttpClient {
  constructor() {
    // Store class instance configuration
    this.clientConfig = {
      baseURL: import.meta.env.VITE_API, // URL cơ sở cho tất cả requests
      headers: {
        'Content-Type': 'application/json', // URL cơ sở cho tất cả requests
      },
      timeout: 10000, // Thời gian chờ tối đa cho mỗi request (10 giây)
      retryLimit: 3, // Số lần thử lại tối đa khi request thất bại
      retryDelay: 1000 // Thời gian đợi giữa các lần thử lại (1 giây)
    };

    // Create and store axios instance
    this.instance = axios.create(this.clientConfig); // Tạo instance axios với config
    this.setupInterceptors(); // Thiết lập interceptors
  }
// Thiết lập interceptor cho requests
  setupInterceptors = () => {
    this.instance.interceptors.request.use(
      this.handleRequest, // Thiết lập interceptor cho requests
      this.handleError // Xử lý lỗi request
    );
// Thiết lập interceptor cho responses
    this.instance.interceptors.response.use(
      this.handleResponse, // Xử lý response
      this.handleError // Xử lý lỗi response
    );
  }
// Xử lý request
  handleRequest = (config) => {
    const token = localStorage.getItem('token'); // Lấy token từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  handleResponse = (response) => {
    return response.data; // Trả về dữ liệu từ response
  }

  handleError = async (error) => {
    const { config, response } = error;
    
    if (!response) {
      const currentRetryCount = (config.retryCount || 0) + 1;
      config.retryCount = currentRetryCount;
      
      if (currentRetryCount <= this.clientConfig.retryLimit) {
        await new Promise(resolve => 
          setTimeout(resolve, this.clientConfig.retryDelay)
        );
        return this.instance(config);
      }
    }
    
    return Promise.reject(error);
  }
}

// Export the configured axios instance
const httpClient = new HttpClient();
export default httpClient.instance;