# Deployment Guide

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd sitracking-stunting
```

2. **Environment Setup**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend environment
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > frontend/.env.local
```

3. **Run with Docker Compose**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Production Deployment

### 1. Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Setup
```bash
# Clone and setup
git clone <repository-url> sitracking-stunting
cd sitracking-stunting

# Create production environment
cp docker-compose/.env.example docker-compose/.env
# Edit docker-compose/.env with production settings

# Create data directory
mkdir -p data
chmod 755 data
```

### 3. SSL Certificate (Optional but Recommended)
```bash
# Using Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx for SSL
# Update docker-compose/nginx/conf.d/default.conf with SSL settings
```

### 4. Start Production Services
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## Environment Variables

### Backend (.env)
```bash
APP_ENV=production
FILE_STORE=/app/data
MAX_UPLOAD_MB=10
DEFAULT_GENDER=L
DATABASE_URL=sqlite:///./data/sitracking.db
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
NODE_ENV=production
```

## Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/

# Nginx health
docker-compose exec nginx curl http://localhost/
```

### Log Management
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Log rotation (add to crontab)
0 2 * * * docker system prune -f
```

## Backup Strategy

### Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker cp sitracking-backend:/app/data/sitracking.db ./backup/sitracking_$DATE.db
gzip ./backup/sitracking_$DATE.db
EOF

chmod +x backup.sh
```

### File Backup
```bash
# Backup data directory
tar -czf data_backup_$(date +%Y%m%d).tar.gz data/
```

## Scaling

### Horizontal Scaling
```yaml
# Update docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3

  frontend:
    deploy:
      replicas: 2
```

### Load Balancing
```nginx
# nginx.conf upstream
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## Security

### Firewall Setup
```bash
# UFW configuration
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Security Headers
The application includes security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

## Troubleshooting

### Common Issues

1. **Permission Denied**
```bash
# Fix data directory permissions
sudo chown -R 1000:1000 data/
chmod -R 755 data/
```

2. **Port Conflicts**
```bash
# Check port usage
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
```

3. **Memory Issues**
```bash
# Check container resource usage
docker stats
```

4. **Database Issues**
```bash
# Recreate database
docker-compose down
rm -f data/sitracking.db
docker-compose up -d
```

## Performance Optimization

### Docker Optimization
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Caching
```nginx
# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Maintenance

### Regular Tasks
```bash
# Weekly cleanup
docker system prune -f

# Monthly image updates
docker-compose pull
docker-compose up -d
```

### Log Rotation
```bash
# Add to /etc/logrotate.d/docker-compose
/path/to/sitracking-stunting/docker-compose.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```