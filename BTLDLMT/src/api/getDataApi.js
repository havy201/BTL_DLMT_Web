import axiosClient from "./axiosClient";

const getDataApi = {
    getTemperatureData(params) {
        const url = 'api/SensorLogs/Temperature';
        return axiosClient.get(url, { params });
    },

    getHumidityData(params) {
        const url = 'api/SensorLogs/Humidity';
        return axiosClient.get(url, { params });
    },

    updateLightbulbStatus(value) {
        const url = 'api/SensorLogs';
        return axiosClient.post(url, { value });
    }
};

export default getDataApi;