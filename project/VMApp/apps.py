from django.apps import AppConfig


class VmappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'VMApp'

    def ready(self):
        import VMApp.signals
