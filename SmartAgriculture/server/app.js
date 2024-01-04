// Import gRPC and proto-loader modules for gRPC service implementation
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto files
const weatherDefinition = protoLoader.loadSync('protos/weather_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const irrigationDefinition = protoLoader.loadSync('protos/irrigation_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const cropHealthDefinition = protoLoader.loadSync('protos/crop_health_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});

// Load the package definitions into gRPC
const weather_proto = grpc.loadPackageDefinition(weatherDefinition).weather;
const irrigation_proto = grpc.loadPackageDefinition(irrigationDefinition).irrigation;
const crop_health_proto = grpc.loadPackageDefinition(cropHealthDefinition).crop_health;

//Weather Monitoring Service functions
//getTemperature: Returns temperature data for a given location
const getTemperature = (call, callback) => {
    const location = call.request.location.toUpperCase();
    const temperatures = { DUBLIN: 15, CORK: 10, WICKLOW: 20 };
    const temperature = Math.round(temperatures[location] + Math.random() * 10);
    const trend = temperature > 22 ? 'rising' : 'falling';
    callback(null, { temperature, trend });
};

// getHumidity: Returns humidity data for a given location
const getHumidity = (call, callback) => {
    const location = call.request.location.toUpperCase();
    const humidityLevels = { DUBLIN: 40, CORK: 50, WICKLOW: 60 };
    const humidityLevel = Math.round(humidityLevels[location] + Math.random() * 40);
    callback(null, { humidityLevel });
};

// getWindInfo: Returns wind information for a given location
const getWindInfo = (call, callback) => {
    const location = call.request.location.toUpperCase();
    const windSpeeds = { DUBLIN: 5, CORK: 7, WICKLOW: 6 };
    const windSpeed = Math.round(windSpeeds[location] + Math.random() * 5);
    const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDirection = windDirections[Math.floor(Math.random() * windDirections.length)];
    callback(null, { windSpeed, windDirection });
};

//Streams weather updates to the client
const streamWeatherUpdates = (call) => {
    const weatherUpdates = [
        { temperature: 22, trend: 'rising' },
        { temperature: 23, trend: 'rising' },
        { temperature: 21, trend: 'falling' }
    ];

    weatherUpdates.forEach(update => {
        call.write(update);
    });

    call.end();
};

//Simulated environment variables
const soilMoistureThreshold = 30; 
const scheduledIrrigationHour = 6;

//Converts an hour to a human-readable format (e.g., "6 AM")
const formatHour = (hour) => {
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
};

//Irrigation Control Service functions
//Initiates irrigation based on soil moisture and time conditions
const startIrrigation = (call, callback) => {
    const currentSoilMoisture = Math.random() * 100;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const location = call.request.fieldId;

    const moistureThresholds = { Dublin: 30, Cork: 35, Wicklow: 40 };
    const soilMoistureThreshold = moistureThresholds[location] || 30;

    let additionalInfo = `Location: ${location}, Current Soil Moisture: ${currentSoilMoisture.toFixed(0)}%, ` +
                         `Scheduled Irrigation Time: ${formatHour(scheduledIrrigationHour)}, ` +
                         `Current Time: ${formatHour(currentHour)}.`;

    let message = 'Irrigation started. ' + additionalInfo;

    if (currentSoilMoisture < soilMoistureThreshold || currentHour === scheduledIrrigationHour) {
        message += ' Continuing due to low soil moisture or scheduled time.';
    } else {
        message += ' Irrigation may not be necessary at this time.';
    }

    callback(null, { success: true, message: message });
};

//stopIrrigation: Stops the irrigation process for a given location
const stopIrrigation = (call, callback) => {
    const location = call.request.fieldId;
    const message = `Irrigation stopped at ${location}.`;
    callback(null, { success: true, message });
};

//receiveSensorData: Handles incoming sensor data stream
const receiveSensorData = (call, callback) => {
    let dataPoints = 0;
    let location = "";

    call.on('data', (data) => {
        console.log('Received sensor data:', data);
        dataPoints++;
        location = data.fieldId;
    });

    call.on('end', () => {
        const message = `Received ${dataPoints} data points for ${location}.`;
        callback(null, { success: true, message });
    });
};

//Crop Monitoring Service functions
//getCropHealth: Assesses and returns the health status of crops
const getCropHealth = (call, callback) => {
    const healthOptions = ['Good', 'Fair', 'Poor'];
    const healthStatus = healthOptions[Math.floor(Math.random() * healthOptions.length)];
    
    const recommendation = healthStatus === 'Poor' ? 'Inspect for pests or diseases' : 'No action needed';
    callback(null, { healthStatus: `Health at ${call.request.fieldId}: ${healthStatus}`, recommendation });
};

//getPestDetection: Detects and reports pest activity
const getPestDetection = (call, callback) => {
    const pestsDetected = Math.random() > 0.5;
    const pestType = pestsDetected ? 'Aphids' : 'None';
    const recommendation = pestsDetected ? 'Apply organic pesticides' : 'No action needed';
    callback(null, { pestsDetected, pestType: `Pest at ${call.request.fieldId}: ${pestType}`, recommendation });
};

//monitorCropHealthBidirectional: Monitors crop health with bidirectional streaming
const monitorCropHealthBidirectional = (call) => {
    call.on('data', (data) => {
        console.log('Received crop health data:', data);
        
        call.write({ healthStatus: 'Good', recommendation: 'Maintain current care' });
    });
    call.on('end', () => {
        call.end();
    });
};

//Create and start the gRPC server, adding the defined services
const server = new grpc.Server();
server.addService(weather_proto.WeatherService.service, {
    GetTemperature: getTemperature,
    GetHumidity: getHumidity,
    GetWindInfo: getWindInfo,
    StreamWeatherUpdates: streamWeatherUpdates
});
server.addService(irrigation_proto.IrrigationService.service, {
    StartIrrigation: startIrrigation,
    StopIrrigation: stopIrrigation,
    ReceiveSensorData: receiveSensorData
});
server.addService(crop_health_proto.CropMonitoringService.service, {
    GetCropHealth: getCropHealth,
    GetPestDetection: getPestDetection,
    MonitorCropHealthBidirectional: monitorCropHealthBidirectional
});

//Bind the server to a port and start listening for requests
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log('Smart Agriculture Server running on port 50051');
});
