#!/bin/bash
# Run this script ONCE on a fresh VPS to set up the server
set -e

echo "=== Raktdaan.online VPS Setup ==="

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
    echo "Docker installed."
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# Create project directory
mkdir -p /opt/raktdaan
cd /opt/raktdaan

echo "Copy your project files here or clone your repo:"
echo "  git clone https://github.com/YOUR_USER/blood-Donation.git ."
echo ""
echo "Then copy your Backend/.env file with real secrets."
echo ""

# Create SSL cert (HTTP must be reachable first — start with HTTP-only nginx)
echo "=== SSL Certificate Setup ==="
echo "Run this AFTER pointing your domain DNS to this server IP:"
echo ""
echo "  docker run --rm -v /opt/raktdaan/nginx/certbot/www:/var/www/certbot \\"
echo "    -v /opt/raktdaan/nginx/certbot/certs:/etc/letsencrypt \\"
echo "    certbot/certbot certonly --webroot \\"
echo "    --webroot-path=/var/www/certbot \\"
echo "    -d raktdaan.online -d www.raktdaan.online \\"
echo "    --email your@email.com --agree-tos --no-eff-email"
echo ""
echo "Then start all services:"
echo "  docker compose up -d"
