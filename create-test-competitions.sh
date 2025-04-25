#!/bin/bash

echo "Creating test competitions in the Replit development environment..."

# Get the hostname of the current Replit instance
HOSTNAME=$(hostname -f)
API_URL="https://${HOSTNAME}/api/admin/dev-create-test-competitions"

# Use hardcoded session ID since we know it
COOKIE="connect.sid=9fuM1a0pfgLqCInJWEH9wIBnelbE_cv3"

echo "Using API URL: $API_URL"
echo "Using cookie: $COOKIE"

# Make the API request with the session cookie
curl -X POST "$API_URL" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v

echo ""
echo "Done! Check the response above to see if it was successful."
echo "If successful, you should see the competitions at https://${HOSTNAME}/"