// Ensure your apiKey is properly loaded from config.js
async function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const cityData = await fetchWeatherData(lat, lon);
      displayWeather(cityData);
    }, (error) => {
      console.error('Geolocation error:', error);
      document.getElementById("weather").innerText = "Error: " + error.message;
    });
  } else {
    document.getElementById("weather").innerText = "Geolocation is not supported by this browser.";
  }
}

async function fetchWeatherData(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    if (!response.ok) {
      throw new Error('Weather data fetch failed.');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    document.getElementById("weather").innerText = "Error fetching weather data.";
  }
}

async function displayWeather(data) {
  if (!data || !data.coord) {
    document.getElementById("weather").innerText = "Unable to retrieve location weather.";
    return;
  }

  const windSpeedKts = (data.wind.speed * 1.94384).toFixed(1); // Convert m/s to knots
  const visibilityKm = (data.visibility / 1000).toFixed(1); // Convert meters to kilometers
  const pressureHpa = data.main.pressure;

  document.getElementById("weather").innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p>🌡️ Temp: ${data.main.temp} °C</p>
    <p>💨 Wind: ${data.wind.deg}° at ${windSpeedKts} kt</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌫️ Visibility: ${visibilityKm} km</p>
    <p>☁️ Cloud Cover: ${data.clouds.all}%</p>
    <p>📈 Pressure: ${pressureHpa} hPa</p>
  `;
}

// Button click event to fetch weather by airport ICAO code
document.getElementById("fetchWeatherBtn").addEventListener("click", async () => {
  document.getElementById("weather").innerText = "Loading nearest airport data...";
  await fetchWeatherByAirport('VNKT');  // Replace 'VNKT' with any ICAO code you prefer
});

// Fetch the airport coordinates using ICAO code
async function getAirportCoordinates(icaoCode) {
  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${icaoCode}&limit=1&appid=${apiKey}`);
    const data = await response.json();
    if (data.length === 0) {
      throw new Error(`Airport with ICAO code ${icaoCode} not found.`);
    }
    const airport = data[0];
    if (!airport.lat || !airport.lon) {
      throw new Error('Coordinates missing for the airport');
    }
    return { lat: airport.lat, lon: airport.lon, name: airport.name };
  } catch (error) {
    console.error('Error fetching airport coordinates:', error);
    document.getElementById("weather").innerHTML = `
      <p>Airport with ICAO code ${icaoCode} not found. Please check the ICAO code and try again.</p>
      <button id="retryBtn" onclick="retryFetchingWeather()">Retry</button>
    `;
    throw error;  // Rethrow the error to be caught in fetchWeatherByAirport
  }
}

// Retry function for fetching airport weather
function retryFetchingWeather() {
  document.getElementById("weather").innerText = "Retrying to fetch airport data...";
  fetchWeatherByAirport('VNKT');  // Replace with the correct ICAO code
}

// Fetch weather data for the airport using ICAO code
async function fetchWeatherByAirport(icaoCode) {
  try {
    const { lat, lon, name } = await getAirportCoordinates(icaoCode);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) throw new Error("Weather data fetch failed.");
    const data = await response.json();

    const windSpeedKts = (data.wind.speed * 1.94384).toFixed(1); // Convert m/s to knots
    const visibilityKm = (data.visibility / 1000).toFixed(1); // Convert meters to kilometers
    const pressureHpa = data.main.pressure;

    document.getElementById("weather").innerHTML = `
      <h2>${name} (${icaoCode.toUpperCase()})</h2>
      <p>🌡️ Temp: ${data.main.temp} °C</p>
      <p>💨 Wind: ${data.wind.deg}° at ${windSpeedKts} kt</p>
      <p>💧 Humidity: ${data.main.humidity}%</p>
      <p>🌫️ Visibility: ${visibilityKm} km</p>
      <p>☁️ Cloud Cover: ${data.clouds.all}%</p>
      <p>📈 Pressure: ${pressureHpa} hPa</p>
    `;
  } catch (error) {
    console.error('Error fetching weather by airport:', error);
    document.getElementById("weather").textContent = "Failed to fetch weather data.";
  }
}

// Get user location on page load
getUserLocation();
