import { useState, useEffect } from 'react'
import { ClipLoader } from 'react-spinners';
import getDataApi from './api/getDataApi';
import { Chart as ChartJs } from 'chart.js/auto';
import { Line } from 'react-chartjs-2'
import './App.css'

const TEMPERATURE_THRESHOLD = 36; // Ngưỡng nhiệt độ để tự động bật đèn

function formatDateVN(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Tháng tính từ 0
  const year = date.getFullYear();

  return `Ngày ${day} tháng ${month} năm ${year}`;
}

function App() {
  const [tempUnit, setTempUnit] = useState('C')
  const [temperature1, setTemperature1] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [temperature, setTemperature] = useState(null)
  const [humidity, setHumidity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbulbActive, setLightbulbActive] = useState(0);
  const [temperatureChart, setTemperatureChart] = useState([])
  const [humidityChart, setHumidityChart] = useState([])
  const [tempAxisVisible, setTempAxisVisible] = useState(true)
  const [humidityAxisVisible, setHumidityAxisVisible] = useState(true)
  const [isChartPaused, setIsChartPaused] = useState(false)
  const [pausedChartData, setPausedChartData] = useState({
    temperatureChart: [],
    humidityChart: []
  })

  useEffect(() => {
    const GetApi = async () => {
      const temperatureData = await getDataApi.getTemperatureData();
      const humidityData = await getDataApi.getHumidityData();

      setHumidity(humidityData.value);
      setTemperature(temperatureData.value);

      // Tự động bật đèn khi nhiệt độ > 36°C
      if (temperatureData.value > TEMPERATURE_THRESHOLD) {
        setLightbulbActive(1);
      }

      setLoading(false);

      const newTemp = {
        timeStamp: temperatureData.timeStamp,
        temperature: temperatureData.value || 0,
        temperature1: Math.round((temperatureData.value * 9 / 5) + 32)
      };

      const newHumidity = {
        timeStamp: temperatureData.timeStamp,
        humidity: humidityData.value || 0,
      };

      if (!isChartPaused) {
        setTemperatureChart(prevData => {
          const newData = [...prevData, newTemp];
          return newData.slice(-15);
        });

        setHumidityChart(prevData => {
          const newData = [...prevData, newHumidity];
          return newData.slice(-15);
        });
      } else {
        setPausedChartData(prevData => ({
          temperatureChart: [...prevData.temperatureChart, newTemp].slice(-15),
          humidityChart: [...prevData.humidityChart, newHumidity].slice(-15)
        }));
      }
    };

    GetApi();

    const interval = setInterval(() => {
      GetApi();
    }, 1000);

    return () => clearInterval(interval);
  }, [isChartPaused]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Convert temperature when unit changes
  const handleUnitChange = (unit) => {
    if (unit === tempUnit) return;

    if (unit === 'F') {
      // Convert from Celsius to Fahrenheit: (C × 9/5) + 32
      setTemperature1(Math.round((temperature * 9 / 5) + 32));
    } else {
      // Convert from Fahrenheit to Celsius: (F - 32) × 5/9
      setTemperature(Math.round((temperature1 - 32) * 5 / 9));
    }

    setTempUnit(unit);
  };

  const formatTime = (date) => {
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
    return date.toLocaleTimeString('en-US', options);
  };

  const updateLightbulbStatus = async (isOn) => {
    setLightbulbActive(isOn);
    await getDataApi.updateLightbulbStatus(isOn);
  };

  const handleChartPauseResume = () => {
    if (isChartPaused) {
      setTemperatureChart(pausedChartData.temperatureChart);
      setHumidityChart(pausedChartData.humidityChart);
    }
    setIsChartPaused(!isChartPaused);
  };

  // Prepare combined chart data
  const combinedChartData = {
    labels: temperatureChart.map(data => {
      const date = new Date(data.timeStamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Sử dụng định dạng 24 giờ
      });
    }),
    datasets: [
      {
        label: tempUnit === 'C' ? 'Nhiệt độ (°C)' : 'Nhiệt độ (°F)',
        data: temperatureChart.map(data => {
          console.log('Temperature data:', data); // Debug log
          return tempUnit === 'C' ? data.temperature : data.temperature1;
        }),
        fill: false,
        backgroundColor: '#EEFF00',
        borderColor: '#EEFF00',
        tension: 0.1,
        pointBackgroundColor: '#EEFF00',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        yAxisID: 'y',
        hidden: !tempAxisVisible
      },
      {
        label: 'Độ ẩm (%)',
        data: humidityChart.map(data => data.humidity),
        fill: false,
        backgroundColor: '#41D6FF',
        borderColor: '#41D6FF',
        tension: 0.1,
        pointBackgroundColor: '#41D6FF',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        yAxisID: 'y1',
        hidden: !humidityAxisVisible
      }
    ]
  };

  // Combined chart options
  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        display: tempAxisVisible,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: true,
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
          },
          callback: function (value) {
            return tempUnit === 'C' ? value + '°C' : value + '°F';
          },
          padding: 10,
        },
        title: {
          display: true,
          text: tempUnit === 'C' ? 'Nhiệt độ (°C)' : 'Nhiệt độ (°F)',
          color: '#EEFF00',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        min: function () {
          const temps = temperatureChart.map(data => tempUnit === 'C' ? data.temperature : data.temperature1);
          const min = Math.min(...temps);
          return Math.floor(min - 5);
        },
        max: function () {
          const temps = temperatureChart.map(data => tempUnit === 'C' ? data.temperature : data.temperature1);
          const max = Math.max(...temps);
          return Math.ceil(max + 5);
        }
      },
      y1: {
        type: 'linear',
        display: humidityAxisVisible,
        position: 'right',
        beginAtZero: true,
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
          },
          callback: function (value) {
            return value + '%';
          },
          padding: 10,
        },
        title: {
          display: true,
          text: 'Độ ẩm (%)',
          color: '#41D6FF',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: true,
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
          },
          // maxRotation: 45,
          // minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 8
        },
        title: {
          display: true,
          text: 'Thời gian',
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 40,
          color: '#ffffff',
          font: {
            size: 12,
          },
          usePointStyle: false,
        },
        onClick: (evt, item, legend) => {
          ChartJs.defaults.plugins.legend.onClick(evt, item, legend);
          const index = item.datasetIndex;
          const chart = legend.chart;

          if (index === 0) {
            const isVisible = chart.isDatasetVisible(0);
            setTempAxisVisible(isVisible);
            chart.options.scales.y.display = isVisible;
          } else if (index === 1) {
            const isVisible = chart.isDatasetVisible(1);
            setHumidityAxisVisible(isVisible);
            chart.options.scales.y1.display = isVisible;
          }
          chart.update();
        }
      },
      tooltip: {
        backgroundColor: 'rgba(32, 44, 60, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    elements: {
      line: {
        borderWidth: 3,
      },
      point: {
        hoverRadius: 7,
        radius: 5,
      }
    },
    layout: {
      padding: 20
    },
    backgroundColor: 'white',
  };

  return (
    <div className="weather-app">
      {loading ? (
        <div className="loading-container">
          <ClipLoader color="#66a6ff" size={50} />
          <p>Đang tải dự liệu, chờ trong giây lát...</p>
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <div className="sidebar">
            <div className="weather-info">
              <div className="cloud-bg"><i className="fa-solid fa-cloud-sun cloud-icon" style={{ color: "#ffffff" }}></i></div>
              <div className="cloud-bg"><i className="fa-solid fa-cloud-moon cloud-icon" style={{ color: "#ffffff" }}></i></div>
              <div className="lightbulb-frame">
                <h3>ĐIỀU KHIỂN ĐÈN</h3>
                <div className="lightbulb-control">
                  <div className="cloud-bg"><i className={`fa-solid fa-lightbulb lightbulb-icon ${lightbulbActive ? 'lightbulb-on' : 'lightbulb-off'}`}></i></div>
                  <div className="lightbulb-status">Trạng thái đèn: {lightbulbActive ? 'SÁNG' : 'TẮT'}</div>
                  <div className="lightbulb-buttons">
                    <button
                      className="lightbulb-btn on"
                      onClick={() => updateLightbulbStatus(1)}
                      disabled={lightbulbActive}
                    >
                      TẮT
                    </button>
                    <button
                      className="lightbulb-btn off"
                      onClick={() => updateLightbulbStatus(0)}
                      disabled={!lightbulbActive}
                    >
                      SÁNG
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            <div className="header">
              <div className="date-location">
                <div className="location">
                  <span>Nông trại khoai tây</span>
                </div>
                <div className="date-time">
                  <span>{formatDateVN(currentTime)}</span>
                  <span className="time">{formatTime(currentTime)}</span>
                </div>
              </div>

              <div className="control-buttons">
                <button
                  className={`control-btn ${isChartPaused ? 'resume' : 'pause'}`}
                  onClick={handleChartPauseResume}
                >
                  {isChartPaused ? 'Tiếp tục biểu đồ' : 'Tạm dừng biểu đồ'}
                </button>
                <div className="unit-toggle">
                  <button
                    className={`unit ${tempUnit === 'C' ? 'active' : ''}`}
                    onClick={() => handleUnitChange('C')}
                  >
                    °C
                  </button>
                  <button
                    className={`unit ${tempUnit === 'F' ? 'active' : ''}`}
                    onClick={() => handleUnitChange('F')}
                  >
                    °F
                  </button>
                </div>
              </div>
            </div>

            <div className="highlights">
              <h2 className="section-title">TIÊU ĐIỂM</h2>

              <div className="widgets-grid two-widgets">
                {/* Temperature */}
                <div className="widget">
                  <h3 className="widget-title-temperature">Nhiệt độ</h3>
                  <div className="temperature-meter">
                    <div className="temp-icon"><i className="fa-solid fa-temperature-high temperature-icon"></i></div>
                    {tempUnit === 'C' ? (
                      <div className="temperature-value">{temperature}°C</div>
                    ) : (
                      <div className="temperature-value">{temperature1}°F</div>
                    )}
                    <div className="temperature-desc">Nhiệt độ ngoài trời</div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="widget">
                  <h3 className="widget-title-humidity">Độ ẩm</h3>
                  <div className="humidity-meter">
                    <div className="humidity-icon"><i className="fa-solid fa-cloud-showers-heavy humidity-icon"></i></div>
                    <div className="humidity-value">{humidity}%</div>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${humidity}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Sensor */}
              </div>
            </div>

            <div className="overall">
              <h2 className="section-title">TỔNG QUAN</h2>

              <div className="charts-row">
                <div className="chart-container">
                  <h3>Biểu đồ nhiệt độ & độ ẩm</h3>
                  <div className="chart-wrapper">
                    <Line
                      data={combinedChartData}
                      options={{
                        ...combinedChartOptions,
                        responsive: true,
                        maintainAspectRatio: false,
                        onResize: () => {
                          // Optional: handle resize if needed
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

export default App
