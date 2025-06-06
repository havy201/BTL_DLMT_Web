import axios from 'axios'; // Import thư viện axios để thực hiện HTTP requests

class HttpClient {
  constructor() {
    this.config = {
      baseURL: import.meta.env.VITE_API, // URL cơ sở cho tất cả requests
      headers: {
        'Content-Type': 'application/json', // Định dạng dữ liệu gửi đi là JSON
      },
      timeout: 10000, // Thời gian chờ tối đa cho mỗi request (10 giây)
      retryLimit: 3, // Số lần thử lại tối đa khi request thất bại
      retryDelay: 1000 // Thời gian đợi giữa các lần thử lại (1 giây)
    };

    this.instance = axios.create(this.config); // Tạo instance axios với config
    this.setupInterceptors(); // Thiết lập interceptors
  }

  setupInterceptors() {
    // Thiết lập interceptor cho requests
    this.instance.interceptors.request.use(
      this.handleRequest.bind(this), // Xử lý trước khi gửi request
      this.handleError.bind(this) // Xử lý lỗi request
    );

    // Thiết lập interceptor cho responses
    this.instance.interceptors.response.use(
      this.handleResponse.bind(this), // Xử lý khi nhận response
      this.handleError.bind(this) // Xử lý lỗi response
    );
  }

  handleRequest(config) {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    return config;
  }

  handleResponse(response) {
    return response.data; // Trả về dữ liệu từ response
  }

  async handleError(error) {
    const { config, response } = error;
    
    if (!response) { // Nếu không có response (network error)
      config.retryCount = (config.retryCount || 0) + 1; // Tăng số lần thử
      
      if (config.retryCount <= this.config.retryLimit) { // Kiểm tra giới hạn thử lại
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay) // Đợi trước khi thử lại
        );
        return this.instance(config); // Thử lại request
      }
    }
    
    return Promise.reject(error); // Trả về lỗi nếu không thể xử lý
  }
}

export default new HttpClient().instance; // Export instance axios đã được cấu hình