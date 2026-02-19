# Generated migration for adding PENDING status to Borrow model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_borrowlog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='borrow',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending Approval'),
                    ('ACTIVE', 'Active'),
                    ('RETURNED', 'Returned'),
                    ('LATE', 'Late'),
                    ('NOT_RETURNED', 'Not Returned'),
                    ('REJECTED', 'Rejected')
                ],
                default='PENDING',
                max_length=20
            ),
        ),
    ]
