# Docker Deployment Fix Instructions

## Overview of Issues and Fixes

We've identified several issues affecting the production environment running in Docker:

1. **Competition overview page errors** - The admin competition overview page is failing when making API requests to endpoints for competitions that don't exist
2. **Favicon showing permanent loading state** - The browser tab icon is stuck in a loading state
3. **Excessive logging** - Server logs are being flooded with routine operation logs

## Fix Files Created

We've created two Node.js scripts to apply these fixes:

1. `production-error-fix.cjs` - Addresses the error handling for competition endpoints
2. `fix-favicon-loading.cjs` - Fixes the favicon loading issue and reduces excessive logging

## Deployment Instructions

### Option 1: Update Dockerfile (Recommended)

1. Add these lines to your Dockerfile before the final CMD instruction:

```dockerfile
# Apply production fixes
COPY production-error-fix.cjs ./
COPY fix-favicon-loading.cjs ./
RUN node production-error-fix.cjs
RUN node fix-favicon-loading.cjs
```

2. Rebuild and redeploy your Docker container

### Option 2: One-time Fix on Render

1. SSH into your Render instance
2. Upload both .cjs files
3. Run:
   ```
   node production-error-fix.cjs
   node fix-favicon-loading.cjs
   ```
4. Restart the application service

### Option 3: Add to render.yaml Build Steps

```yaml
- name: Apply production fixes
  command: |
    node production-error-fix.cjs
    node fix-favicon-loading.cjs
```

## Explanation of Fixes

### Competition Error Handling

The `production-error-fix.cjs` script:
- Adds robust error handling to competition-related API endpoints
- Ensures that when a competition doesn't exist, the API returns a structured response with fallback data
- Prevents UI crashes by always providing valid data structures in error cases

### Favicon Loading Fix

The `fix-favicon-loading.cjs` script:
- Replaces dynamic favicon with a static one to prevent browser loading indicators
- Creates a fallback favicon.ico file if one doesn't exist

### Logging Reduction

The `fix-favicon-loading.cjs` script also:
- Makes routine logging conditional based on environment (development vs production)
- Keeps error and warning logs intact for debugging
- Reduces the verbosity of production logs

## Verification

After applying these fixes:
1. The admin competition overview page should load without errors
2. The browser tab should show a static favicon instead of a loading spinner
3. The server logs should be significantly reduced in volume

If issues persist, please contact support with the server logs after applying these fixes.