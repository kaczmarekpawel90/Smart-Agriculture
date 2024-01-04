// Event listener to trigger loadData function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Add an event listener to the farmSelect element to handle changes
    document.getElementById('farmSelect').addEventListener('change', loadData);
});

// Function to load data based on the selected farm location
function loadData() {
    // Retrieve the selected location from the dropdown
    const location = document.getElementById('farmSelect').value;
    // Alert and return if no location is selected
    if (!location) {
        alert('Please select a farm');
        return;
    }

    // Fetch and display data for the selected location
    fetchWeatherData(location);
    fetchIrrigationData(location);
    fetchCropHealthData(location);
}

// Function to fetch and display weather data for a given location
function fetchWeatherData(location) {
    // Make a GET request to the weather API endpoint
    fetch(`/api/weather?location=${location}`)
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            // Find the weather data container and update its HTML content
            const weatherContainer = document.getElementById('weatherData');
            weatherContainer.innerHTML = `
                <h3>Weather Data</h3>
                <p>Temperature: ${data.temperature.temperature}°C, Trend: ${data.temperature.trend}</p>
                <p>Humidity: ${data.humidity.humidityLevel}%</p>
                <p>Wind Speed: ${data.wind.windSpeed} km/h, Direction: ${data.wind.windDirection}</p>
            `;
        })
        .catch(error => console.error('Error fetching weather data:', error)); // Log errors to the console
}

// Function to fetch and display irrigation data for a given location
function fetchIrrigationData(location) {
    // Make a GET request to the irrigation API endpoint
    fetch(`/api/irrigation?location=${location}`)
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            // Find the elements for displaying irrigation data
            const irrigationStart = document.getElementById('irrigationStart');
            const irrigationDetails = document.getElementById('irrigationDetails');
            const irrigationStop = document.getElementById('irrigationStop');

            // Update the content of the elements with the fetched data
            irrigationStart.textContent = 'Irrigation started.';
            irrigationDetails.innerHTML = `
                Location: ${location}<br>
                Current Soil Moisture: ${extractMoisture(data.startIrrigation.message)}%<br>
                Scheduled Irrigation Time: 6 AM - Current Time: 8 PM.<br>
                ${getContinuationReason(data.startIrrigation.message)}`;
            irrigationStop.textContent = data.stopIrrigation.message;
        })
        .catch(error => console.error('Error fetching irrigation data:', error)); // Log errors to the console
}

// Function to extract soil moisture value from a message string
function extractMoisture(message) {
    const match = message.match(/Current Soil Moisture: (\d+)%/);
    return match ? match[1] : 'N/A';
}

// Function to determine the continuation reason from a message string
function getContinuationReason(message) {
    if (message.includes('Continuing')) {
        return 'Continuing due to low soil moisture or scheduled time.';
    } else {
        return 'Irrigation may not be necessary at this time.';
    }
}

// Function to format irrigation details for display
function formatIrrigationDetails(message) {
    // Extract soil moisture and determine continuation reason
    const soilMoistureMatch = message.match(/Current Soil Moisture: (\d+)%/);
    const soilMoisture = soilMoistureMatch ? soilMoistureMatch[1] : 'N/A';
    const continuationReason = message.includes('Continuing') ? 'Continuing due to low soil moisture or scheduled time.' : 'Irrigation may not be necessary at this time.';

    // Format and return the details string
    return `Location: Farm3\nCurrent Soil Moisture: ${soilMoisture}%\nScheduled Irrigation Time: 6 AM - Current Time: 8 PM. ${continuationReason}`;
}

// Function to fetch and display crop health data for a given location
function fetchCropHealthData(location) {
    // Make a GET request to the crop health API endpoint
    fetch(`/api/crop-health?location=${location}`)
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            // Find the crop health data container and update its HTML content
            const cropHealthContainer = document.getElementById('cropHealthData');
            cropHealthContainer.innerHTML = `
                <h3>Crop Health Data</h3>
                <p>Crop Health: ${data.cropHealth.healthStatus}, Recommendation: ${data.cropHealth.recommendation}</p>
                <p>Pest Detection: ${data.pestDetection.pestsDetected ? 'Detected' : 'None'}, Pest Type: ${data.pestDetection.pestType}</p>
            `;
        })
        .catch(error => console.error('Error fetching crop health data:', error)); // Log errors to the console
}
