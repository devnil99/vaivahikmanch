# Generated manually for separate shortlist and profile-request actions.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('VMApp', '0012_wishlist_approval_flow'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wish_list',
            name='Status',
            field=models.CharField(
                choices=[
                    ('Shortlisted', 'Shortlisted'),
                    ('Pending', 'Pending'),
                    ('Approved', 'Approved'),
                    ('Rejected', 'Rejected'),
                ],
                default='Shortlisted',
                max_length=12,
            ),
        ),
    ]
