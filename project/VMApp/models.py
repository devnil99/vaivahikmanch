# # models.py
# from django.contrib.auth.models import AbstractUser
# from django.db import models
# from .utils import *
# from django.utils import timezone
# from datetime import timedelta

# # User Abstract user
# class User(AbstractUser):
#     id = models.CharField(primary_key=True, max_length=22, default=secure_short_uuid, editable=False)
#     Amount = models.IntegerField(null=True, blank=True, default=0)
#     Reference_Code = models.IntegerField(default=generate_random_number)
#     Role = models.CharField(max_length=20, choices=[
#         ('superadmin', 'SuperAdmin'),
#         ('admin', 'Admin'),
#         ('staff', 'Staff'),
#         ('service', 'Service'),
#         ('user', 'User'),        
#     ], default='user')
#     Refered_By = models.IntegerField(null=True,blank=True,default=000000)


#     # def __str__(self):
#     #     return self.username

# # UserData roles based all details fetch 
# class User_Data(models.Model):
#     User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Full_Name = models.CharField(max_length=20,null=True,blank=True)
#     Profile_Pic = models.ImageField(upload_to='User_Pic',default='User_Pic/profilepic.jpg',blank=True,null=True)
#     Caste = models.CharField(max_length=20,blank=True)
#     Religion = models.CharField(max_length=20,null=True,blank=True)
#     Gender = models.CharField(max_length=10,null=True,blank=True)
#     DOB = models.CharField(max_length=10,null=True,blank=True)
#     Age = models.IntegerField(null=True,blank=True)
#     WP_Contact = models.CharField(max_length=10,null=True,blank=True)
#     Wp_Contact_Name = models.CharField(max_length=100,null=True,blank=True)
#     Alt_Contact = models.CharField(max_length=10,null=True,blank=True)
#     Alt_Contact_Name = models.CharField(max_length=100,null=True,blank=True)
#     Full_Address = models.CharField(max_length=400,null=True,blank=True)
#     Email = models.EmailField(null=True,blank=True)
#     District = models.CharField(max_length=20,blank=True)
#     Nearestdist = models.JSONField(default=list,blank=True,null=True)
#     State = models.CharField(max_length=20,blank=True)
#     City = models.CharField(max_length=20,blank=True)
#     Country = models.CharField(max_length=20,blank=True,default='India')
#     Accept_Profiles = models.JSONField(default=list,blank=True,null=True)
#     Marrige_status = models.CharField(max_length=10,null=True,blank=True)
#     Qualification = models.CharField(max_length=30,null=True,blank=True)
#     Profession = models.CharField(max_length=20,null=True,blank=True)
#     Job_type = models.CharField(max_length=30,null=True,blank=True)
#     Salary = models.IntegerField(null=True,blank=True)
#     Disability = models.BooleanField(default=False,null=True,blank=True)
#     Vegeterian = models.CharField(max_length=20,null=True,blank=True,choices=[('Vegeterian','Vegeterian'),('Non-Vegeterian','Non-Vegeterian'),('Both','Both')])
#     Father_name = models.CharField(max_length=30,null=True,blank=True)
#     Father_Age = models.IntegerField(null=True,blank=True)
#     Father_Profession = models.CharField(max_length=30,null=True,blank=True)
#     Mother_name = models.CharField(max_length=30,null=True,blank=True)
#     Mother_Age = models.IntegerField(null=True,blank=True)
#     Mother_Profession = models.CharField(max_length=30,null=True,blank=True)
#     House = models.CharField(max_length=20,null=True,blank=True,choices=[('Self','Self'),('Rental','Rental')])
#     Brothers = models.CharField(max_length=3,null=True,blank=True,choices=[('1','1'),('2','2'),('3','3'),('4','4'),('5','5'),('6','6'),('7','7'),('8','8'),('9','9'),('10','10')])
#     Brothers_marrige = models.CharField(max_length=3,null=True,blank=True,choices=[('1','1'),('2','2'),('3','3'),('4','4'),('5','5'),('6','6'),('7','7'),('8','8'),('9','9'),('10','10')])
#     Sisters = models.CharField(max_length=3,null=True,blank=True,choices=[('1','1'),('2','2'),('3','3'),('4','4'),('5','5'),('6','6'),('7','7'),('8','8'),('9','9'),('10','10')])
#     Sisters_marrige = models.CharField(max_length=3,null=True,blank=True,choices=[('1','1'),('2','2'),('3','3'),('4','4'),('5','5'),('6','6'),('7','7'),('8','8'),('9','9'),('10','10')])
#     Mother_tongue = models.CharField(max_length=100,null=True,blank=True)
#     Height = models.DecimalField(max_digits=5, decimal_places=2,null=True,blank=True)
#     Weight = models.DecimalField(max_digits=5, decimal_places=2,null=True,blank=True)
#     Refer = models.IntegerField(null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Valid_Upto = models.DateField(null=True,blank=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class User_Transactions(models.Model):
#     User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Plan = models.CharField(max_length=30,null=True,blank=True)
#     Amount = models.IntegerField()
#     status = models.CharField(max_length=8,default='Pending')
#     Create_date = models.DateField(auto_now=True)


# class Wish_List(models.Model):
#     User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True,related_name='User_id')
#     Wish_User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True,related_name='Wish_User_id')
#     Status = models.CharField(max_length=10,null=True,blank=True,default='Pending')
#     Create_date = models.DateField(auto_now=True)


# class Staff_Data(models.Model):
#     Staff_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Full_Name = models.CharField(max_length=30,null=True,blank=True)
#     Profile_Pic = models.ImageField(upload_to='Staff_Pic',default='Staff_Pic/profilepic.jpg',blank=True,null=True)
#     WP_Contact = models.CharField(max_length=10,null=True,blank=True)
#     Age = models.IntegerField(null=True,blank=True)
#     Full_Address = models.CharField(max_length=400,null=True,blank=True)
#     District = models.CharField(max_length=20,blank=True)
#     State = models.CharField(max_length=20,blank=True)
#     City = models.CharField(max_length=20,blank=True)
#     Country = models.CharField(max_length=20,blank=True,default='India')
#     Email = models.EmailField(null=True,blank=True)
#     Adhar_Number = models.CharField(max_length=12,null=True,blank=True)
#     Adhar_Image = models.ImageField(upload_to='Staff_Adhar',default='Staff_Adhar/adhar.jpg',blank=True,null=True)
#     PAN_Number = models.CharField(max_length=10,null=True,blank=True)
#     PAN_Image = models.ImageField(upload_to='Staff_PAN',default='Staff_PAN/pan.jpg',blank=True,null=True)
#     Bank_Name = models.CharField(max_length=30,null=True,blank=True)
#     Bank_Account_Number = models.CharField(max_length=16,null=True,blank=True)
#     Bank_IFSC_Code = models.CharField(max_length=11,null=True,blank=True)
#     Bank_Account_Holder_Name = models.CharField(max_length=30,null=True,blank=True)
#     Bank_Passbook_Image = models.ImageField(upload_to='Staff_Bank_Passbook',default='Staff_Bank_Passbook/passbook.jpg',blank=True,null=True)
#     UPI_ID = models.CharField(max_length=50,null=True,blank=True)
#     Refer = models.CharField(max_length=10,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class Staff_Transactions(models.Model):
#     Staff_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Amount = models.IntegerField()
#     Type = models.CharField(max_length=10,choices=[('Withdrawal','Withdrawal')])
#     Status = models.CharField(max_length=10,choices=[('Success','Success'),('Failed','Failed')])
#     Msg = models.CharField(max_length=100,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)


# class Service_Data(models.Model):
#     Service_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Service_Name = models.CharField(max_length=30,null=True,blank=True)
#     Picture = models.ImageField(upload_to='Service_User',default='Service_User/service.jpg',blank=True,null=True)
#     Service_Type = models.CharField(max_length=30,null=True,blank=True)
#     Service_Description = models.CharField(max_length=100,null=True,blank=True)
#     Service_Price = models.IntegerField(null=True,blank=True)
#     WP_Contact = models.CharField(max_length=15,null=True,blank=True)
#     Alt_Contact = models.CharField(max_length=15,null=True,blank=True)
#     City = models.CharField(max_length=20,null=True,blank=True)
#     State = models.CharField(max_length=20,null=True,blank=True)
#     District = models.CharField(max_length=20,null=True,blank=True)
#     Country = models.CharField(max_length=20,null=True,blank=True,default='India')
#     Available_Zone = models.JSONField(default=list,blank=True,null=True)
#     Full_Address = models.CharField(max_length=100,null=True,blank=True)
#     Like = models.JSONField(default=list,blank=True,null=True)
#     DisLike = models.JSONField(default=list,blank=True,null=True)
#     Valid_Upto = models.DateField(null=True,blank=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)

# class Service_Transactions(models.Model):
#     User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True)
#     Service_id = models.ForeignKey(Service_User,on_delete=models.CASCADE,unique=True)
#     Amount = models.IntegerField()
#     Status = models.CharField(max_length=10,choices=[('Pending','Pending'),('Success','Success'),('Failed','Failed')])
#     Create_date = models.DateField(auto_now=True)



# # User_State
# class States_With_Districts(models.Model):
#     State=models.CharField(max_length=50,blank=True,null=True)
#     Districts=models.JSONField(blank=True,default=list)
#     Active=models.BooleanField(default=True,null=True,blank=True)
#     Ceated_date=models.DateField(auto_now=True)
    
# class NearDist(models.Model):
#     State = models.CharField(max_length=30,null=True,blank=True)
#     District = models.CharField(max_length=30,null=True,blank=True)
#     Neardist = models.JSONField(default=list,null=True,blank=True)
#     Active=models.BooleanField(default=True,null=True,blank=True)
#     Ceated_date=models.DateField(auto_now=True)


# class Plans(models.Model):
#     Plan = models.CharField(max_length=30,null=True,blank=True)
#     Picture = models.ImageField(upload_to='Plan_Pic',default='Plan_Pic/plan.jpg',blank=True,null=True)
#     Type = models.CharField(max_length=10,null=True,blank=True,choices=[('Recharge','Recharge'),('Coupon','Coupon')])
#     Coupon_Code = models.CharField(max_length=30,null=True,blank=True)
#     Discount_Amount = models.IntegerField(null=True,blank=True)
#     Amount = models.IntegerField(null=True,blank=True)
#     Validity = models.DateField(null=True,blank=True)
#     Msg = models.CharField(max_length=200,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class Success_Story(models.Model):
#     Success_id = models.AutoField(primary_key=True)
#     Male_Name = models.CharField(max_length=30,null=True,blank=True)
#     Female_Name = models.CharField(max_length=30,null=True,blank=True)
#     Success_Story_Text = models.TextField(max_length=1000,null=True,blank=True)
#     Success_Story_Image = models.ImageField(upload_to='Success_Story',default='Success_Story/success.jpg',blank=True,null=True)
#     City = models.CharField(max_length=200,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)


# class Profession(models.Model):
#     Profession_Name = models.CharField(max_length=30,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class Religion(models.Model):
#     Religion_Name = models.CharField(max_length=30,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class Caste(models.Model):
#     Caste_Name = models.JSONField(default=list,null=True,blank=True)
#     Religion = models.CharField(max_length=30,null=True,blank=True)
#     State=models.CharField(max_length=30,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)

# class Language(models.Model):
#     Language = models.CharField(max_length=30,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)


# class Help(models.Model):
#     User_id = models.ForeignKey(User,on_delete=models.CASCADE,unique=True,related_name='User_id')
#     Reply_By = models.ForeignKey(User,on_delete=models.CASCADE,unique=True,related_name='Reply_By')
#     Question = models.CharField(max_length=500,null=True,blank=True)
#     Answer = models.TextField(max_length=500,null=True,blank=True)
#     Role = models.CharField(max_length=10,null=True,blank=True)
#     Create_date = models.DateField(auto_now=True)
#     Active = models.BooleanField(default=True,null=True,blank=True)


# class EmailOTP(models.Model):
#     email = models.EmailField(unique=True)
#     otp = models.CharField(max_length=6)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def is_expired(self):
#         return timezone.now() > self.created_at + timezone.timedelta(minutes=2)
    

# class PhoneOTP(models.Model):
#     phone = models.CharField(max_length=15, unique=True, null=True)
#     otp = models.CharField(max_length=6, null=True)
#     created_at = models.DateTimeField(auto_now_add=True, null=True)

#     def is_expired(self):
#         return timezone.now() > self.created_at + timedelta(minutes=5)



from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .utils import *


class User(AbstractUser):
    id = models.CharField(
        primary_key=True,
        max_length=22,
        default=secure_short_uuid,
        editable=False
    )
    # Amount = models.IntegerField(null=True, blank=True, default=0)
    Reference_Code = models.IntegerField(default=generate_random_number)
    Contact = models.CharField(max_length=10, null=True, blank=True)
    Role = models.CharField(
        max_length=20,
        choices=[
            ('superadmin', 'SuperAdmin'),
            ('admin', 'Admin'),
            ('staff', 'Staff'),
            ('service', 'Service'),
            ('user', 'User'),
        ],
        default='user'
    )
    Refered_By = models.IntegerField(null=True, blank=True, default=0)

class User_Data(models.Model):
    User_id = models.OneToOneField(User, on_delete=models.CASCADE)
    Full_Name = models.CharField(max_length=100, null=True, blank=True)
    Profile_Pic = models.ImageField(
        upload_to='User_Pic',
        default='User_Pic/profilepic.jpg',
        blank=True,
        null=True
    )
    Caste = models.CharField(max_length=50, blank=True)

    Gotra = models.CharField(max_length=50, null=True, blank=True, verbose_name="Gotra (गोत्र)")

    Religion = models.CharField(max_length=50, null=True, blank=True)
    Gender = models.CharField(max_length=20, null=True, blank=True)
    DOB = models.CharField(max_length=20, null=True, blank=True)
    Age = models.IntegerField(null=True, blank=True)
    WP_Contact = models.CharField(max_length=20, null=True, blank=True)
    WP_Contact_Relation = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        default='Self',
        choices=[
            ('Self', 'Self'),
            ('Father', 'Father'),
            ('Mother', 'Mother'),
            ('Brother', 'Brother'),
            ('Sister', 'Sister'),
            ('Guardian', 'Guardian'),
            ('Relative', 'Relative'),
        ]
    )
    Wp_Contact_Name = models.CharField(max_length=100, null=True, blank=True)
    Alt_Contact = models.CharField(max_length=20, null=True, blank=True)
    Alt_Contact_Relation = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        default='Relative',
        choices=[
            ('Self', 'Self'),
            ('Father', 'Father'),
            ('Mother', 'Mother'),
            ('Brother', 'Brother'),
            ('Sister', 'Sister'),
            ('Guardian', 'Guardian'),
            ('Relative', 'Relative'),
        ]
    )
    Alt_Contact_Name = models.CharField(max_length=100, null=True, blank=True)
    Full_Address = models.CharField(max_length=400, null=True, blank=True)
    Email = models.EmailField(null=True, blank=True)
    District = models.CharField(max_length=50, blank=True)
    Nearestdist = models.JSONField(default=list, blank=True, null=True)
    State = models.CharField(max_length=50, blank=True)
    City = models.CharField(max_length=50, blank=True)
    Country = models.CharField(max_length=50, blank=True, default='India')
    Accept_Profiles = models.JSONField(default=list, blank=True, null=True)
    Marrige_status = models.CharField(max_length=50, null=True, blank=True)
    Qualification = models.CharField(max_length=50, null=True, blank=True)
    Profession = models.CharField(max_length=50, null=True, blank=True)
    Job_type = models.CharField(max_length=50, null=True, blank=True)
    Salary = models.IntegerField(null=True, blank=True)
    Disability = models.BooleanField(default=False, null=True, blank=True)
    Manglik = models.BooleanField(default=False, null=True, blank=True)
    Vegeterian = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[
            ('Vegeterian', 'Vegeterian'),
            ('Non-Vegeterian', 'Non-Vegeterian'),
            ('Both', 'Both')
        ]
    )
    Father_name = models.CharField(max_length=30, null=True, blank=True)
    Father_Age = models.IntegerField(null=True, blank=True)
    Father_Profession = models.CharField(max_length=30, null=True, blank=True)
    Mother_name = models.CharField(max_length=30, null=True, blank=True)
    Mother_Age = models.IntegerField(null=True, blank=True)
    Mother_Profession = models.CharField(max_length=30, null=True, blank=True)
    House = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[('Self', 'Self'), ('Rental', 'Rental')]
    )
    Brothers = models.CharField(
        max_length=3,
        null=True,
        blank=True,
        choices=[(str(i), str(i)) for i in range(0, 11)]
    )
    Brothers_marrige = models.CharField(
        max_length=3,
        null=True,
        blank=True,
        choices=[(str(i), str(i)) for i in range(0, 11)]
    )
    Sisters = models.CharField(
        max_length=3,
        null=True,
        blank=True,
        choices=[(str(i), str(i)) for i in range(0, 11)]
    )
    Sisters_marrige = models.CharField(
        max_length=3,
        null=True,
        blank=True,
        choices=[(str(i), str(i)) for i in range(0, 11)]
    )
    Mother_tongue = models.CharField(max_length=100, null=True, blank=True)
    Height = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    Weight = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    Color = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        verbose_name="Complexion (रंग / वर्ण)"
    )
    About_Me = models.TextField(
        null=True,
        blank=True,
        verbose_name="About Me / Custom Details (मेरे बारे में)"
    )
    # Refer = models.IntegerField(null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Valid_Upto = models.DateField(null=True, blank=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class User_Transactions(models.Model):
    User_id = models.ForeignKey(User, on_delete=models.CASCADE)
    Plan = models.CharField(max_length=30, null=True, blank=True)
    Amount = models.IntegerField()
    status = models.CharField(max_length=8, default='Pending')
    Create_date = models.DateField(auto_now=True)


class Wish_List(models.Model):
    STATUS_SHORTLISTED = 'Shortlisted'
    STATUS_PENDING = 'Pending'
    STATUS_APPROVED = 'Approved'
    STATUS_REJECTED = 'Rejected'
    STATUS_CHOICES = [
        (STATUS_SHORTLISTED, 'Shortlisted'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    User_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='wishlists_created'
    )
    Wish_User_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='wishlists_received'
    )
    Status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default=STATUS_SHORTLISTED,
    )
    is_shortlisted = models.BooleanField(default=True)
    Create_date = models.DateField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['User_id', 'Wish_User_id'],
                name='unique_wishlist_pair',
            )
        ]


class Staff_Data(models.Model):
    Staff_id = models.ForeignKey(User, on_delete=models.CASCADE)
    Full_Name = models.CharField(max_length=30, null=True, blank=True)
    Profile_Pic = models.ImageField(
        upload_to='Staff_Pic',
        default='Staff_Pic/profilepic.jpg',
        blank=True,
        null=True
    )
    WP_Contact = models.CharField(max_length=20, null=True, blank=True)
    Age = models.IntegerField(null=True, blank=True)
    Full_Address = models.CharField(max_length=400, null=True, blank=True)
    District = models.CharField(max_length=50, blank=True)
    State = models.CharField(max_length=50, blank=True)
    City = models.CharField(max_length=50, blank=True)
    Country = models.CharField(max_length=50, blank=True, default='India')
    Email = models.EmailField(null=True, blank=True)
    Adhar_Number = models.CharField(max_length=12, null=True, blank=True)
    Adhar_Image = models.ImageField(
        upload_to='Staff_Adhar',
        default='Staff_Adhar/adhar.jpg',
        blank=True,
        null=True
    )
    PAN_Number = models.CharField(max_length=10, null=True, blank=True)
    PAN_Image = models.ImageField(
        upload_to='Staff_PAN',
        default='Staff_PAN/pan.jpg',
        blank=True,
        null=True
    )
    Bank_Name = models.CharField(max_length=30, null=True, blank=True)
    Bank_Account_Number = models.CharField(max_length=16, null=True, blank=True)
    Bank_IFSC_Code = models.CharField(max_length=11, null=True, blank=True)
    Bank_Account_Holder_Name = models.CharField(max_length=30, null=True, blank=True)
    Bank_Passbook_Image = models.ImageField(
        upload_to='Staff_Bank_Passbook',
        default='Staff_Bank_Passbook/passbook.jpg',
        blank=True,
        null=True
    )
    UPI_ID = models.CharField(max_length=50, null=True, blank=True)
    Amount = models.IntegerField(null=True, blank=True, default=0)
    Refer = models.CharField(max_length=10, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)
    is_approved = models.BooleanField(default=False, verbose_name="Admin Approved")


class Staff_Transactions(models.Model):
    Staff_id = models.ForeignKey(User, on_delete=models.CASCADE)
    Amount = models.IntegerField()
    Type = models.CharField(
        max_length=15,
        choices=[('Withdrawal', 'Withdrawal'), ('Commission', 'Commission')],
        default='Commission'
    )
    Status = models.CharField(
        max_length=15,
        choices=[
            ('Pending', 'Pending'),
            ('Approved', 'Approved'),
            ('Rejected', 'Rejected'),
            ('Success', 'Success'),
            ('Failed', 'Failed'),
        ],
        default='Pending'
    )
    Msg = models.CharField(max_length=255, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)

class Staff_Commission(models.Model):
    Amount = models.IntegerField()
    Active = models.BooleanField(default=True, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)

    def __str__(self):
        return f"₹{self.Amount} ({'Active' if self.Active else 'Inactive'})"


class Service_Data(models.Model):
    Service_id = models.ForeignKey(User, on_delete=models.CASCADE)
    Service_Name = models.CharField(max_length=30, null=True, blank=True)
    Picture = models.ImageField(
        upload_to='Service_Data',
        default='Service_Data/service.jpg',
        blank=True,
        null=True
    )
    Service_Type = models.CharField(max_length=30, null=True, blank=True)
    Service_Description = models.CharField(max_length=100, null=True, blank=True)
    Service_Price = models.IntegerField(null=True, blank=True)
    WP_Contact = models.CharField(max_length=15, null=True, blank=True)
    Alt_Contact = models.CharField(max_length=15, null=True, blank=True)
    City = models.CharField(max_length=20, null=True, blank=True)
    State = models.CharField(max_length=20, null=True, blank=True)
    District = models.CharField(max_length=20, null=True, blank=True)
    Country = models.CharField(max_length=20, null=True, blank=True, default='India')
    Available_Zone = models.JSONField(default=list, blank=True, null=True)
    Full_Address = models.CharField(max_length=100, null=True, blank=True)
    Like = models.JSONField(default=list, blank=True, null=True)
    DisLike = models.JSONField(default=list, blank=True, null=True)
    Valid_Upto = models.DateField(null=True, blank=True)
    Admin_Approval = models.BooleanField(default=False, null=True, blank=True)
    Active = models.BooleanField(default=False, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)


# Backwards compatibility alias
Service_User = Service_Data


class Service_Transactions(models.Model):
    User_id = models.ForeignKey(User, on_delete=models.CASCADE)
    Service_id = models.ForeignKey(Service_Data, on_delete=models.CASCADE)
    Amount = models.IntegerField()
    Status = models.CharField(
        max_length=10,
        choices=[
            ('Pending', 'Pending'),
            ('Success', 'Success'),
            ('Failed', 'Failed')
        ]
    )
    Create_date = models.DateField(auto_now=True)


class Services(models.Model):
    Service_Name = models.CharField(max_length=30, null=True, blank=True)
    Service_Type = models.CharField(max_length=30, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Service_Charge(models.Model):
    Amount = models.IntegerField()
    Service_Type = models.ForeignKey(Services, on_delete=models.CASCADE)
    Active = models.BooleanField(default=True, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Validity = models.IntegerField(null=True, blank=True)


class States_With_Districts(models.Model):
    State = models.CharField(max_length=50, blank=True, null=True)
    Districts = models.JSONField(blank=True, default=list)
    Active = models.BooleanField(default=True, null=True, blank=True)
    Ceated_date = models.DateField(auto_now=True)


class NearDist(models.Model):
    State = models.CharField(max_length=30, null=True, blank=True)
    District = models.CharField(max_length=30, null=True, blank=True)
    Neardist = models.JSONField(default=list, null=True, blank=True)
    Active = models.BooleanField(default=True, null=True, blank=True)
    Ceated_date = models.DateField(auto_now=True)


class Plans(models.Model):
    Plan = models.CharField(max_length=30, null=True, blank=True)
    # Picture = models.ImageField(
    #     upload_to='Plan_Pic',
    #     default='Plan_Pic/plan.jpg',
    #     blank=True,
    #     null=True
    # )
    Type = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        choices=[('Recharge', 'Recharge'), ('Coupon', 'Coupon')]
    )
    Coupon_Code = models.CharField(max_length=30, null=True, blank=True)
    Discount_Amount = models.IntegerField(null=True, blank=True)
    Amount = models.IntegerField(null=True, blank=True)
    Validity = models.IntegerField(
        null=True,
        blank=True,
        default=30,
        help_text="Validity in number of days (e.g. 10, 30, 90)"
    )

    @property
    def valid(self):
        return self.Validity

    @valid.setter
    def valid(self, value):
        self.Validity = value
    Msg = models.CharField(max_length=200, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Success_Story(models.Model):
    Success_id = models.AutoField(primary_key=True)
    Male_Name = models.CharField(max_length=30, null=True, blank=True)
    Female_Name = models.CharField(max_length=30, null=True, blank=True)
    Success_Story_Text = models.TextField(max_length=1000, null=True, blank=True)
    Success_Story_Image = models.ImageField(
        upload_to='Success_Story',
        default='Success_Story/success.jpg',
        blank=True,
        null=True
    )
    City = models.CharField(max_length=200, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Profession(models.Model):
    Profession_Name = models.CharField(max_length=30, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Religion(models.Model):
    Religion_Name = models.CharField(max_length=30, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Caste(models.Model):
    Caste_Name = models.JSONField(default=list, null=True, blank=True)
    Religion = models.CharField(max_length=30, null=True, blank=True)
    State = models.CharField(max_length=30, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Language(models.Model):
    State = models.CharField(max_length=30, null=True, blank=True)
    Language = models.CharField(max_length=30, null=True, blank=True)
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)


class Color(models.Model):
    Color = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        verbose_name="Complexion (रंग / वर्ण)"
    )
    Create_date = models.DateField(auto_now=True)
    Active = models.BooleanField(default=True, null=True, blank=True)

    def __str__(self):
        return self.Color or "Unnamed Complexion"

    class Meta:
        verbose_name = "Complexion"
        verbose_name_plural = "Complexions"


class Help(models.Model):
    User_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='help_questions'
    )
    User_Role = models.CharField(max_length=20, null=True, blank=True)
    Target_User_id = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='help_targets',
        null=True,
        blank=True,
        db_column='Target_User_id'
    )
    Reply_By = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='help_replies',
        null=True,
        blank=True
    )
    Question = models.TextField(max_length=1000, null=True, blank=True)
    Answer = models.TextField(max_length=1000, null=True, blank=True)
    Role = models.CharField(max_length=20, null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_date = models.DateTimeField(null=True, blank=True)
    Create_date = models.DateField(auto_now=True, null=True, blank=True)
    Active = models.BooleanField(default=True, null=True, blank=True)

    @property
    def Target_User(self):
        return self.Target_User_id

    @Target_User.setter
    def Target_User(self, value):
        self.Target_User_id = value


# class EmailOTP(models.Model):
#     email = models.EmailField(unique=True)
#     otp = models.CharField(max_length=6)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def is_expired(self):
#         return timezone.now() > self.created_at + timedelta(minutes=2)


class PhoneOTP(models.Model):
    phone = models.CharField(max_length=15, unique=True, null=True)
    otp = models.CharField(max_length=6, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def is_expired(self):
        if not self.created_at:
            return True

        return timezone.now() > self.created_at + timedelta(minutes=5)

    def __str__(self):
        return self.phone or "Unknown phone"
