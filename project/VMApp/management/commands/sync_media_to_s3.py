import os
import mimetypes
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
from botocore.exceptions import ClientError


class Command(BaseCommand):
    help = "Upload all local media files from project/media/ to the configured AWS S3 bucket."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate the upload process without actually uploading files to S3.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite files in S3 even if they already exist.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        force = options.get("force", False)

        bucket_name = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or os.getenv("AWS_STORAGE_BUCKET_NAME")
        access_key = getattr(settings, "AWS_ACCESS_KEY_ID", None) or os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", None) or os.getenv("AWS_SECRET_ACCESS_KEY")
        region = getattr(settings, "AWS_S3_REGION_NAME", "ap-south-1") or os.getenv("AWS_S3_REGION_NAME", "ap-south-1")

        if not bucket_name or not access_key or not secret_key:
            self.stderr.write(
                self.style.ERROR(
                    "Error: AWS S3 credentials are missing.\n"
                    "Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_STORAGE_BUCKET_NAME in your project/.env file."
                )
            )
            return

        media_root = Path(settings.BASE_DIR) / "media"
        if not media_root.exists():
            self.stderr.write(self.style.ERROR(f"Local media directory not found at: {media_root}"))
            return

        self.stdout.write(
            self.style.NOTICE(
                f"Connecting to AWS S3 bucket: {bucket_name} (Region: {region})\n"
                f"Source media directory: {media_root}\n"
                f"Dry-run mode: {'YES' if dry_run else 'NO'}"
            )
        )

        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region,
            )
            # Test connection
            s3.head_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f"[OK] Successfully connected to S3 bucket '{bucket_name}'!"))
        except ClientError as e:
            self.stderr.write(self.style.ERROR(f"Failed to connect to S3 bucket: {e}"))
            return

        total_files = 0
        uploaded_files = 0
        skipped_files = 0

        for root, _, files in os.walk(media_root):
            for filename in files:
                total_files += 1
                local_path = Path(root) / filename
                s3_key = str(local_path.relative_to(media_root)).replace("\\", "/")

                content_type, _ = mimetypes.guess_type(str(local_path))
                if not content_type:
                    content_type = "application/octet-stream"

                # Check if file already exists on S3
                already_exists = False
                if not force:
                    try:
                        s3.head_object(Bucket=bucket_name, Key=s3_key)
                        already_exists = True
                    except ClientError:
                        already_exists = False

                if already_exists and not force:
                    skipped_files += 1
                    self.stdout.write(f"  [SKIPPED] {s3_key} (already exists on S3)")
                    continue

                if dry_run:
                    self.stdout.write(f"  [DRY-RUN] Would upload {s3_key} ({content_type})")
                    uploaded_files += 1
                else:
                    try:
                        with open(local_path, "rb") as f:
                            s3.upload_fileobj(
                                f,
                                bucket_name,
                                s3_key,
                                ExtraArgs={
                                    "ContentType": content_type,
                                    "CacheControl": "max-age=86400",
                                },
                            )
                        uploaded_files += 1
                        self.stdout.write(self.style.SUCCESS(f"  [UPLOADED] {s3_key} -> s3://{bucket_name}/{s3_key}"))
                    except Exception as err:
                        self.stderr.write(self.style.ERROR(f"  [FAILED] {s3_key}: {err}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nMigration finished!\n"
                f"  Total scanned: {total_files}\n"
                f"  Uploaded:      {uploaded_files}\n"
                f"  Skipped:       {skipped_files}"
            )
        )

