// Import necessary modules for gRPC and reading from the command line
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');

// Load proto definitions for each service
const weatherDefinition = protoLoader.loadSync('protos/weather_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const irrigationDefinition = protoLoader.loadSync('protos/irrigation_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const cropHealthDefinition = protoLoader.loadSync('protos/crop_health_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});

// Load the package definitions into gRPC (This makes the services and their methods available for use)
const weather_proto = grpc.loadPackageDefinition(weatherDefinition).weather;
const irrigation_proto = grpc.loadPackageDefinition(irrigationDefinition).irrigation;
const crop_health_proto = grpc.loadPackageDefinition(cropHealthDefinition).crop_health;

// Create a Readline interface for interactive command line input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main function to start the client-side application
function main() {
    // Prompt the user to enter a farm location
    rl.question('Enter farm location (Dublin, Cork, Wicklow): ', (location) => {
        // Create clients for each gRPC service
        const weatherClient = new weather_proto.WeatherService('localhost:50051', grpc.credentials.createInsecure());
        const irrigationClient = new irrigation_proto.IrrigationService('localhost:50051', grpc.credentials.createInsecure());
        const cropHealthClient = new crop_health_proto.CropMonitoringService('localhost:50051', grpc.credentials.createInsecure());

        // Call Weather Monitoring Service
        makeWeatherServiceCalls(weatherClient, location);

        // Call Irrigation Control Service
        makeIrrigationServiceCalls(irrigationClient, location);

        // Call Crop Monitoring Service
        makeCropMonitoringServiceCalls(cropHealthClient, location);

        // Close the Readline interface
        rl.close();
    });
}

// Function to make calls to Weather Monitoring Service
function makeWeatherServiceCalls(client, location) {
    // Request temperature information and log the response
    client.GetTemperature({ location: location.toUpperCase() }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Temperature at ${location}: ${response.temperature}°C, Trend: ${response.trend}`);
    });

    // Request humidity information and log the response
    client.GetHumidity({ location: location.toUpperCase() }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Humidity at ${location}: ${response.humidityLevel}%`);
    });

    // Request wind information and log the response
    client.GetWindInfo({ location: location.toUpperCase() }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Wind at ${location}: Speed ${response.windSpeed} km/h, Direction ${response.windDirection}`);
    });
}

// Function to make calls to Irrigation Control Service
function makeIrrigationServiceCalls(client, location) {
    // Start irrigation at the given location and log the response
    client.StartIrrigation({ fieldId: location, duration: 30 }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Start Irrigation at ${location}: ${response.message}`);
    });

    // Stop irrigation at the given location and log the response
    client.StopIrrigation({ fieldId: location }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Stop Irrigation at ${location}: ${response.message}`);
    });
}

// Function to make calls to Crop Monitoring Service
function makeCropMonitoringServiceCalls(client, location) {
    // Request crop health information and log the response
    client.GetCropHealth({ fieldId: location }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Crop Health at ${location}: Status ${response.healthStatus}, Recommendation: ${response.recommendation}`);
    });

    // Request pest detection information and log the response
    client.GetPestDetection({ fieldId: location }, (error, response) => {
        if (error) console.error(error);
        else console.log(`Pest Detection at ${location}: Detected ${response.pestsDetected}, Pest Type: ${response.pestType}, Recommendation: ${response.recommendation}`);
    });
}

main();
