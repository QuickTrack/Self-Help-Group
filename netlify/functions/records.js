/**
 * Netlify Serverless Function - Records API
 * 
 * This function provides REST API endpoints for CRUD operations on a MongoDB collection.
 * It connects to a MongoDB Atlas cluster and manages the 'records' collection in the
 * 'githirioni-shg' database.
 * 
 * Endpoints:
 *   GET  /records - Fetch all documents from the collection
 *   POST /records - Insert a new document into the collection
 */

// Import the MongoDB driver - using native mongodb driver for better performance
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB Atlas connection string - MUST be set as Netlify environment variable
// Set MONGODB_URI in Netlify dashboard: Site settings → Environment
const MONGODB_URI = process.env.MONGODB_URI;

// Database name
const DB_NAME = 'githirioni-shg';

// Collection name
const COLLECTION_NAME = 'records';

/**
 * MongoDB Client Singleton
 * 
 * This pattern reuses the MongoDB client across function invocations,
 * avoiding the overhead of establishing a new connection for each request.
 * 
 * The client is stored in a global variable to persist across warm invocations.
 */
let cachedClient = null;

/**
 * Get or create MongoDB client connection
 * 
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
async function getMongoClient() {
  // If we already have a connected client, return it
  if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) {
    return cachedClient;
  }

  // Create new MongoClient with connection options optimized for serverless
  const client = new MongoClient(MONGODB_URI, {
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 0,
    // Timeouts
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // Retry settings
    retryWrites: true,
    retryReads: true,
  });

  // Connect to MongoDB Atlas cluster
  await client.connect();
  
  // Cache the client for reuse
  cachedClient = client;
  
  console.log('MongoDB Atlas connection established');
  return client;
}

/**
 * Get database and collection references
 * 
 * @returns {Promise<Collection>} MongoDB collection
 */
async function getCollection() {
  const client = await getMongoClient();
  const db = client.db(DB_NAME);
  return db.collection(COLLECTION_NAME);
}

/**
 * JSON Response Helper
 * 
 * Creates a properly formatted JSON response for Netlify Functions
 * 
 * @param {Object} data - Data to send as JSON
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Netlify function response object
 */
function jsonResponse(data, statusCode) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Allow cross-origin requests if needed
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data),
  };
}

/**
 * GET /records - Fetch all documents
 * 
 * Retrieves all documents from the 'records' collection and returns them
 * as a JSON array with a 200 status code.
 * 
 * @returns {Object} JSON response with documents or error
 */
async function handleGetRecords() {
  try {
    // Get the collection
    const collection = await getCollection();
    
    // Fetch all documents from the collection
    // Using empty filter {} to match all documents
    const documents = await collection.find({}).toArray();
    
    console.log(`Retrieved ${documents.length} records`);
    
    // Return documents with 200 OK status
    return jsonResponse(documents, 200);
    
  } catch (error) {
    console.error('Error fetching records:', error);
    
    // Return 500 Internal Server Error for database errors
    return jsonResponse({
      error: 'Failed to fetch records',
      message: error.message
    }, 500);
  }
}

/**
 * POST /records - Insert a new document
 * 
 * Accepts a JSON body containing arbitrary fields, inserts it into the
 * 'records' collection, and returns the inserted document (including
 * the generated '_id') with a 201 status code.
 * 
 * @param {Object} body - Parsed JSON body from the request
 * @returns {Object} JSON response with inserted document or error
 */
async function handlePostRecords(body) {
  try {
    // Validate that body exists and is an object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({
        error: 'Invalid request body',
        message: 'Body must be a JSON object'
      }, 400);
    }

    // Get the collection
    const collection = await getCollection();
    
    // Add timestamps for tracking
    const document = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the document into the collection
    // The insertOne method generates a unique _id automatically
    const result = await collection.insertOne(document);
    
    // Retrieve the inserted document with the generated _id
    // We need to fetch it because insertOne doesn't return the full document
    const insertedDocument = await collection.findOne({ _id: result.insertedId });
    
    console.log(`Inserted document with _id: ${result.insertedId}`);
    
    // Return the inserted document with 201 Created status
    return jsonResponse(insertedDocument, 201);
    
  } catch (error) {
    console.error('Error inserting record:', error);
    
    // Return 500 Internal Server Error for database errors
    return jsonResponse({
      error: 'Failed to insert record',
      message: error.message
    }, 500);
  }
}

/**
 * Main Handler Function
 * 
 * This is the entry point for Netlify Functions. It handles routing
 * based on the HTTP method and returns appropriate responses.
 * 
 * @param {Object} event - Netlify function event object
 * @returns {Object} HTTP response
 */
exports.handler = async function handler(event, context) {
  // Set connection strategy to reuse connections in warm starts
  context.callbackWaitsForEmptyEventLoop = false;

  // Extract HTTP method and path from the event
  const { httpMethod, body, path } = event;

  // Handle CORS preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Route the request based on HTTP method
  try {
    // GET /records - Fetch all records
    if (httpMethod === 'GET' && path === '/records') {
      return await handleGetRecords();
    }

    // POST /records - Create a new record
    if (httpMethod === 'POST' && path === '/records') {
      // Parse the JSON body
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch (parseError) {
        return jsonResponse({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }, 400);
      }
      
      return await handlePostRecords(parsedBody);
    }

    // Handle unknown routes
    return jsonResponse({
      error: 'Not Found',
      message: `Route ${path} with method ${httpMethod} not supported`
    }, 404);

  } catch (error) {
    console.error('Unhandled error:', error);
    
    // Catch-all error handling
    return jsonResponse({
      error: 'Internal Server Error',
      message: error.message
    }, 500);
  }
};