import json
import ast
from datetime import datetime
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from .models import *


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        trim_whitespace=False,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ("Contact", "password")

    def validate_Contact(self, value):
        value = value.strip()

        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "Enter a valid 10-digit mobile number."
            )

        if User.objects.filter(Contact=value).exists():
            raise serializers.ValidationError(
                "This contact number is already registered."
            )

        return value

    def create(self, validated_data):
        contact = validated_data["Contact"]
        password = validated_data.pop("password")

        user = User(
            username=contact,
            Contact=contact,
            Role="user",
        )
        user.set_password(password)
        user.save()

        return user

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = "__all__"
        read_only_fields = (
            "id", "Reference_Code",
            "last_login", "date_joined"
        )

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        refered_by = validated_data.get("Refered_By")
        from .utils import resolve_valid_referral_code
        validated_data["Refered_By"] = resolve_valid_referral_code(refered_by)

        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance



class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = User_Data
        fields = "__all__"

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            clean_data = {}
            for k in data.keys():
                clean_data[k] = data.get(k)
        elif hasattr(data, "copy"):
            clean_data = data.copy()
        else:
            clean_data = dict(data)

        for field in ("Nearestdist", "Accept_Profiles"):
            if field in clean_data:
                val = clean_data[field]
                if isinstance(val, str):
                    try:
                        clean_data[field] = json.loads(val)
                    except Exception:
                        try:
                            parsed = ast.literal_eval(val)
                            clean_data[field] = parsed if isinstance(parsed, (list, dict)) else [parsed]
                        except Exception:
                            if "," in val:
                                clean_data[field] = [x.strip() for x in val.split(",") if x.strip()]
                            elif val.strip():
                                clean_data[field] = [val.strip()]
                            else:
                                clean_data[field] = []
                elif not isinstance(val, (list, dict)) and val is not None:
                    clean_data[field] = [val]

        # Alias resolution and robust date parsing for Valid_Upto
        for alias in ("valid_upto", "validity", "expiry_date", "membership_expiry", "membership_expiry_date", "valid_until", "valid_date"):
            if alias in clean_data and "Valid_Upto" not in clean_data:
                clean_data["Valid_Upto"] = clean_data.pop(alias)

        if "Valid_Upto" in clean_data:
            vu_val = clean_data.get("Valid_Upto")
            if vu_val is None or vu_val == "" or str(vu_val).strip().lower() in ("none", "null", "undefined", ""):
                clean_data["Valid_Upto"] = None
            elif isinstance(vu_val, str):
                v_str = vu_val.strip()
                if not v_str or v_str.lower() in ("none", "null", "undefined"):
                    clean_data["Valid_Upto"] = None
                else:
                    if "T" in v_str:
                        v_str = v_str.split("T")[0].strip()
                    parsed_dt = None
                    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y", "%d.%m.%Y"):
                        try:
                            parsed_dt = datetime.strptime(v_str, fmt).date()
                            break
                        except (ValueError, TypeError):
                            pass
                    if parsed_dt:
                        clean_data["Valid_Upto"] = parsed_dt.strftime("%Y-%m-%d")
                    else:
                        clean_data["Valid_Upto"] = v_str

        return super().to_internal_value(clean_data)


class UserTransactionsSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField(read_only=True)
    candidate_contact = serializers.SerializerMethodField(read_only=True)
    candidate_username = serializers.CharField(source="User_id.username", read_only=True)

    class Meta:
        model = User_Transactions
        fields = "__all__"

    def get_candidate_name(self, obj):
        if not obj.User_id:
            return ""
        ud = User_Data.objects.filter(User_id=obj.User_id_id).first()
        return (ud.Full_Name if ud and ud.Full_Name else "") or obj.User_id.first_name or obj.User_id.username

    def get_candidate_contact(self, obj):
        if not obj.User_id:
            return ""
        return obj.User_id.Contact or ""


class WishListSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField(read_only=True)
    sender_contact = serializers.SerializerMethodField(read_only=True)
    sender_username = serializers.CharField(source="User_id.username", read_only=True)
    receiver_name = serializers.SerializerMethodField(read_only=True)
    receiver_contact = serializers.SerializerMethodField(read_only=True)
    receiver_username = serializers.CharField(source="Wish_User_id.username", read_only=True)

    class Meta:
        model = Wish_List
        fields = (
            'id', 'User_id', 'Wish_User_id', 'Status', 'is_shortlisted', 'Create_date',
            'sender_name', 'sender_contact', 'sender_username',
            'receiver_name', 'receiver_contact', 'receiver_username'
        )
        read_only_fields = ('id', 'User_id', 'Status', 'Create_date')

    def get_sender_name(self, obj):
        if not obj.User_id:
            return ""
        ud = User_Data.objects.filter(User_id=obj.User_id_id).first()
        return (ud.Full_Name if ud and ud.Full_Name else "") or obj.User_id.first_name or obj.User_id.username

    def get_sender_contact(self, obj):
        if not obj.User_id:
            return ""
        return obj.User_id.Contact or ""

    def get_receiver_name(self, obj):
        if not obj.Wish_User_id:
            return ""
        ud = User_Data.objects.filter(User_id=obj.Wish_User_id_id).first()
        return (ud.Full_Name if ud and ud.Full_Name else "") or obj.Wish_User_id.first_name or obj.Wish_User_id.username

    def get_receiver_contact(self, obj):
        if not obj.Wish_User_id:
            return ""
        return obj.Wish_User_id.Contact or ""


class StaffDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff_Data
        fields = "__all__"


class StaffTransactionsSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField(read_only=True)
    staff_contact = serializers.SerializerMethodField(read_only=True)
    staff_bank_name = serializers.SerializerMethodField(read_only=True)
    staff_bank_account = serializers.SerializerMethodField(read_only=True)
    staff_bank_ifsc = serializers.SerializerMethodField(read_only=True)
    staff_upi_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Staff_Transactions
        fields = "__all__"

    def get_staff_name(self, obj):
        if not obj.Staff_id:
            return ""
        sd = Staff_Data.objects.filter(Staff_id=obj.Staff_id_id).first()
        return (sd.Full_Name if sd and sd.Full_Name else "") or obj.Staff_id.first_name or obj.Staff_id.username

    def get_staff_contact(self, obj):
        return obj.Staff_id.Contact if obj.Staff_id else ""

    def get_staff_bank_name(self, obj):
        sd = Staff_Data.objects.filter(Staff_id=obj.Staff_id_id).first()
        return sd.Bank_Name if sd else ""

    def get_staff_bank_account(self, obj):
        sd = Staff_Data.objects.filter(Staff_id=obj.Staff_id_id).first()
        return sd.Bank_Account_Number if sd else ""

    def get_staff_bank_ifsc(self, obj):
        sd = Staff_Data.objects.filter(Staff_id=obj.Staff_id_id).first()
        return sd.Bank_IFSC_Code if sd else ""

    def get_staff_upi_id(self, obj):
        sd = Staff_Data.objects.filter(Staff_id=obj.Staff_id_id).first()
        return sd.UPI_ID if sd else ""


class StaffCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff_Commission
        fields = "__all__"


class ServiceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service_Data
        fields = "__all__"

    def validate_WP_Contact(self, value):
        if value:
            import re
            cleaned = re.sub(r"\D", "", str(value).strip())
            if len(cleaned) != 10:
                raise serializers.ValidationError("WhatsApp contact number must be exactly 10 digits.")
            return cleaned
        return value

    def validate_Alt_Contact(self, value):
        if value:
            import re
            cleaned = re.sub(r"\D", "", str(value).strip())
            if len(cleaned) != 10:
                raise serializers.ValidationError("Alternate contact number must be exactly 10 digits.")
            return cleaned
        return value


# Backwards compatibility alias
ServiceUserSerializer = ServiceDataSerializer


class ServiceTransactionsSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source="Service_id.Service_Name", read_only=True)
    service_type = serializers.CharField(source="Service_id.Service_Type", read_only=True)
    vendor_contact = serializers.CharField(source="User_id.Contact", read_only=True)
    vendor_username = serializers.CharField(source="User_id.username", read_only=True)

    class Meta:
        model = Service_Transactions
        fields = "__all__"


class ServicesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Services
        fields = "__all__"


class ServiceChargeSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="Service_Type.Service_Name", read_only=True)
    service_type_name = serializers.CharField(source="Service_Type.Service_Type", read_only=True)

    class Meta:
        model = Service_Charge
        fields = "__all__"


class StatesWithDistrictsSerializer(serializers.ModelSerializer):
    class Meta:
        model = States_With_Districts
        fields = "__all__"


class NearDistSerializer(serializers.ModelSerializer):
    class Meta:
        model = NearDist
        fields = "__all__"


class PlansSerializer(serializers.ModelSerializer):
    valid = serializers.IntegerField(source="Validity", required=False, allow_null=True)

    class Meta:
        model = Plans
        fields = "__all__"

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "valid" in data and "Validity" not in data:
            data["Validity"] = data["valid"]
        return super().to_internal_value(data)


class SuccessStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Success_Story
        fields = "__all__"


class ProfessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profession
        fields = "__all__"


class ReligionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Religion
        fields = "__all__"


class CasteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caste
        fields = "__all__"


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = "__all__"


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = "__all__"


class HelpSerializer(serializers.ModelSerializer):
    User_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False
    )
    Reply_By = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    Target_User_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    Target_User = serializers.PrimaryKeyRelatedField(
        source='Target_User_id',
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Help
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure Target_User and Target_User_id are serialized consistently
        target_obj = instance.Target_User_id
        data["Target_User_id"] = target_obj.pk if target_obj else None
        data["Target_User"] = target_obj.pk if target_obj else None

        # Reply info (only if an actual response has been provided)
        if instance.Reply_By:
            staff_profile = Staff_Data.objects.filter(Staff_id=instance.Reply_By).first()
            admin_data = User_Data.objects.filter(User_id=instance.Reply_By).first()
            is_reply_admin = (
                str(getattr(instance.Reply_By, "Role", "")).lower() in ["admin", "superadmin"]
                or instance.Reply_By.is_superuser
            )
            cand_reply_name = (
                (staff_profile and staff_profile.Full_Name)
                or (admin_data and admin_data.Full_Name)
                or instance.Reply_By.get_full_name()
            )
            if cand_reply_name and not cand_reply_name.strip().isdigit():
                reply_name = cand_reply_name.strip()
            elif is_reply_admin:
                reply_name = "Admin"
            else:
                reply_name = instance.Reply_By.username or "Staff Counselor"

            data["reply_by_name"] = reply_name
            data["reply_by_role"] = getattr(instance.Reply_By, "Role", "") or instance.Role
        else:
            data["reply_by_name"] = None
            data["reply_by_role"] = None

        # Target routing info
        target_name = None
        target_role = instance.Role or "admin"
        if target_obj:
            st_prof = Staff_Data.objects.filter(Staff_id=target_obj).first()
            adm_prof = User_Data.objects.filter(User_id=target_obj).first()
            is_target_admin = (
                str(getattr(target_obj, "Role", "")).lower() in ["admin", "superadmin"]
                or target_obj.is_superuser
            )
            cand_target_name = (
                (st_prof and st_prof.Full_Name)
                or (adm_prof and adm_prof.Full_Name)
                or target_obj.get_full_name()
            )
            if cand_target_name and not cand_target_name.strip().isdigit():
                target_name = cand_target_name.strip()
            elif is_target_admin:
                target_name = "Admin"
            else:
                target_name = target_obj.username or "Admin"
            target_role = getattr(target_obj, "Role", "") or instance.Role or "admin"
        elif (instance.Role or "").lower() == "staff":
            target_name = "Staff Counselor"
            target_role = "staff"
        else:
            target_name = "Admin"
            target_role = "admin"

        data["target_name"] = target_name
        data["target_role"] = target_role

        if instance.User_id:
            user_prof = Staff_Data.objects.filter(Staff_id=instance.User_id).first() if getattr(instance.User_id, "Role", "") == "staff" else User_Data.objects.filter(User_id=instance.User_id).first()
            data["sender_name"] = (
                (user_prof and user_prof.Full_Name)
                or instance.User_id.get_full_name()
                or instance.User_id.username
                or f"User #{instance.User_id.pk}"
            )
            data["sender_role"] = instance.User_Role or getattr(instance.User_id, "Role", "") or instance.Role
            data["sender_contact"] = getattr(instance.User_id, "Contact", "")
        else:
            data["sender_name"] = "Anonymous Member"
            data["sender_role"] = instance.User_Role or instance.Role or "user"
            data["sender_contact"] = ""

        # User role resolution (requester role vs target role)
        data["User_Role"] = instance.User_Role or getattr(instance.User_id, "Role", "") or "user"
        data["Role"] = instance.Role or ("staff" if (target_obj and getattr(target_obj, "Role", "") == "staff") else "admin")
        data["is_staff_raised"] = data["User_Role"] == "staff"
        data["is_answered"] = bool(instance.Answer and instance.Answer.strip())
        return data


# class EmailOTPSerializer(serializers.ModelSerializer):
#     otp = serializers.CharField(write_only=True)

#     class Meta:
#         model = EmailOTP
#         fields = "__all__"


class PhoneOTPSerializer(serializers.ModelSerializer):
    otp = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = PhoneOTP
        fields = "__all__"
