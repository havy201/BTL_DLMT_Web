import axiosClient from "./axiosClient";

const ENDPOINTS = {
  TEMPERATURE: 'api/SensorLogs/Temperature',
  HUMIDITY: 'api/SensorLogs/Humidity',
  SENSOR_LOGS: 'api/SensorLogs'
};

class SensorApi {
  async getTemperatureData(params) {
    return await axiosClient.get(ENDPOINTS.TEMPERATURE, {
      params,
      transformResponse: [(data) => JSON.parse(data)]
    });
  }

  async getHumidityData(params) {
    return await axiosClient.get(ENDPOINTS.HUMIDITY, {
      params,
      transformResponse: [(data) => JSON.parse(data)]
    });
  }

  async updateMotorStatus(value) {
    return await axiosClient.post(ENDPOINTS.SENSOR_LOGS, value, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default new SensorApi();