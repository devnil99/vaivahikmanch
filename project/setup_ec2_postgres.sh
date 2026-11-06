#!/bin/bash
# ==============================================================================
# Vaivahik Manch - EC2 PostgreSQL Automated Setup Script
# Domain: vaivahikmanch.in | EC2 IP: 15.206.88.210
# DB: mydb | User: myuser | Password: mypassword
# ==============================================================================

set -e

echo "================================================================="
echo " Installing and Configuring PostgreSQL on EC2 (15.206.88.210)    "
echo "================================================================="

# 1. Update and install PostgreSQL
echo "[1/5] Installing PostgreSQL..."
sudo apt update -y
sudo apt install -y postgresql postgresql-contrib

# 2. Start and enable service
echo "[2/5] Starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 3. Create Database and User
echo "[3/5] Creating database 'mydb' and user 'myuser'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'mydb'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE mydb;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'myuser'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';"
sudo -u postgres psql -c "ALTER USER myuser WITH ENCRYPTED PASSWORD 'mypassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;"
sudo -u postgres psql -c "ALTER DATABASE mydb OWNER TO myuser;"
sudo -u postgres psql -d mydb -c "GRANT ALL ON SCHEMA public TO myuser;"

# 4. Configure remote listening and authentication
echo "[4/5] Configuring postgresql.conf and pg_hba.conf..."
PG_CONF=$(find /etc/postgresql/ -name "postgresql.conf" 2>/dev/null | head -n 1)
PG_HBA=$(find /etc/postgresql/ -name "pg_hba.conf" 2>/dev/null | head -n 1)

if [ -f "$PG_CONF" ]; then
    echo "Found $PG_CONF - configuring listen_addresses = '*'"
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
    sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
    if ! grep -q "listen_addresses = '*'" "$PG_CONF"; then
        echo "listen_addresses = '*'" | sudo tee -a "$PG_CONF"
    fi
fi

if [ -f "$PG_HBA" ]; then
    echo "Found $PG_HBA - adding remote client authentication"
    if ! grep -q "host.*mydb.*myuser" "$PG_HBA"; then
        echo "host    mydb            myuser          0.0.0.0/0               md5" | sudo tee -a "$PG_HBA"
        echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$PG_HBA"
    fi
fi

# 5. Restart PostgreSQL
echo "[5/5] Restarting PostgreSQL service..."
sudo systemctl restart postgresql

echo "================================================================="
echo " PostgreSQL Setup Complete!                                      "
echo " Database: mydb | User: myuser | Port: 5432                     "
echo " Ensure AWS EC2 Security Group allows Inbound TCP port 5432!    "
echo "================================================================="
