#!/bin/bash

# Script to generate DH parameters for improved SSL/TLS security
# This is a one-time operation that generates parameters for forward secrecy

# Create directory if it doesn't exist
mkdir -p /etc/nginx/ssl

# Generate DH parameters (2048 bits)
echo "Generating DH parameters (2048 bits) - this may take a few minutes..."
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

# Set proper permissions
chmod 644 /etc/nginx/ssl/dhparam.pem

echo "DH parameters generated successfully at /etc/nginx/ssl/dhparam.pem"
echo "This file is used by Nginx for improved SSL/TLS security with forward secrecy." 