# Netlify Serverless Function - Deployment Guide

## Overview

This guide covers how to deploy the MongoDB serverless function to Netlify and test the API endpoints.

## Prerequisites

- A Netlify account
- A MongoDB Atlas cluster (already configured)
- Node.js 20 or higher

## Step 1: Configure netlify.toml

The `netlify.toml` file has been created in the project root with the following configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"

[build.environment]
  node_version = "20"
```

## Step 2: Set Up Environment Variables

**Important:** The connection string is already configured to use the direct replica set format for better compatibility:

```
MONGODB_URI=mongodb://Boniface:nb9ms2AYs7mBH.N@ac-vqlqxji-shard-00-00.szukiim.mongodb.net:27017,ac-vqlqxji-shard-00-01.szukiim.mongodb.net:27017,ac-vqlqxji-shard-00-02.szukiim.mongodb.net:27017/githirioni-shg?authSource=admin&tls=true&replicaSet=atlas-shard-0&retryWrites=true&retryReads=true
```

Or you can use the SRV format:
```
mongodb+srv://Boniface:nb9ms2AYs7mBH.N@cluster0.szukiim.mongodb.net/?appName=Cluster0
```

### Option A: Via Netlify Dashboard

1. Log in to [Netlify](https://app.netlify.com)
2. Select your site or create a new one
3. Go to **Site settings** → **Environment Variables**
4. Add a new variable:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://Boniface:nb9ms2AYs7mBH.N@cluster0.szukiim.mongodb.net/?appName=Cluster0`

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variable
netlify env:set MONGODB_URI "mongodb+srv://Boniface:nb9ms2AYs7mBH.N@cluster0.szukiim.mongodb.net/?appName=Cluster0"
```

## Step 3: Deploy to Netlify

### Option A: Via Git (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` and deploy

### Option B: Via Netlify CLI

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Step 4: Test the Endpoints

### Get All Records (GET /records)

```bash
curl -X GET https://your-site-name.netlify.app/.netlify/functions/records
```

### Create a Record (POST /records)

```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/records \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "amount": 100}'
```

### Test Locally Using Netlify CLI

```bash
# Start local development server
netlify dev

# The function will be available at
# http://localhost:8888/.netlify/functions/records

# Test GET
curl http://localhost:8888/.netlify/functions/records

# Test POST
curl -X POST http://localhost:8888/.netlify/functions/records \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "amount": 50}'
```

### Using Postman

1. Create a new request
2. For GET: Enter `https://your-site.netlify.app/.netlify/functions/records`
3. For POST: Enter the same URL, set method to POST, add JSON body
4. Send the request

## Error Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Records fetched |
| 201 | Success - Record created |
| 400 | Bad Request - Invalid JSON or body |
| 404 | Not Found - Unknown route |
| 500 | Server Error - Database error |

## Security Notes

1. **Never commit the connection string** to version control - it's already set up to use environment variables
2. **Restrict access** in production by adding authentication
3. **Use Netlify's role-based redirects** if you need to hide the function path
4. **Monitor usage** via Netlify dashboard to avoid unexpected costs

## Troubleshooting

### Connection Issues

If you see connection errors:
- Verify the MongoDB Atlas cluster is running
- Check that your IP is whitelisted in Atlas (Network Access)
- Ensure the `MONGODB_URI` environment variable is set correctly

### Cold Starts

The first request after inactivity may take longer as the function initializes. Subsequent requests will be faster due to connection pooling.

### Rate Limits

MongoDB Atlas has connection limits based on your tier. The function is configured with a connection pool of 10 to stay within limits.