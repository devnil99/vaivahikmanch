# Generated manually for the partner-approval wishlist flow.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('VMApp', '0011_delete_emailotp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wish_list',
            name='Status',
            field=models.CharField(
                choices=[
                    ('Pending', 'Pending'),
                    ('Approved', 'Approved'),
                    ('Rejected', 'Rejected'),
                ],
                default='Pending',
                max_length=10,
            ),
        ),
        migrations.AddConstraint(
            model_name='wish_list',
            constraint=models.UniqueConstraint(
                fields=('User_id', 'Wish_User_id'),
                name='unique_wishlist_pair',
            ),
        ),
    ]
