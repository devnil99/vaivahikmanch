import os
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

import django
django.setup()

from django.db import connections
from django.conf import settings
from django.core.management import call_command


def main():
    db_config = settings.DATABASES.get("default", {})
    engine = db_config.get("ENGINE", "")
    host = db_config.get("HOST", "")
    name = db_config.get("NAME", "")
    user = db_config.get("USER", "")

    print("=" * 65)
    print("VAIVAHIK MANCH - POSTGRESQL CONNECTIVITY & MIGRATION")
    print("=" * 65)
    print(f"Engine:   {engine}")
    print(f"Database: {name}")
    print(f"User:     {user}")
    print(f"Host:     {host or '[NOT SET - Falling back to SQLite]'}")
    print(f"Port:     {db_config.get('PORT', '')}")
    print("=" * 65)

    if not host or "postgresql" not in engine:
        print("\n[!] DB_HOST is not configured in project/.env.")
        print("Set DB_HOST in project/.env (e.g. 15.206.88.210 or 127.0.0.1)\n")
        return

    print("\n[1/3] Testing PostgreSQL connection...")
    try:
        conn = connections["default"]
        conn.cursor()
        print(" -> SUCCESS: Successfully connected to PostgreSQL database!")
    except Exception as e:
        print(f" -> ERROR: Could not connect to PostgreSQL database.\nDetails: {e}")
        print("\nTroubleshooting Tips:")
        print("1. If running PostgreSQL on EC2 (15.206.88.210):")
        print("   - Ensure PostgreSQL service is active: sudo systemctl status postgresql")
        print("   - In /etc/postgresql/<version>/main/postgresql.conf: listen_addresses = '*'")
        print("   - In /etc/postgresql/<version>/main/pg_hba.conf: add line: host mydb myuser 0.0.0.0/0 md5")
        print("   - Restart service: sudo systemctl restart postgresql")
        print("   - In AWS EC2 Console -> Security Groups -> Inbound Rules: Allow TCP Port 5432")
        print("2. Ensure user 'myuser' exists with password 'mypassword' and has rights on 'mydb'.")
        return

    print("\n[2/3] Running database migrations on PostgreSQL...")
    try:
        call_command("migrate", interactive=False)
        print(" -> SUCCESS: All database tables created successfully!")
    except Exception as e:
        print(f" -> ERROR during migration: {e}")
        return

    print("\n[3/3] Database setup is complete and ready for production!")
    print("=" * 65)


if __name__ == "__main__":
    main()
