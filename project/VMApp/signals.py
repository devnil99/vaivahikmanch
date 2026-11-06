import os
import logging
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from .models import User_Data, Staff_Data, Service_Data, Success_Story

logger = logging.getLogger(__name__)

# Default placeholder files that should NEVER be deleted from S3 / local disk
PROTECTED_DEFAULTS = {
    'profilepic.jpg',
    'adhar.jpg',
    'pan.jpg',
    'passbook.jpg',
    'service.jpg',
    'success.jpg',
    'plan.jpg',
}

# Image fields mapped per model
MODEL_IMAGE_FIELDS = {
    User_Data: ['Profile_Pic'],
    Staff_Data: ['Profile_Pic', 'Adhar_Image', 'PAN_Image', 'Bank_Passbook_Image'],
    Service_Data: ['Picture'],
    Success_Story: ['Success_Story_Image'],
}


def is_protected_image(file_name):
    """Return True if the file name corresponds to a protected default template."""
    if not file_name:
        return True
    base = os.path.basename(str(file_name)).lower()
    return base in PROTECTED_DEFAULTS


def delete_file_safely(file_field):
    """Safely delete an uploaded file from storage (S3 or local storage)."""
    if not file_field or not getattr(file_field, 'name', None):
        return
    name = str(file_field.name).strip()
    if is_protected_image(name):
        return
    try:
        storage = file_field.storage
        if storage and storage.exists(name):
            storage.delete(name)
            logger.info("Deleted replaced/orphaned image from storage: %s", name)
    except Exception as e:
        logger.warning("Could not delete old image '%s' from storage: %s", name, e)


def register_image_cleanup_signals():
    """Register pre_save and post_delete hooks for models with image fields."""
    for model_cls in MODEL_IMAGE_FIELDS.keys():
        @receiver(pre_save, sender=model_cls, weak=False)
        def auto_delete_old_image_on_update(sender, instance, **kwargs):
            if not instance.pk:
                return  # New instance creation, no old file to delete

            try:
                old_instance = sender.objects.get(pk=instance.pk)
            except sender.DoesNotExist:
                return

            fields = MODEL_IMAGE_FIELDS.get(sender, [])
            for field_name in fields:
                old_file = getattr(old_instance, field_name, None)
                new_file = getattr(instance, field_name, None)

                old_name = getattr(old_file, 'name', '') or ''
                new_name = getattr(new_file, 'name', '') or ''

                # If the image was changed or replaced, delete the old file from S3
                if old_name and old_name != new_name:
                    delete_file_safely(old_file)

        @receiver(post_delete, sender=model_cls, weak=False)
        def auto_delete_image_on_delete(sender, instance, **kwargs):
            fields = MODEL_IMAGE_FIELDS.get(sender, [])
            for field_name in fields:
                img_file = getattr(instance, field_name, None)
                if img_file and getattr(img_file, 'name', ''):
                    delete_file_safely(img_file)


# Register signal handlers on module load
register_image_cleanup_signals()

