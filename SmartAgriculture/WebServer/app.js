// Import necessary modules for Express, file path operations, and gRPC communication
const express = require('express');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();

// Load gRPC proto definitions for each service
const weatherDefinition = protoLoader.loadSync('../server/protos/weather_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const irrigationDefinition = protoLoader.loadSync('../server/protos/irrigation_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const cropHealthDefinition = protoLoader.loadSync('../server/protos/crop_health_service.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});

// Load the package definitions into gRPC to create clients
const weather_proto = grpc.loadPackageDefinition(weatherDefinition).weather;
const irrigation_proto = grpc.loadPackageDefinition(irrigationDefinition).irrigation;
const crop_health_proto = grpc.loadPackageDefinition(cropHealthDefinition).crop_health;

// Create clients for connecting to the respective gRPC servers
const weatherClient = new weather_proto.WeatherService('localhost:50051', grpc.credentials.createInsecure());
const irrigationClient = new irrigation_proto.IrrigationService('localhost:50051', grpc.credentials.createInsecure());
const cropHealthClient = new crop_health_proto.CropMonitoringService('localhost:50051', grpc.credentials.createInsecure());

// Configure EJS as the view engine and set the directory for views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the home page
app.get('/', (req, res) => {
    // Render the index view
    res.render('index');
});

// Define a route for fetching weather data
app.get('/api/weather', (req, res) => {
    const location = req.query.location;
    // Call the WeatherService to get temperature, humidity, and wind info
    weatherClient.GetTemperature({ location }, (error, temperatureResponse) => {
        if (error) {
            res.status(500).send("Error fetching temperature");
        } else {
            weatherClient.GetHumidity({ location }, (error, humidityResponse) => {
                if (error) {
                    res.status(500).send("Error fetching humidity");
                } else {
                    weatherClient.GetWindInfo({ location }, (error, windResponse) => {
                        if (error) {
                            res.status(500).send("Error fetching wind information");
                        } else {
                            // Send all weather data as JSON response
                            res.json({
                                temperature: temperatureResponse,
                                humidity: humidityResponse,
                                wind: windResponse
                            });
                        }
                    });
                }
            });
        }
    });
});

// Define a route for fetching irrigation data
app.get('/api/irrigation', (req, res) => {
  const location = req.query.location;
  // Call the IrrigationService to start and stop irrigation
  irrigationClient.StartIrrigation({ fieldId: location }, (error, startResponse) => {
      if (error) {
          res.status(500).send("Error starting irrigation");
      } else {
          irrigationClient.StopIrrigation({ fieldId: location }, (error, stopResponse) => {
              if (error) {
                  res.status(500).send("Error stopping irrigation");
              } else {
                  // Send irrigation start and stop responses as JSON
                  res.json({
                      startIrrigation: startResponse,
                      stopIrrigation: stopResponse
                  });
              }
          });
      }
  });
});

// Define a route for fetching crop health data
app.get('/api/crop-health', (req, res) => {
  const location = req.query.location;
  // Call the CropMonitoringService to get crop health and pest detection info
  cropHealthClient.GetCropHealth({ fieldId: location }, (error, cropHealthResponse) => {
      if (error) {
          res.status(500).send("Error fetching crop health");
      } else {
          cropHealthClient.GetPestDetection({ fieldId: location }, (error, pestDetectionResponse) => {
              if (error) {
                  res.status(500).send("Error detecting pests");
              } else {
                  // Send crop health and pest detection data as JSON response
                  res.json({
                      cropHealth: cropHealthResponse,
                      pestDetection: pestDetectionResponse
                  });
              }
          });
      }
  });
});

// Set the port for the Express server
const PORT = 3000;
// Start the server and log the running port
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
