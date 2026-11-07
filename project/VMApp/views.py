from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction, IntegrityError
from django.db.models import Q
from .models import *
from .serializers import *
from .utils import send_otp_via_f2sms, get_default_admin_reference_code, resolve_valid_referral_code
from .email_notifications import notify_partner_request_async
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, datetime
import razorpay
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
import json


def has_active_membership(user):
    """A membership is active strictly through its Valid_Upto date, including today."""
    if not getattr(user, "is_authenticated", False):
        return False
    # Staff / admin / superuser always have active access
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True
    user_role = getattr(user, "Role", "").lower()
    if user_role in ["admin", "superadmin", "staff"]:
        return True
    profile = User_Data.objects.filter(User_id=user).only("Valid_Upto").first()
    if profile and profile.Valid_Upto and profile.Valid_Upto >= timezone.localdate():
        return True
    return False


def update_user_membership_validity(user_obj, plan_name=None, plan_id=None, amount=None):
    """
    Updates the User_Data Valid_Upto based on the plan's validity in number of days.
    If plan specifies e.g. 10 days, adds 10 days to the user's membership.
    If user already has an active membership (e.g. 10 days left), it extends from that date
    (resulting in 20 days later date). Otherwise, it extends from today.
    """
    if not user_obj:
        return None, 30

    profile = User_Data.objects.filter(User_id=user_obj).first()
    if not profile:
        return None, 30

    db_plan = None
    if plan_id:
        try:
            db_plan = Plans.objects.filter(id=plan_id).first()
        except Exception:
            pass
    if not db_plan and plan_name:
        p_str = str(plan_name).strip()
        db_plan = Plans.objects.filter(Plan__iexact=p_str).first()
        if not db_plan:
            db_plan = Plans.objects.filter(Plan__icontains=p_str).first()
    if not db_plan and amount:
        try:
            amt = int(float(amount))
            db_plan = Plans.objects.filter(Amount=amt).first()
        except (ValueError, TypeError):
            pass

    # Extract days from plan Validity (integer number of days)
    days = None
    if db_plan and db_plan.Validity is not None:
        try:
            days = int(db_plan.Validity)
        except (ValueError, TypeError):
            if hasattr(db_plan.Validity, "strftime"):
                today = timezone.localdate()
                if db_plan.Validity > today:
                    days = (db_plan.Validity - today).days

    # Fallback only if no valid days could be determined from DB
    if not days or days <= 0:
        p_lower = str(plan_name or "").lower()
        if "platinum" in p_lower or "royal" in p_lower:
            days = 180
        elif "gold" in p_lower:
            days = 90
        elif "silver" in p_lower:
            days = 30
        elif amount and int(float(amount or 0)) >= 1000:
            days = 180
        elif amount and int(float(amount or 0)) >= 500:
            days = 90
        else:
            days = 30

    curr_date = profile.Valid_Upto
    today = timezone.localdate()
    # If existing membership has not expired, extend from curr_date; else from today
    base = max(curr_date, today) if curr_date else today
    profile.Valid_Upto = base + timedelta(days=days)
    profile.save(update_fields=["Valid_Upto"])
    return profile.Valid_Upto, days


# =========================================================
# 1. REGISTER API
# =========================================================

class SendOTPAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone = str(request.data.get("Contact", "")).strip()

        if not phone.isdigit() or len(phone) != 10:
            return Response(
                {"error": "Enter a valid 10-digit mobile number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(Q(Contact=phone) | Q(username=phone)).exists():
            return Response(
                {"error": "This mobile number is already registered. Please login."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.FAST2SMS_API_KEY:
            return Response(
                {"error": "SMS service is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Send SMS first; save the OTP only if the provider accepts it.
        success, otp = send_otp_via_f2sms(phone)

        if not success:
            return Response(
                {"error": "Unable to send OTP. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        PhoneOTP.objects.update_or_create(
            phone=phone,
            defaults={
                "otp": otp,
                "created_at": timezone.now(),
            },
        )

        return Response(
            {"message": "OTP sent successfully. It expires in 5 minutes."},
            status=status.HTTP_200_OK,
        )

class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone = str(request.data.get("Contact", "")).strip()
        otp = str(request.data.get("OTP", "")).strip()
        verify_only = request.data.get("verify_only", False)
        password = request.data.get("password")
        refered_by = request.data.get("Refered_By")

        if not phone or not otp:
            return Response(
                {"error": "Contact and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not phone.isdigit() or len(phone) != 10:
            return Response(
                {"error": "Enter a valid 10-digit mobile number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp.isdigit() or len(otp) != 6:
            return Response(
                {"error": "Enter a valid 6-digit OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                try:
                    otp_record = PhoneOTP.objects.select_for_update().get(
                        phone=phone
                    )
                except PhoneOTP.DoesNotExist:
                    return Response(
                        {"error": "OTP not found. Please request a new OTP."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                # Delete expired OTP records
                if otp_record.is_expired():
                    otp_record.delete()
                    return Response(
                        {"error": "OTP expired. Please request a new OTP."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Validate OTP code
                if otp_record.otp != otp:
                    return Response(
                        {"error": "Invalid OTP."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if phone number or username is already registered
                if User.objects.filter(Q(Contact=phone) | Q(username=phone)).exists():
                    otp_record.delete()
                    return Response(
                        {"error": "User already registered with this mobile number. Please login."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Step 1 Check: Verify OTP only (before setting password on frontend)
                if verify_only:
                    return Response(
                        {
                            "message": "OTP verified successfully. Please set your password.",
                            "verified": True,
                        },
                        status=status.HTTP_200_OK,
                    )

                # Step 2: Finalize registration with password
                if not password:
                    return Response(
                        {"error": "Password is required to complete registration."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Validate password strength using Django validators
                temp_user = User(username=phone, Contact=phone)
                try:
                    validate_password(password, user=temp_user)
                except DjangoValidationError as val_err:
                    err_msg = val_err.messages[0] if getattr(val_err, "messages", None) else str(val_err)
                    return Response(
                        {"error": err_msg},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # If user registers using staff referral and staff data is not present,
                # then no need to add balance anywhere; use admin referral by default
                ref_num = resolve_valid_referral_code(refered_by)

                # Determine role (defaults to 'user')
                role_param = str(request.data.get("Role") or request.data.get("role") or "user").strip().lower()
                valid_roles = ["user", "service", "admin", "superadmin", "staff"]
                assigned_role = role_param if role_param in valid_roles else "user"

                # Extract optional registration profile fields
                full_name_val = str(request.data.get("Full_Name") or request.data.get("full_name") or request.data.get("firstname") or "").strip()
                caste_val = str(request.data.get("Caste") or request.data.get("caste") or "").strip()
                religion_val = str(request.data.get("Religion") or request.data.get("religion") or "").strip()
                gender_val = str(request.data.get("Gender") or request.data.get("gender") or "").strip()

                # Create user with properly hashed password
                user = User(
                    Contact=phone,
                    username=phone,
                    Role=assigned_role,
                    Refered_By=ref_num,
                )
                if full_name_val:
                    user.first_name = full_name_val[:30]
                if assigned_role in ["admin", "superadmin"]:
                    user.is_staff = True
                    user.is_superuser = True
                elif assigned_role == "staff":
                    user.is_staff = True

                user.set_password(password)
                try:
                    user.save()
                except IntegrityError:
                    return Response(
                        {"error": "This mobile number is already registered. Please login."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Initialize or update User_Data with profile details
                user_data_defaults = {
                    "WP_Contact": phone,
                }
                if full_name_val:
                    user_data_defaults["Full_Name"] = full_name_val
                if caste_val:
                    user_data_defaults["Caste"] = caste_val
                if religion_val:
                    user_data_defaults["Religion"] = religion_val
                if gender_val:
                    user_data_defaults["Gender"] = gender_val

                user_data, _ = User_Data.objects.get_or_create(
                    User_id=user,
                    defaults=user_data_defaults
                )
                if caste_val and not user_data.Caste:
                    user_data.Caste = caste_val
                if religion_val and not user_data.Religion:
                    user_data.Religion = religion_val
                if full_name_val and not user_data.Full_Name:
                    user_data.Full_Name = full_name_val
                if gender_val and not user_data.Gender:
                    user_data.Gender = gender_val
                user_data.save()

                # Delete OTP record after successful registration
                otp_record.delete()

                # Generate JWT tokens for auto-login / session
                refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Registration successful! Welcome to Vaivaheek Manch 💖",
                    "id": user.pk,
                    "Contact": user.Contact,
                    "username": user.username,
                    "Refered_By": user.Refered_By,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as exc:
            err_str = str(exc)
            if "UNIQUE constraint" in err_str or "unique" in err_str.lower():
                return Response(
                    {"error": "This mobile number is already registered. Please login."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"error": f"Registration failed: {err_str}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        from project.urls import react_app_view
        return react_app_view(request)

    def post(self, request):
        contact = str(
            request.data.get("Contact") or request.data.get("username", "")
        ).strip()
        password = request.data.get("password")

        if not contact or not password:
            return Response(
                {"error": "Mobile number and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lookup user by Contact or username
        user_obj = User.objects.filter(Contact=contact).first()
        if not user_obj:
            user_obj = User.objects.filter(username=contact).first()

        if not user_obj:
            return Response(
                {"error": "Invalid mobile number or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Standard Django authentication (verifies PBKDF2 hashed password)
        user = authenticate(
            request,
            username=user_obj.username,
            password=password,
        )

        # Fallback check_password if authenticate returned None
        if user is None and user_obj.check_password(password):
            if user_obj.is_active:
                user = user_obj

        if user is None:
            return Response(
                {"error": "Invalid mobile number or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Optional role check if client specified expected role
        role_param = str(request.data.get("Role") or request.data.get("role", "")).strip().lower()
        if role_param and user.Role:
            user_role = user.Role.lower()
            # Allow superadmin, superuser or staff in admin login
            role_matches = (
                user_role == role_param or
                (role_param == "admin" and (user_role in ["admin", "superadmin"] or user.is_superuser or user.is_staff))
            )
            if not role_matches:
                return Response(
                    {"error": f"This account is registered as a '{user.Role}'. Please use the {user.Role.capitalize()} login."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

# =========================================================
# 4. USER API
# =========================================================

def get_user_staff_ref_code(user):
    if not user:
        return None
    code = getattr(user, "Reference_Code", None)
    if not code or str(code) in ("0", "None", ""):
        try:
            staff_rec = Staff_Data.objects.filter(Staff_id=getattr(user, "pk", getattr(user, "id", None))).first()
            if staff_rec and staff_rec.Refer:
                return str(staff_rec.Refer).strip()
        except Exception:
            pass
    return str(code).strip() if code else None


class UserAPIView(APIView):
    def get_authenticators(self):
        return [JWTAuthentication()]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(User, pk=pk)
            return Response(UserSerializer(obj).data)

        role = request.query_params.get("Role") or request.query_params.get("role")
        if role:
            objects = User.objects.filter(Role__iexact=role)
            if not objects.exists() and role.lower() == "admin":
                objects = User.objects.filter(Role__iexact="superadmin") | User.objects.filter(is_superuser=True)
        else:
            objects = User.objects.all()

        refered_by = request.query_params.get("Refered_By") or request.query_params.get("refered_by")
        scope = request.query_params.get("scope") or request.query_params.get("all")
        if refered_by:
            try:
                ref_int = int(str(refered_by).strip())
                objects = objects.filter(Refered_By=ref_int)
            except (ValueError, TypeError):
                objects = objects.filter(Refered_By=refered_by)
        elif getattr(request.user, "is_authenticated", False) and getattr(request.user, "Role", "") == "staff":
            if scope in ["all", "global", "true"]:
                objects = objects.filter(Role__iexact="user")
            else:
                staff_ref = get_user_staff_ref_code(request.user)
                if staff_ref:
                    try:
                        ref_int = int(str(staff_ref).strip())
                        objects = objects.filter(Refered_By=ref_int)
                    except (ValueError, TypeError):
                        objects = objects.filter(Refered_By=staff_ref)
                else:
                    objects = objects.none()

        is_admin_or_super = (
            getattr(request.user, "is_superuser", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        is_staff_user = (
            getattr(request.user, "is_authenticated", False)
            and str(getattr(request.user, "Role", "")).lower() == "staff"
            and not is_admin_or_super
        )
        if is_staff_user:
            clean_list = []
            for u in objects:
                udata = UserSerializer(u).data
                # Restrict contact details for staff
                udata["Contact"] = None
                udata["contact"] = None
                raw_u = str(udata.get("username", "") or "")
                if raw_u.isdigit() and len(raw_u) == 10:
                    udata["username"] = f"******{raw_u[-4:]}"
                udata["email"] = None
                udata["Email"] = None
                clean_list.append(udata)
            return Response(clean_list)

        return Response(UserSerializer(objects, many=True).data)

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # Check if caller is a staff member
        is_staff_user = getattr(request.user, "Role", "") == "staff" and not (
            getattr(request.user, "is_superuser", False)
            or (getattr(request.user, "is_staff", False) and getattr(request.user, "Role", "") in ["admin", "superadmin"])
        )
        if is_staff_user:
            staff_profile = Staff_Data.objects.filter(Staff_id=request.user.id).first()
            if not staff_profile:
                return Response(
                    {"error": "Staff profile not found. Please complete and submit your staff profile first."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not staff_profile.is_approved or staff_profile.Active is False:
                return Response(
                    {"error": "Your staff profile is pending admin approval. You cannot add users until an administrator verifies and approves your profile."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Enforce staff referral code and role='user'
            refer_code = request.user.Reference_Code or staff_profile.Refer
            data["Refered_By"] = refer_code
            data["Role"] = "user"
            if "username" not in data or not data["username"]:
                data["username"] = data.get("Contact")

        serializer = UserSerializer(data=data)

        if serializer.is_valid():
            user_obj = serializer.save()
            return Response(
                UserSerializer(user_obj).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(User, pk=pk)
        is_owner = obj.pk == request.user.pk
        is_admin = request.user.is_staff or getattr(request.user, "Role", "") in ["admin", "superadmin"]
        staff_ref = get_user_staff_ref_code(request.user)
        is_referred_staff = (
            getattr(request.user, "Role", "") == "staff"
            and staff_ref
            and str(getattr(obj, "Refered_By", "")) == staff_ref
        )
        if not (is_owner or is_admin or is_referred_staff):
            return Response(
                {"error": "Permission denied. Staff can only edit accounts of users referred by them."},
                status=status.HTTP_403_FORBIDDEN,
            )

        is_staff_only = getattr(request.user, "Role", "") == "staff" and not is_admin and not is_owner
        if is_staff_only:
            # Staff can manage candidate user: change password, toggle is_active, update contact/name/Refered_By
            updated_fields = []
            for key in ["is_active", "user_is_active", "account_active"]:
                if key in request.data:
                    val = request.data.get(key)
                    if isinstance(val, str):
                        obj.is_active = val.strip().lower() in ("true", "1", "yes")
                    elif isinstance(val, (bool, int)):
                        obj.is_active = bool(val)
                    updated_fields.append("is_active")
                    break

            raw_pwd = request.data.get("password")
            if raw_pwd is not None and str(raw_pwd).strip():
                obj.set_password(str(raw_pwd).strip())
                updated_fields.append("password")

            raw_contact = request.data.get("Contact") or request.data.get("user_contact")
            if raw_contact is not None and str(raw_contact).strip():
                clean_c = str(raw_contact).strip()
                if clean_c.isdigit() and len(clean_c) == 10 and obj.Contact != clean_c:
                    if not User.objects.filter(Contact=clean_c).exclude(pk=obj.pk).exists():
                        obj.Contact = clean_c
                        if obj.username and obj.username.isdigit():
                            obj.username = clean_c
                            updated_fields.append("username")
                        updated_fields.append("Contact")

            if "first_name" in request.data:
                obj.first_name = str(request.data.get("first_name", "")).strip()
                updated_fields.append("first_name")

            raw_ref = request.data.get("Refered_By") or request.data.get("refered_by")
            if raw_ref is not None and str(raw_ref).strip() != "":
                try:
                    obj.Refered_By = int(str(raw_ref).strip())
                    updated_fields.append("Refered_By")
                except (ValueError, TypeError):
                    pass

            if updated_fields:
                obj.save()
            return Response(UserSerializer(obj).data)

        serializer = UserSerializer(obj, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(User, pk=pk)
        is_owner = obj.pk == request.user.pk
        is_admin = request.user.is_staff or getattr(request.user, "Role", "") in ["admin", "superadmin"]
        staff_ref = get_user_staff_ref_code(request.user)
        is_referred_staff = (
            getattr(request.user, "Role", "") == "staff"
            and staff_ref
            and str(getattr(obj, "Refered_By", "")) == staff_ref
        )
        if not (is_owner or is_admin or is_referred_staff):
            return Response(
                {"error": "Permission denied. You can only update your own account or members referred by you."},
                status=status.HTTP_403_FORBIDDEN,
            )

        is_staff_only = getattr(request.user, "Role", "") == "staff" and not is_admin and not is_owner
        if is_staff_only:
            # Staff can manage candidate user: change password, toggle is_active, update contact/name
            updated_fields = []
            for key in ["is_active", "user_is_active", "account_active"]:
                if key in request.data:
                    val = request.data.get(key)
                    if isinstance(val, str):
                        obj.is_active = val.strip().lower() in ("true", "1", "yes")
                    elif isinstance(val, (bool, int)):
                        obj.is_active = bool(val)
                    updated_fields.append("is_active")
                    break

            raw_pwd = request.data.get("password")
            if raw_pwd is not None and str(raw_pwd).strip():
                obj.set_password(str(raw_pwd).strip())
                updated_fields.append("password")

            raw_contact = request.data.get("Contact") or request.data.get("user_contact")
            if raw_contact is not None and str(raw_contact).strip():
                clean_c = str(raw_contact).strip()
                if clean_c.isdigit() and len(clean_c) == 10 and obj.Contact != clean_c:
                    if not User.objects.filter(Contact=clean_c).exclude(pk=obj.pk).exists():
                        obj.Contact = clean_c
                        if obj.username and obj.username.isdigit():
                            obj.username = clean_c
                            updated_fields.append("username")
                        updated_fields.append("Contact")

            if updated_fields:
                obj.save()
            return Response(UserSerializer(obj).data)

        serializer = UserSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(User, pk=pk)
        obj.delete()

        return Response(
            {"message": "User deleted successfully"},
            status=status.HTTP_200_OK
        )


# =========================================================
# 5. USER DATA API
# =========================================================

class UserDataAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    SENSITIVE_PROFILE_FIELDS = (
        "WP_Contact",
        "WP_Contact_Relation",
        "Wp_Contact_Name",
        "Alt_Contact",
        "Alt_Contact_Relation",
        "Alt_Contact_Name",
        "Full_Address",
        "Email",
    )

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def _get_object(self, pk):
        # Look up by User_Data pk or associated User.id
        try:
            obj = User_Data.objects.filter(pk=pk).first()
        except (TypeError, ValueError):
            obj = None
        if not obj:
            obj = User_Data.objects.filter(User_id=pk).first()
        return obj

    def _has_active_membership(self, user):
        return has_active_membership(user)

    def _has_approved_connection(self, viewer, profile_owner):
        if not getattr(viewer, "is_authenticated", False):
            return False
        return Wish_List.objects.filter(
            Q(User_id=viewer, Wish_User_id=profile_owner)
            | Q(User_id=profile_owner, Wish_User_id=viewer),
            Status=Wish_List.STATUS_APPROVED,
        ).exists()

    def _serialize_profile(self, obj, request):
        data = UserDataSerializer(obj).data
        is_owner = (
            getattr(request.user, "is_authenticated", False)
            and obj.User_id_id == request.user.pk
        )
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
            )
        )
        staff_ref = get_user_staff_ref_code(request.user)
        is_referred_staff = (
            getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "Role", "") == "staff"
            and staff_ref
            and obj.User_id
            and str(getattr(obj.User_id, "Refered_By", "")) == staff_ref
        )

        is_staff_user = (
            getattr(request.user, "is_authenticated", False)
            and getattr(request.user, "Role", "") == "staff"
            and not is_admin
        )
        if is_staff_user:
            # Strictly restrict full address and contact details for staff
            can_view_sensitive_details = False
        elif is_owner or is_admin:
            can_view_sensitive_details = True
        else:
            viewer_data = (
                User_Data.objects.filter(User_id=request.user.pk).first()
                if getattr(request.user, "is_authenticated", False)
                else None
            )
            viewer_is_active = (viewer_data is not None and viewer_data.Active is not False)

            # Rule 1: If user's own profile is deactivated, cannot view contact/address details even if they have an active plan
            # Rule 2: If profile is active, can only view contact/address details if partner has approved their profile AND user has active plan
            if not viewer_is_active:
                can_view_sensitive_details = False
            else:
                has_approved = self._has_approved_connection(request.user, obj.User_id_id)
                has_plan = self._has_active_membership(request.user)
                can_view_sensitive_details = bool(has_approved and has_plan)

        if not can_view_sensitive_details:
            for field in self.SENSITIVE_PROFILE_FIELDS:
                data.pop(field, None)
        data["can_view_sensitive_details"] = can_view_sensitive_details

        if obj.User_id:
            u = obj.User_id
            u_contact = getattr(u, "Contact", None)
            u_username = u.username
            if not can_view_sensitive_details:
                u_contact = None
                if u_username and str(u_username).isdigit() and len(str(u_username)) == 10:
                    u_username = f"******{str(u_username)[-4:]}"
            data["user_account"] = {
                "id": str(u.id),
                "username": u_username,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "Contact": u_contact,
                "contact": u_contact,
                "is_active": bool(u.is_active),
                "Refered_By": getattr(u, "Refered_By", None),
                "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            }

        return data

    def get(self, request, pk=None):
        if pk is not None:
            obj = self._get_object(pk)
            if not obj:
                return Response(
                    {"error": "User data not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            today = timezone.localdate()
            is_owner = (
                getattr(request.user, "is_authenticated", False)
                and obj.User_id_id == request.user.pk
            )
            is_admin = (
                getattr(request.user, "is_authenticated", False)
                and (
                    getattr(request.user, "is_superuser", False)
                    or getattr(request.user, "is_staff", False)
                    or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
                )
            )
            staff_ref = get_user_staff_ref_code(request.user)
            is_referred_staff = (
                getattr(request.user, "is_authenticated", False)
                and getattr(request.user, "Role", "") == "staff"
                and staff_ref
                and obj.User_id
                and str(getattr(obj.User_id, "Refered_By", "")) == staff_ref
            )
            is_staff_user = getattr(request.user, "is_authenticated", False) and getattr(request.user, "Role", "") == "staff"
            is_privileged = is_owner or is_admin or is_referred_staff or is_staff_user

            if (obj.Active is False or (obj.User_id and obj.User_id.is_active is False)) and not is_privileged:
                return Response(
                    {"error": "This profile is currently deactivated / private."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if (not obj.Valid_Upto or obj.Valid_Upto < today) and not is_privileged:
                return Response(
                    {"error": "This profile membership is currently expired or has no active plan."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(self._serialize_profile(obj, request))

        refered_by = request.query_params.get("refered_by") or request.query_params.get("refered_By")
        user_id_param = request.query_params.get("user_id") or request.query_params.get("User_id")

        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        scope = request.query_params.get("scope") or request.query_params.get("all")

        today = timezone.localdate()
        valid_date_q = Q(Valid_Upto__isnull=False, Valid_Upto__gte=today)

        if user_id_param:
            objects = User_Data.objects.filter(User_id_id=user_id_param)
            is_self = (
                getattr(request.user, "is_authenticated", False)
                and str(request.user.pk) == str(user_id_param)
            )
            if not is_admin and not is_self:
                objects = objects.filter(Active=True, User_id__is_active=True).filter(valid_date_q)
        elif refered_by:
            try:
                ref_int = int(str(refered_by).strip())
                objects = User_Data.objects.filter(User_id__Refered_By=ref_int)
            except (ValueError, TypeError):
                objects = User_Data.objects.filter(User_id__Refered_By=refered_by)
            if not is_admin and getattr(request.user, "Role", "") != "staff":
                objects = objects.filter(Active=True, User_id__is_active=True).filter(valid_date_q)
        elif is_admin or scope in ["all", "admin", "global", "true"]:
            objects = User_Data.objects.all().order_by("-id")
        elif getattr(request.user, "is_authenticated", False) and user_role == "staff":
            staff_ref = get_user_staff_ref_code(request.user)
            if scope in ["all", "global", "true"]:
                objects = User_Data.objects.all().order_by("-id")
            elif staff_ref:
                try:
                    ref_int = int(str(staff_ref).strip())
                    objects = User_Data.objects.filter(User_id__Refered_By=ref_int).order_by("-id")
                except (ValueError, TypeError):
                    objects = User_Data.objects.filter(User_id__Refered_By=staff_ref).order_by("-id")
            else:
                objects = User_Data.objects.none()
        elif getattr(request.user, "is_authenticated", False):
            # User viewing candidate pool in user panel:
            # Must be Active=True, User_id__is_active=True, and Valid_Upto is not expired (>= today or null).
            # The logged-in user themselves is always included so they can view and manage their own profile.
            objects = User_Data.objects.filter(
                (Q(Active=True, User_id__is_active=True) & valid_date_q)
                | Q(User_id=request.user)
            ).order_by("-id")
        else:
            # Public / Anonymous viewer (HomePage)
            objects = User_Data.objects.filter(
                Q(Active=True, User_id__is_active=True) & valid_date_q
            ).order_by("-id")

        page = request.query_params.get("page")
        page_size_param = request.query_params.get("page_size")
        serialized_data = [self._serialize_profile(obj, request) for obj in objects]

        if page is not None or request.query_params.get("paginate") == "true":
            try:
                page_size = int(page_size_param) if page_size_param else 12
                if page_size < 10:
                    page_size = 10
                elif page_size > 15:
                    page_size = 15
            except (ValueError, TypeError):
                page_size = 12

            try:
                page_num = int(page) if page else 1
            except (ValueError, TypeError):
                page_num = 1

            from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
            paginator = Paginator(serialized_data, page_size)
            try:
                page_obj = paginator.page(page_num)
            except (EmptyPage, PageNotAnInteger):
                page_obj = paginator.page(1 if paginator.num_pages == 0 else min(page_num, paginator.num_pages))

            return Response({
                "count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "page_size": page_size,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous(),
                "results": list(page_obj.object_list),
            })

        return Response(serialized_data)

    def _normalize_user_data(self, request_data, existing_obj=None):
        if hasattr(request_data, "dict"):
            data = {}
            for k in request_data.keys():
                data[k] = request_data.get(k)
        elif hasattr(request_data, "copy"):
            data = request_data.copy()
        else:
            data = dict(request_data)
        field_map = {
            "active": "Active",
            "gender": "Gender",
            "caste": "Caste",
            "gotra": "Gotra",
            "firstname": "Full_Name",
            "first_name": "Full_Name",
            "full_name": "Full_Name",
            "contact": "WP_Contact",
            "wp_contact": "WP_Contact",
            "dob": "DOB",
            "age": "Age",
            "religion": "Religion",
            "district": "District",
            "state": "State",
            "city": "City",
            "country": "Country",
            "course": "Qualification",
            "qualification": "Qualification",
            "job_title": "Profession",
            "profession": "Profession",
            "job_type": "Job_type",
            "salary": "Salary",
            "father_name": "Father_name",
            "father_age": "Father_Age",
            "father_profession": "Father_Profession",
            "mother_name": "Mother_name",
            "mother_age": "Mother_Age",
            "mother_profession": "Mother_Profession",
            "marrige_status": "Marrige_status",
            "marriage_status": "Marrige_status",
            "manglik": "Manglik",
            "vegeterian": "Vegeterian",
            "vegetarian": "Vegeterian",
            "pic": "Profile_Pic",
            "profile_pic": "Profile_Pic",
            "full_address": "Full_Address",
            "alt_contact": "Alt_Contact",
            "alt_contact_name": "Alt_Contact_Name",
            "alt_contact_relation": "Alt_Contact_Relation",
            "wp_contact_name": "Wp_Contact_Name",
            "wp_contact_relation": "WP_Contact_Relation",
            "contact_relation": "WP_Contact_Relation",
            "mother_tongue": "Mother_tongue",
            "height": "Height",
            "weight": "Weight",
            "color": "Color",
            "body_color": "Color",
            "complexion": "Color",
            "skin_tone": "Color",
            "house": "House",
            "brothers": "Brothers",
            "brothers_marrige": "Brothers_marrige",
            "sisters": "Sisters",
            "sisters_marrige": "Sisters_marrige",
            "disability": "Disability",
            "nearestdist": "Nearestdist",
            "nearest_dist": "Nearestdist",
            "nearest_districts": "Nearestdist",
            "accept_profiles": "Accept_Profiles",
            "accept_castes": "Accept_Profiles",
            "valid_upto": "Valid_Upto",
            "validity": "Valid_Upto",
            "expiry_date": "Valid_Upto",
            "membership_expiry": "Valid_Upto",
            "membership_expiry_date": "Valid_Upto",
            "valid_until": "Valid_Upto",
            "valid_date": "Valid_Upto",
        }
        for src, dest in field_map.items():
            if src in data and dest not in data:
                data[dest] = data[src]

        # If WP_Contact_Relation is 'Self', take candidate's own name by default
        if data.get("WP_Contact_Relation") == "Self" and (not data.get("Wp_Contact_Name") or data.get("Wp_Contact_Name") in ("Self", "")):
            cand_name = data.get("Full_Name") or data.get("firstname") or ""
            if not cand_name and existing_obj:
                cand_name = getattr(existing_obj, "Full_Name", "") or ""
                if not cand_name and hasattr(existing_obj, "User_id") and existing_obj.User_id:
                    cand_name = getattr(existing_obj.User_id, "first_name", "") or getattr(existing_obj.User_id, "username", "")
            if cand_name:
                data["Wp_Contact_Name"] = str(cand_name).strip()

        if data.get("Alt_Contact_Relation") == "Self" and (not data.get("Alt_Contact_Name") or data.get("Alt_Contact_Name") in ("Self", "")):
            cand_name = data.get("Full_Name") or data.get("firstname") or ""
            if not cand_name and existing_obj:
                cand_name = getattr(existing_obj, "Full_Name", "") or ""
                if not cand_name and hasattr(existing_obj, "User_id") and existing_obj.User_id:
                    cand_name = getattr(existing_obj.User_id, "first_name", "") or getattr(existing_obj.User_id, "username", "")
            if cand_name:
                data["Alt_Contact_Name"] = str(cand_name).strip()

        json_fields = ("Nearestdist", "Accept_Profiles")
        for jf in json_fields:
            if jf in data:
                val = data[jf]
                if isinstance(val, str):
                    try:
                        data[jf] = json.loads(val)
                    except Exception:
                        try:
                            import ast
                            parsed = ast.literal_eval(val)
                            data[jf] = parsed if isinstance(parsed, (list, dict)) else [parsed]
                        except Exception:
                            if "," in val:
                                data[jf] = [x.strip() for x in val.split(",") if x.strip()]
                            elif val.strip():
                                data[jf] = [val.strip()]
                            else:
                                data[jf] = []
                elif not isinstance(val, (list, dict)) and val is not None:
                    data[jf] = [val]

        int_fields = ("Age", "Salary", "Father_Age", "Mother_Age", "Refer")
        for f in int_fields:
            if f in data:
                val = data[f]
                if val is None or val == "" or str(val).strip().lower() in ("none", "null", "undefined"):
                    data[f] = None
                else:
                    try:
                        data[f] = int(float(str(val).strip()))
                    except (ValueError, TypeError):
                        data[f] = None

        decimal_fields = ("Height", "Weight")
        for f in decimal_fields:
            if f in data:
                val = data[f]
                if val is None or val == "" or str(val).strip().lower() in ("none", "null", "undefined"):
                    data[f] = None
                else:
                    try:
                        data[f] = round(float(str(val).strip()), 2)
                    except (ValueError, TypeError):
                        data[f] = None

        bool_fields = ("Active", "Manglik", "Disability")
        for f in bool_fields:
            if f in data:
                val = data[f]
                if isinstance(val, str):
                    val_str = val.strip().lower()
                    if val_str in ("true", "1", "yes"):
                        data[f] = True
                    elif val_str in ("false", "0", "no"):
                        data[f] = False
                    elif val_str in ("", "none", "null", "undefined"):
                        data[f] = False if f in ("Manglik", "Disability") else True
                elif isinstance(val, (int, float)):
                    data[f] = bool(val)

        if "Valid_Upto" in data:
            vu_val = data["Valid_Upto"]
            if vu_val is None or vu_val == "" or str(vu_val).strip().lower() in ("none", "null", "undefined", ""):
                data["Valid_Upto"] = None
            elif isinstance(vu_val, str):
                v_str = vu_val.strip()
                if not v_str or v_str.lower() in ("none", "null", "undefined"):
                    data["Valid_Upto"] = None
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
                        data["Valid_Upto"] = parsed_dt.strftime("%Y-%m-%d")
                    else:
                        data["Valid_Upto"] = v_str

        return data

    def _check_and_award_staff_commission(self, user_data_obj, request):
        """
        When staff adds a user profile successfully, fetch amount details
        from Staff_Commission and add to Staff_Data.Amount.
        """
        try:
            if not user_data_obj or not user_data_obj.User_id:
                return

            candidate_user = user_data_obj.User_id

            # Determine the referring staff user
            staff_user = None
            if getattr(request.user, "is_authenticated", False) and str(getattr(request.user, "Role", "")).lower() == "staff":
                staff_user = request.user
            elif getattr(candidate_user, "Refered_By", None):
                try:
                    ref_code = int(candidate_user.Refered_By)
                    staff_user = User.objects.filter(Reference_Code=ref_code, Role="staff").first()
                except (ValueError, TypeError):
                    staff_user = None

            if not staff_user:
                return

            # Find staff profile in Staff_Data
            staff_profile = Staff_Data.objects.filter(Staff_id=staff_user.id).first()
            if not staff_profile:
                # If staff data is not present: no balance added anywhere, fallback to admin referral
                admin_ref = get_default_admin_reference_code()
                if admin_ref and candidate_user.Refered_By != admin_ref:
                    candidate_user.Refered_By = admin_ref
                    candidate_user.save(update_fields=["Refered_By"])
                return

            # When admin deactivates staff profile, DO NOT add commission to disabled staff profile
            if staff_profile.Active is False or not getattr(staff_profile, "is_approved", True):
                return

            # Check if commission has already been awarded for this candidate user to avoid double awarding
            comm_tag = f"Candidate #{candidate_user.id}"
            already_awarded = Staff_Transactions.objects.filter(
                Staff_id=staff_user,
                Type="Commission",
                Msg__icontains=comm_tag
            ).exists()

            if already_awarded:
                return

            # Get amount from Staff_Commission
            comm_rule = Staff_Commission.objects.filter(Active=True).order_by("-id").first()
            if not comm_rule or not comm_rule.Amount or comm_rule.Amount <= 0:
                return

            commission_amt = int(comm_rule.Amount)

            with transaction.atomic():
                # Re-fetch staff profile with lock
                locked_profile = Staff_Data.objects.select_for_update().filter(pk=staff_profile.pk).first()
                if locked_profile:
                    locked_profile.Amount = int(locked_profile.Amount or 0) + commission_amt
                    locked_profile.save(update_fields=["Amount"])

                    candidate_name = (
                        getattr(user_data_obj, "Full_Name", "")
                        or getattr(candidate_user, "first_name", "")
                        or getattr(candidate_user, "Contact", "")
                        or f"User #{candidate_user.id}"
                    )

                    Staff_Transactions.objects.create(
                        Staff_id=staff_user,
                        Amount=commission_amt,
                        Type="Commission",
                        Status="Success",
                        Msg=f"Commission for onboarding {comm_tag} ({candidate_name})"
                    )
        except Exception as e:
            # Commission crediting should never crash profile creation
            print(f"Error awarding staff commission: {e}")

    def post(self, request):
        if getattr(request.user, "is_authenticated", False) and str(getattr(request.user, "Role", "")).lower() == "staff":
            staff_prof = Staff_Data.objects.filter(Staff_id=request.user.id).first()
            if staff_prof and (staff_prof.Active is False or staff_prof.is_approved is False):
                return Response(
                    {"error": "Your staff account is pending admin approval. You cannot add members until approved."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            staff_ref = get_user_staff_ref_code(request.user)
            target_uid_check = request.data.get("User_id") or request.data.get("user_id")
            if target_uid_check and staff_ref:
                target_user = User.objects.filter(pk=target_uid_check).first()
                if target_user and str(getattr(target_user, "Refered_By", "")) != staff_ref:
                    return Response(
                        {"error": "Permission denied. Staff can only create or edit profiles for members referred by them."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

        norm_data = self._normalize_user_data(request.data)
        target_uid = norm_data.get("User_id")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if target_uid:
            existing = User_Data.objects.filter(User_id=target_uid).first()
            if existing:
                # Restrict caste modification: Once filled, non-admins cannot change it
                if not is_admin and existing.Caste and str(existing.Caste).strip():
                    norm_data["Caste"] = existing.Caste
                serializer = UserDataSerializer(existing, data=norm_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    self._check_and_award_staff_commission(serializer.instance, request)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserDataSerializer(data=norm_data)

        if serializer.is_valid():
            serializer.save()
            self._check_and_award_staff_commission(serializer.instance, request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _apply_user_account_updates(self, user_obj, request_data):
        if not user_obj:
            return False
        updated = False

        # 1. Password update
        raw_pwd = request_data.get("password") or request_data.get("new_password") or request_data.get("user_password")
        if raw_pwd is not None and str(raw_pwd).strip():
            user_obj.set_password(str(raw_pwd).strip())
            updated = True

        # 2. Account active status (deactivate / activate account)
        is_active_val = None
        for key in ["is_active", "user_is_active", "account_active"]:
            if key in request_data:
                val = request_data.get(key)
                if isinstance(val, str):
                    is_active_val = val.strip().lower() in ("true", "1", "yes")
                elif isinstance(val, (bool, int)):
                    is_active_val = bool(val)
                break
        if is_active_val is not None:
            user_obj.is_active = is_active_val
            updated = True

        # 3. Contact / Mobile number
        raw_contact = request_data.get("user_contact") or request_data.get("Contact")
        if raw_contact is not None and str(raw_contact).strip():
            clean_c = str(raw_contact).strip()
            if clean_c.isdigit() and len(clean_c) == 10 and user_obj.Contact != clean_c:
                if not User.objects.filter(Contact=clean_c).exclude(pk=user_obj.pk).exists():
                    user_obj.Contact = clean_c
                    if user_obj.username and user_obj.username.isdigit():
                        user_obj.username = clean_c
                    updated = True

        # 4. User first_name
        raw_name = request_data.get("first_name") or request_data.get("Full_Name") or request_data.get("firstname")
        if raw_name is not None and str(raw_name).strip():
            user_obj.first_name = str(raw_name).strip()[:30]
            updated = True

        # 5. User Refered_By
        raw_ref = request_data.get("Refered_By") or request_data.get("refered_by") or request_data.get("Refer") or request_data.get("refer")
        if raw_ref is not None and str(raw_ref).strip() != "":
            try:
                user_obj.Refered_By = int(str(raw_ref).strip())
                updated = True
            except (ValueError, TypeError):
                pass

        if updated:
            user_obj.save()
        return updated

    def put(self, request, pk):
        obj = self._get_object(pk)
        is_owner = obj and obj.User_id_id == request.user.pk
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        staff_ref = get_user_staff_ref_code(request.user)
        is_referred_staff = (
            user_role == "staff"
            and staff_ref
            and obj
            and obj.User_id
            and str(getattr(obj.User_id, "Refered_By", "")) == staff_ref
        )
        is_staff_user = user_role == "staff" and not is_admin
        if is_staff_user:
            if not is_referred_staff:
                return Response(
                    {"error": "Permission denied. Staff can only toggle status of candidates referred by them."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Staff can ONLY toggle Active status; staff cannot update candidate biodata!
            attempted_keys = set(request.data.keys()) - {"csrfmiddlewaretoken"}
            non_active_keys = [k for k in attempted_keys if k.lower() not in ["active"]]
            if non_active_keys:
                return Response(
                    {"error": "Permission denied. Staff cannot update candidate biodata. Staff can only activate or deactivate profiles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            norm_data = self._normalize_user_data(request.data, existing_obj=obj)
            if obj and "Active" in norm_data:
                obj.Active = bool(norm_data["Active"])
                obj.save(update_fields=["Active"])
                return Response(self._serialize_profile(obj, request))
            return Response(self._serialize_profile(obj, request) if obj else {})

        if obj and not (is_owner or is_admin):
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if obj and obj.User_id:
            self._apply_user_account_updates(obj.User_id, request.data)

        norm_data = self._normalize_user_data(request.data, existing_obj=obj)
        # Restrict caste modification: Once filled, non-admins cannot change it
        if obj and not is_admin and obj.Caste and str(obj.Caste).strip():
            norm_data["Caste"] = obj.Caste
        if not obj:
            # If profile does not exist yet for this user, create it
            if "User_id" not in norm_data:
                norm_data["User_id"] = pk
            serializer = UserDataSerializer(data=norm_data)
            if serializer.is_valid():
                serializer.save()
                self._check_and_award_staff_commission(serializer.instance, request)
                return Response(self._serialize_profile(serializer.instance, request), status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserDataSerializer(obj, data=norm_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            self._check_and_award_staff_commission(serializer.instance, request)
            return Response(self._serialize_profile(serializer.instance, request))

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response(
                {"error": "User data not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        is_owner = obj.User_id_id == request.user.pk
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        staff_ref = get_user_staff_ref_code(request.user)
        is_referred_staff = (
            user_role == "staff"
            and staff_ref
            and obj.User_id
            and str(getattr(obj.User_id, "Refered_By", "")) == staff_ref
        )
        is_staff_user = user_role == "staff" and not is_admin
        if is_staff_user:
            if not is_referred_staff:
                return Response(
                    {"error": "Permission denied. Staff can only toggle status of candidates referred by them."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Staff can ONLY toggle Active status; staff cannot update candidate biodata!
            attempted_keys = set(request.data.keys()) - {"csrfmiddlewaretoken"}
            non_active_keys = [k for k in attempted_keys if k.lower() not in ["active"]]
            if non_active_keys:
                return Response(
                    {"error": "Permission denied. Staff cannot update candidate biodata. Staff can only activate or deactivate profiles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            norm_data = self._normalize_user_data(request.data, existing_obj=obj)
            if "Active" in norm_data:
                obj.Active = bool(norm_data["Active"])
                obj.save(update_fields=["Active"])
                return Response(self._serialize_profile(obj, request))
            return Response(self._serialize_profile(obj, request))

        if not (is_owner or is_admin):
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if obj and obj.User_id:
            self._apply_user_account_updates(obj.User_id, request.data)

        norm_data = self._normalize_user_data(request.data, existing_obj=obj)
        # Restrict caste modification: Once filled, non-admins cannot change it
        if obj and not is_admin and obj.Caste and str(obj.Caste).strip():
            norm_data["Caste"] = obj.Caste
        serializer = UserDataSerializer(
            obj, data=norm_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            self._check_and_award_staff_commission(serializer.instance, request)
            return Response(self._serialize_profile(serializer.instance, request))

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response(
                {"error": "User data not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        obj.delete()

        return Response({"message": "User data deleted successfully"})


# =========================================================
# 6. USER TRANSACTIONS API
# =========================================================

class UserTransactionsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(User_Transactions, pk=pk)
            return Response(UserTransactionsSerializer(obj).data)

        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        user_id = request.query_params.get("user_id") or request.query_params.get("User_id")
        scope = request.query_params.get("scope") or request.query_params.get("all")

        if user_id:
            objects = User_Transactions.objects.filter(User_id=user_id).order_by("-Create_date", "-id")
        elif is_admin or scope in ["all", "admin", "global", "true"]:
            objects = User_Transactions.objects.all().order_by("-Create_date", "-id")
        else:
            objects = User_Transactions.objects.filter(User_id=request.user.id).order_by("-Create_date", "-id")

        page = request.query_params.get("page")
        page_size_param = request.query_params.get("page_size")
        if page is not None or request.query_params.get("paginate") == "true":
            try:
                page_size = int(page_size_param) if page_size_param else 10
                if page_size < 10:
                    page_size = 10
                elif page_size > 15:
                    page_size = 15
            except (ValueError, TypeError):
                page_size = 10

            try:
                page_num = int(page) if page else 1
            except (ValueError, TypeError):
                page_num = 1

            from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
            paginator = Paginator(objects, page_size)
            try:
                page_obj = paginator.page(page_num)
            except (EmptyPage, PageNotAnInteger):
                page_obj = paginator.page(1 if paginator.num_pages == 0 else min(page_num, paginator.num_pages))

            return Response({
                "count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "page_size": page_size,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous(),
                "results": UserTransactionsSerializer(page_obj.object_list, many=True).data,
            })

        return Response(
            UserTransactionsSerializer(objects, many=True).data
        )

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "user_id" in data and "User_id" not in data:
            data["User_id"] = data["user_id"]
        if "amount" in data and "Amount" not in data:
            data["Amount"] = data["amount"]
        if "plan" in data and "Plan" not in data:
            data["Plan"] = data["plan"]
        elif "type" in data and "Plan" not in data:
            data["Plan"] = data["type"]

        serializer = UserTransactionsSerializer(data=data)

        if serializer.is_valid():
            with transaction.atomic():
                txn = serializer.save()
                if str(txn.status).lower() in ["success", "approved"]:
                    update_user_membership_validity(
                        user_obj=txn.User_id,
                        plan_name=txn.Plan,
                        amount=txn.Amount,
                    )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(User_Transactions, pk=pk)
        serializer = UserTransactionsSerializer(obj, data=request.data)

        if serializer.is_valid():
            with transaction.atomic():
                txn = serializer.save()
                if str(txn.status).lower() in ["success", "approved"]:
                    update_user_membership_validity(
                        user_obj=txn.User_id,
                        plan_name=txn.Plan,
                        amount=txn.Amount,
                    )
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(User_Transactions, pk=pk)
        serializer = UserTransactionsSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            with transaction.atomic():
                txn = serializer.save()
                if str(txn.status).lower() in ["success", "approved"]:
                    update_user_membership_validity(
                        user_obj=txn.User_id,
                        plan_name=txn.Plan,
                        amount=txn.Amount,
                    )
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(User_Transactions, pk=pk)
        obj.delete()

        return Response({"message": "Transaction deleted successfully"})


# =========================================================
# 7. WISH LIST API
# =========================================================

class WishListAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Wish_List, pk=pk)
            if obj.User_id_id != request.user.pk and obj.Wish_User_id_id != request.user.pk:
                return Response(
                    {"detail": "You do not have access to this shortlist request."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(WishListSerializer(obj).data)

        # Admin and superadmin can view all wishlists / connection requests
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        if is_admin:
            objects = Wish_List.objects.all().order_by("-Create_date", "-id")
            return Response(WishListSerializer(objects, many=True).data)

        # A user may only view requests they created from this endpoint that are shortlisted.
        # Incoming and approved requests have dedicated, scoped endpoints below.
        objects = Wish_List.objects.filter(
            User_id=request.user,
            is_shortlisted=True,
        ).order_by("-Create_date", "-id")
        return Response(WishListSerializer(objects, many=True).data)

    def post(self, request):
        target_id = request.data.get("Wish_User_id") or request.data.get("wish_user_id")
        if not target_id:
            return Response(
                {"Wish_User_id": ["A partner profile is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = get_object_or_404(User, pk=target_id)
        if target_user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot shortlist your own profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wishlist, created = Wish_List.objects.get_or_create(
            User_id=request.user,
            Wish_User_id=target_user,
            defaults={
                "Status": Wish_List.STATUS_SHORTLISTED,
                "is_shortlisted": True,
            },
        )

        if not created:
            wishlist.is_shortlisted = True
            if wishlist.Status == Wish_List.STATUS_REJECTED:
                wishlist.Status = Wish_List.STATUS_SHORTLISTED
                wishlist.save(update_fields=["Status", "is_shortlisted"])
            else:
                wishlist.save(update_fields=["is_shortlisted"])

        return Response(
            WishListSerializer(wishlist).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        action = (
            request.query_params.get("action")
            or request.data.get("action")
            or ""
        ).strip().lower()

        with transaction.atomic():
            obj = get_object_or_404(
                Wish_List.objects.select_for_update(),
                Q(User_id=request.user) | Q(Wish_User_id=request.user),
                pk=pk,
            )
            u1_id = str(obj.User_id_id)
            u2_id = str(obj.Wish_User_id_id)

            # Check if this request is specifically to revoke / remove from approval
            if action in ("remove_approval", "disapprove", "disapproved", "revoke"):
                for uid, other_id in [(u1_id, u2_id), (u2_id, u1_id)]:
                    udata = User_Data.objects.filter(User_id_id=uid).select_for_update().first()
                    if udata and udata.Accept_Profiles:
                        cleaned = [p for p in udata.Accept_Profiles if str(p) != other_id]
                        if len(cleaned) != len(udata.Accept_Profiles):
                            udata.Accept_Profiles = cleaned
                            udata.save(update_fields=["Accept_Profiles"])
                obj.Status = Wish_List.STATUS_REJECTED
                obj.save(update_fields=["Status"])
                return Response({
                    "message": "Connection approval removed successfully.",
                    "Status": Wish_List.STATUS_REJECTED,
                })

            # When unsorting (removing from shortlist) an approved profile,
            # DO NOT remove from approval section: keep Status=Approved and Accept_Profiles intact!
            if obj.Status == Wish_List.STATUS_APPROVED:
                obj.is_shortlisted = False
                obj.save(update_fields=["is_shortlisted"])
                return Response({
                    "message": "Profile removed from shortlist successfully. Approved connection preserved.",
                    "Status": Wish_List.STATUS_APPROVED,
                    "is_shortlisted": False,
                })

            # When unsorting a pending request, preserve the pending connection
            if obj.Status == Wish_List.STATUS_PENDING:
                obj.is_shortlisted = False
                obj.save(update_fields=["is_shortlisted"])
                return Response({
                    "message": "Profile removed from shortlist.",
                    "Status": Wish_List.STATUS_PENDING,
                    "is_shortlisted": False,
                })

            # Otherwise (purely shortlisted or rejected profile):
            obj.delete()

        return Response({"message": "Wish list item deleted successfully"})


class WishListRequestAPIView(APIView):
    """Send an approval request for a profile the user has already shortlisted."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        profile = User_Data.objects.filter(User_id=request.user).first()
        if profile and profile.Active is False:
            return Response(
                {"detail": "Your profile is currently deactivated. Please activate your profile in Profile Settings to send connection requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not has_active_membership(request.user):
            return Response(
                {"detail": "An active membership is required to send a profile request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Look up existing wishlist item by pk, or fallback to target candidate ID
        obj = Wish_List.objects.filter(pk=pk, User_id=request.user).first()
        if not obj:
            # Fallback 1: pk was candidate's User ID
            obj = Wish_List.objects.filter(User_id=request.user, Wish_User_id_id=pk).first()
        if not obj:
            # Fallback 2: pk was reverse connection where other user initiated
            obj = Wish_List.objects.filter(pk=pk, Wish_User_id=request.user).first()
        if not obj:
            # Fallback 3: if candidate user exists, create or get Wish_List record
            target_user = User.objects.filter(pk=pk).first()
            if target_user and target_user.pk != request.user.pk:
                obj, _ = Wish_List.objects.get_or_create(
                    User_id=request.user,
                    Wish_User_id=target_user,
                    defaults={"Status": Wish_List.STATUS_PENDING, "is_shortlisted": True},
                )
        if not obj:
            return Response(
                {"detail": "Candidate connection request could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if obj.Status == Wish_List.STATUS_APPROVED:
            return Response(
                {"detail": "This profile request has already been approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if obj.Status == Wish_List.STATUS_PENDING:
            return Response(WishListSerializer(obj).data)

        obj.Status = Wish_List.STATUS_PENDING
        obj.save(update_fields=["Status"])
        notify_partner_request_async(request.user.pk, obj.Wish_User_id.pk)
        return Response(WishListSerializer(obj).data)


class DirectProfileRequestAPIView(APIView):
    """Send a profile request directly for members with an active subscription."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = User_Data.objects.filter(User_id=request.user).first()
        if profile and profile.Active is False:
            return Response(
                {"detail": "Your profile is currently deactivated. Please activate your profile in Profile Settings to send connection requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not has_active_membership(request.user):
            return Response(
                {"detail": "An active membership is required to send a profile request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_id = request.data.get("Wish_User_id") or request.data.get("wish_user_id")
        if not target_id:
            return Response(
                {"Wish_User_id": ["A partner profile is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = get_object_or_404(User, pk=target_id)
        if target_user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot send a profile request to yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wishlist, created = Wish_List.objects.get_or_create(
            User_id=request.user,
            Wish_User_id=target_user,
            defaults={"Status": Wish_List.STATUS_PENDING},
        )

        if not created and wishlist.Status not in (
            Wish_List.STATUS_PENDING,
            Wish_List.STATUS_APPROVED,
        ):
            wishlist.Status = Wish_List.STATUS_PENDING
            wishlist.save(update_fields=["Status"])

        if created or wishlist.Status == Wish_List.STATUS_PENDING:
            notify_partner_request_async(request.user.pk, target_user.pk)

        return Response(
            WishListSerializer(wishlist).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class IncomingWishListAPIView(APIView):
    """Pending shortlist requests addressed to the authenticated user."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        objects = Wish_List.objects.filter(
            Wish_User_id=request.user,
            Status=Wish_List.STATUS_PENDING,
        ).order_by("-Create_date", "-id")
        return Response(WishListSerializer(objects, many=True).data)


class ApprovedWishListAPIView(APIView):
    """Approved profile connections for the authenticated user."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        objects = Wish_List.objects.filter(
            Q(User_id=request.user) | Q(Wish_User_id=request.user),
            Status=Wish_List.STATUS_APPROVED,
        ).order_by("-Create_date", "-id")
        return Response(WishListSerializer(objects, many=True).data)


class WishListResponseAPIView(APIView):
    """Allow partner to approve or reject a pending request, or revoke/disapprove an approved connection."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        requested_status = str(
            request.data.get("Status") or request.data.get("status") or ""
        ).strip().lower()
        status_map = {
            "approved": Wish_List.STATUS_APPROVED,
            "approve": Wish_List.STATUS_APPROVED,
            "rejected": Wish_List.STATUS_REJECTED,
            "reject": Wish_List.STATUS_REJECTED,
            "disapproved": Wish_List.STATUS_REJECTED,
            "disapprove": Wish_List.STATUS_REJECTED,
            "remove_approval": Wish_List.STATUS_REJECTED,
            "remove approve": Wish_List.STATUS_REJECTED,
        }
        new_status = status_map.get(requested_status)

        if not new_status:
            return Response(
                {"Status": ["Choose either Approved or Rejected / Disapproved."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            obj = get_object_or_404(
                Wish_List.objects.select_for_update(),
                Q(Wish_User_id=request.user) | Q(User_id=request.user),
                pk=pk,
            )

            # If request is pending, only the recipient (Wish_User_id) can approve or reject
            if obj.Status == Wish_List.STATUS_PENDING:
                if obj.Wish_User_id != request.user:
                    return Response(
                        {"detail": "Only the recipient can respond to a pending request."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            elif obj.Status == Wish_List.STATUS_APPROVED:
                # If already approved, revoking/disapproving (new_status == STATUS_REJECTED) is allowed
                if new_status != Wish_List.STATUS_REJECTED:
                    return Response(
                        {"detail": "This profile connection has already been approved."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            elif obj.Status == Wish_List.STATUS_REJECTED:
                if new_status == Wish_List.STATUS_REJECTED:
                    return Response(
                        {"detail": "This profile request is already rejected / disapproved."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return Response(
                        {"detail": "A rejected profile request cannot be approved directly. Please send a new request."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"detail": "This shortlist profile has not been sent as a request yet."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            obj.Status = new_status
            obj.save(update_fields=["Status"])

            u1_id = str(obj.User_id_id)
            u2_id = str(obj.Wish_User_id_id)

            if new_status == Wish_List.STATUS_APPROVED:
                # The approving partner retains the requester ID on their profile.
                partner_data, _ = User_Data.objects.select_for_update().get_or_create(
                    User_id=request.user,
                    defaults={"Accept_Profiles": []},
                )
                accepted_profiles = list(partner_data.Accept_Profiles or [])
                requester_id = u1_id
                if not any(str(profile_id) == requester_id for profile_id in accepted_profiles):
                    accepted_profiles.append(requester_id)
                    partner_data.Accept_Profiles = accepted_profiles
                    partner_data.save(update_fields=["Accept_Profiles"])
            elif new_status == Wish_List.STATUS_REJECTED:
                # Disapprove / Revoke: remove both users from each other's Accept_Profiles atomically
                for uid, other_id in [(u1_id, u2_id), (u2_id, u1_id)]:
                    udata = User_Data.objects.filter(User_id_id=uid).select_for_update().first()
                    if udata and udata.Accept_Profiles:
                        cleaned = [p for p in udata.Accept_Profiles if str(p) != other_id]
                        if len(cleaned) != len(udata.Accept_Profiles):
                            udata.Accept_Profiles = cleaned
                            udata.save(update_fields=["Accept_Profiles"])

        return Response(WishListSerializer(obj).data)


# =========================================================
# 8. STAFF DATA API
# =========================================================

class StaffDataAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            if str(pk).lower() == "me":
                obj = Staff_Data.objects.filter(Staff_id=request.user.id).first()
                if not obj:
                    return Response({"detail": "Staff profile not found"}, status=status.HTTP_404_NOT_FOUND)
                return Response(StaffDataSerializer(obj).data)
            obj = get_object_or_404(Staff_Data, pk=pk)
            return Response(StaffDataSerializer(obj).data)

        staff_id = request.query_params.get("Staff_id") or request.query_params.get("staff_id")
        if staff_id:
            objects = Staff_Data.objects.filter(Staff_id=staff_id)
            return Response(StaffDataSerializer(objects, many=True).data)

        # Non-admin staff should see their own profile
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        if user_role == "staff" and not is_admin:
            objects = Staff_Data.objects.filter(Staff_id=request.user.id)
            return Response(StaffDataSerializer(objects, many=True).data)

        objects = Staff_Data.objects.all().order_by("-id")
        return Response(StaffDataSerializer(objects, many=True).data)

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "Staff_id" not in data or not data["Staff_id"]:
            data["Staff_id"] = request.user.id

        # Staff cannot self-approve on creation; only admin can
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        if not is_admin:
            data["is_approved"] = False

        # If profile already exists for this staff member, update it instead
        existing_profile = Staff_Data.objects.filter(Staff_id=data["Staff_id"]).first()
        if existing_profile:
            if not is_admin:
                data["Active"] = False
                data["is_approved"] = False
            serializer = StaffDataSerializer(existing_profile, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = StaffDataSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        if str(pk).lower() == "me":
            obj = get_object_or_404(Staff_Data, Staff_id=request.user.id)
        else:
            obj = get_object_or_404(Staff_Data, pk=pk)

        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        if not is_admin and obj.Staff_id_id != request.user.id:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        # When staff updates their profile, automatically set Active=False (disabled) and is_approved=False
        if not is_admin:
            data["Active"] = False
            data["is_approved"] = False

        serializer = StaffDataSerializer(obj, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = get_object_or_404(Staff_Data, pk=pk)
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        if not is_admin and obj.Staff_id_id != request.user.id:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        obj.delete()

        return Response({"message": "Staff data deleted successfully"})


# =========================================================
# 9. STAFF TRANSACTIONS API
# =========================================================

class StaffTransactionsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Staff_Transactions, pk=pk)
            return Response(StaffTransactionsSerializer(obj).data)

        staff_id = request.query_params.get("staff_id") or request.query_params.get("Staff_id")
        objects = Staff_Transactions.objects.all()
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        if not is_admin:
            objects = objects.filter(Staff_id=request.user)
        elif staff_id and str(staff_id).strip().lower() not in ["", "none", "null", "undefined", "nan", "all"]:
            try:
                objects = objects.filter(Staff_id_id=int(staff_id))
            except (ValueError, TypeError):
                pass

        objects = objects.order_by("-id")
        return Response(
            StaffTransactionsSerializer(objects, many=True).data
        )

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "Staff_id" not in data or not data["Staff_id"]:
            data["Staff_id"] = request.user.pk

        tx_type = str(data.get("Type") or "Withdrawal").capitalize()
        data["Type"] = tx_type

        # Handle withdrawal from wallet balance
        if tx_type == "Withdrawal":
            try:
                amt = int(data.get("Amount", 0))
            except (ValueError, TypeError):
                return Response(
                    {"error": "Please enter a valid numeric withdrawal amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if amt <= 0:
                return Response(
                    {"error": "Withdrawal amount must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            staff_user = User.objects.filter(pk=data["Staff_id"]).first()
            if not staff_user:
                return Response(
                    {"error": "Staff user account not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            staff_profile = Staff_Data.objects.filter(Staff_id=staff_user.id).first()
            if not staff_profile:
                return Response(
                    {"error": "Staff profile not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if staff_profile.Active is False:
                return Response(
                    {"error": "Your staff account has been deactivated by Admin. Withdrawals are disabled."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not getattr(staff_profile, "is_approved", True):
                return Response(
                    {"error": "Your staff account is pending admin approval. Withdrawals are disabled."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            current_wallet = int(staff_profile.Amount or 0)
            if current_wallet < amt:
                return Response(
                    {
                        "error": f"Insufficient wallet balance. Available: ₹{current_wallet}, Requested: ₹{amt}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Deduct wallet balance from Staff_Data atomically
            staff_profile.Amount = current_wallet - amt
            staff_profile.save(update_fields=["Amount"])
            data["Status"] = data.get("Status") or "Pending"
            if not data.get("Msg"):
                data["Msg"] = f"Withdrawal request of ₹{amt} submitted to Admin."

        serializer = StaffTransactionsSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            resp_data = serializer.data
            refreshed_profile = Staff_Data.objects.filter(Staff_id=data["Staff_id"]).first()
            resp_data["remaining_amount"] = refreshed_profile.Amount if refreshed_profile else 0
            return Response(resp_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self._update_transaction(request, pk, partial=True)

    def patch(self, request, pk):
        return self._update_transaction(request, pk, partial=True)

    def _update_transaction(self, request, pk, partial=True):
        obj = get_object_or_404(Staff_Transactions, pk=pk)
        old_status = obj.Status
        old_type = obj.Type

        is_admin_user = (
            getattr(request.user, "is_superuser", False) or
            getattr(request.user, "is_staff", False) or
            str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )

        new_status = request.data.get("Status")
        if new_status and new_status != old_status and not is_admin_user:
            return Response(
                {"error": "Only administrators can approve or reject withdrawal requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # Fallback to existing model fields if omitted in partial update
        if "Staff_id" not in data or not data["Staff_id"]:
            data["Staff_id"] = str(getattr(obj.Staff_id, "pk", obj.Staff_id_id or ""))
        if "Amount" not in data or data["Amount"] is None:
            data["Amount"] = obj.Amount
        if "Type" not in data or not data["Type"]:
            data["Type"] = obj.Type

        serializer = StaffTransactionsSerializer(obj, data=data, partial=True)
        if serializer.is_valid():
            updated_obj = serializer.save()
            new_status = updated_obj.Status
            new_type = updated_obj.Type

            # Handle refund/deduct on status change for withdrawal
            if old_type == "Withdrawal" or new_type == "Withdrawal":
                staff_user_id = updated_obj.Staff_id_id or getattr(updated_obj.Staff_id, "pk", None)
                staff_profile = Staff_Data.objects.filter(Staff_id=staff_user_id).first()
                if not staff_profile and staff_user_id:
                    staff_profile = Staff_Data.objects.filter(Staff_id_id=staff_user_id).first()

                if staff_profile:
                    # If rejected by admin, return amount back to staff account!
                    if old_status in ["Pending", "Approved", "Success"] and new_status in ["Rejected", "Failed"]:
                        staff_profile.Amount = (staff_profile.Amount or 0) + updated_obj.Amount
                        staff_profile.save(update_fields=["Amount"])
                    # If previously rejected and now re-approved, deduct from staff account
                    elif old_status in ["Rejected", "Failed"] and new_status in ["Pending", "Approved", "Success"]:
                        staff_profile.Amount = max(0, (staff_profile.Amount or 0) - updated_obj.Amount)
                        staff_profile.save(update_fields=["Amount"])

            staff_user_id = updated_obj.Staff_id_id or getattr(updated_obj.Staff_id, "pk", None)
            refreshed_profile = Staff_Data.objects.filter(Staff_id=staff_user_id).first()
            if not refreshed_profile and staff_user_id:
                refreshed_profile = Staff_Data.objects.filter(Staff_id_id=staff_user_id).first()

            resp_data = StaffTransactionsSerializer(updated_obj).data
            resp_data["remaining_amount"] = refreshed_profile.Amount if refreshed_profile else 0
            return Response(resp_data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Staff_Transactions, pk=pk)
        obj.delete()

        return Response({"message": "Staff transaction deleted successfully"})


# =========================================================
# 9.1 STAFF COMMISSION API
# =========================================================

class StaffCommissionAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Staff_Commission, pk=pk)
            return Response(StaffCommissionSerializer(obj).data)
        active_only = request.query_params.get("active")
        objects = Staff_Commission.objects.all().order_by("-id")
        if active_only in ["true", "1"]:
            objects = objects.filter(Active=True)
        return Response(StaffCommissionSerializer(objects, many=True).data)

    def post(self, request):
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        if not is_admin:
            return Response({"error": "Admin access required to set commission rules."}, status=status.HTTP_403_FORBIDDEN)

        serializer = StaffCommissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
        )
        if not is_admin:
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        obj = get_object_or_404(Staff_Commission, pk=pk)
        serializer = StaffCommissionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# =========================================================
# 10. SERVICE USER API
# =========================================================

class ServiceDataAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Service_Data, pk=pk)
            today = timezone.localdate()
            user_role = str(getattr(request.user, "Role", "") or "").lower()
            is_admin_or_staff = (
                getattr(request.user, "is_authenticated", False)
                and (
                    getattr(request.user, "is_staff", False)
                    or getattr(request.user, "is_superuser", False)
                    or user_role in ["admin", "superadmin"]
                )
            )
            is_owner = (
                getattr(request.user, "is_authenticated", False)
                and obj.Service_id_id == request.user.pk
            )
            is_valid = (
                obj.Active is True
                and obj.Admin_Approval is True
                and obj.Valid_Upto is not None
                and obj.Valid_Upto >= today
            )
            if not is_valid and not (is_admin_or_staff or is_owner):
                return Response(
                    {"error": "This wedding service is inactive, expired, or pending administrator approval."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(ServiceDataSerializer(obj).data)

        objects = Service_Data.objects.all().order_by("-id")
        service_id = (
            request.query_params.get("Service_id")
            or request.query_params.get("service_id")
            or request.query_params.get("User_id")
            or request.query_params.get("user_id")
        )
        scope = request.query_params.get("scope") or request.query_params.get("all")
        active_only = request.query_params.get("active_only")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_authenticated = bool(getattr(request.user, "is_authenticated", False))
        is_admin_or_staff = (
            is_authenticated
            and (
                getattr(request.user, "is_staff", False)
                or getattr(request.user, "is_superuser", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        is_service_user = is_authenticated and user_role == "service"
        target_service_id = service_id or (str(request.user.pk) if (is_service_user and scope in ["service_panel", "owner", None, ""]) else None)

        # Enforce business rules in backend:
        # 1. Admin/Staff requesting records: return all (active, deactivated, pending, expired)
        if is_admin_or_staff and not (active_only in ["true", "1"]):
            if target_service_id:
                objects = objects.filter(Service_id=target_service_id)
        # 2. Specific vendor lookup by Admin/Staff, or Service User querying their own services:
        # Service users must see their deactivated, pending approval, and expired services in their Service Panel
        elif target_service_id and (is_admin_or_staff or (is_authenticated and str(request.user.pk) == str(target_service_id))):
            objects = objects.filter(Service_id=target_service_id)
            if active_only in ["true", "1"]:
                today = timezone.localdate()
                objects = objects.filter(
                    Active=True,
                    Admin_Approval=True,
                    Valid_Upto__isnull=False,
                    Valid_Upto__gte=today,
                )
        # 3. Authenticated service user querying without explicit service_id:
        elif is_service_user and (not active_only or active_only in ["false", "0"]):
            objects = objects.filter(Service_id=request.user.pk)
        # 4. Public catalog / matrimonial user search / homepage:
        # Strictly require: Active=True, Admin_Approval=True, Valid_Upto is NOT null, and Valid_Upto >= today (not exited)
        else:
            today = timezone.localdate()
            active_service_types = set(
                Services.objects.filter(Active=True).values_list("Service_Type", flat=True)
            ) | set(
                Services.objects.filter(Active=True).values_list("Service_Name", flat=True)
            )

            # Strictly require: Active=True, Admin_Approval=True, Valid_Upto is NOT null, and Valid_Upto >= today (not exited)
            objects = objects.filter(
                Active=True,
                Admin_Approval=True,
                Valid_Upto__isnull=False,
                Valid_Upto__gte=today,
            )

            if active_service_types:
                objects = objects.filter(
                    Q(Service_Type__in=active_service_types) | Q(Service_Name__in=active_service_types)
                )
            else:
                objects = objects.none()

        service_type = request.query_params.get("service_type")
        if service_type and service_type.strip() and service_type.lower() != "all":
            objects = objects.filter(
                Q(Service_Type__iexact=service_type) | Q(Service_Name__icontains=service_type)
            )

        district = request.query_params.get("district")
        if district and district.strip() and district.lower() != "all":
            objects = objects.filter(
                Q(District__iexact=district)
                | Q(City__iexact=district)
                | Q(Full_Address__icontains=district)
                | Q(Available_Zone__icontains=district)
            )

        state_param = request.query_params.get("state")
        if state_param and state_param.strip() and state_param.lower() != "all":
            objects = objects.filter(
                Q(State__iexact=state_param) | Q(Full_Address__icontains=state_param)
            )

        return Response(ServiceDataSerializer(objects, many=True).data)

    def post(self, request):
        with transaction.atomic():
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            if 'Admin_Approval' in data:
                data['Admin_Approval'] = str(data['Admin_Approval']).lower() in ('true', '1')
            elif not (
                getattr(request.user, "is_staff", False)
                or getattr(request.user, "is_superuser", False)
                or str(getattr(request.user, "Role", "")).lower() in ["admin", "superadmin"]
            ):
                data['Admin_Approval'] = False
            if 'Active' in data:
                data['Active'] = str(data['Active']).lower() in ('true', '1')
            serializer = ServiceDataSerializer(data=data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Data, pk=pk)
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            if 'Active' in data:
                data['Active'] = str(data['Active']).lower() in ('true', '1')
            if 'Admin_Approval' in data:
                data['Admin_Approval'] = str(data['Admin_Approval']).lower() in ('true', '1')
            serializer = ServiceDataSerializer(obj, data=data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Data, pk=pk)
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            if 'Active' in data:
                data['Active'] = str(data['Active']).lower() in ('true', '1')
            if 'Admin_Approval' in data:
                data['Admin_Approval'] = str(data['Admin_Approval']).lower() in ('true', '1')
            serializer = ServiceDataSerializer(
                obj, data=data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Data, pk=pk)
            obj.delete()

            return Response({"message": "Service data deleted successfully"})


# Backwards compatibility alias
ServiceUserAPIView = ServiceDataAPIView


# =========================================================
# 11. SERVICE TRANSACTIONS API
# =========================================================

class ServiceTransactionsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Service_Transactions, pk=pk)
            return Response(ServiceTransactionsSerializer(obj).data)

        objects = Service_Transactions.objects.all().select_related("Service_id", "User_id")
        service_id = request.query_params.get("Service_id") or request.query_params.get("service_id")
        user_id = request.query_params.get("User_id") or request.query_params.get("user_id")
        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or user_role in ["admin", "superadmin"]
        )
        if service_id:
            objects = objects.filter(Service_id=service_id)
        if user_id:
            objects = objects.filter(User_id=user_id)
        if not is_admin and scope not in ["all", "admin", "global", "true"]:
            objects = objects.filter(User_id=request.user)
        return Response(
            ServiceTransactionsSerializer(objects.order_by("-id"), many=True).data
        )

    def post(self, request):
        with transaction.atomic():
            serializer = ServiceTransactionsSerializer(data=request.data)

            if serializer.is_valid():
                tx = serializer.save()
                # Atomically update Service_Data if Valid_Upto provided
                valid_upto = request.data.get("Valid_Upto")
                if valid_upto and tx.Service_id:
                    service_obj = tx.Service_id
                    service_obj.Valid_Upto = valid_upto
                    service_obj.Active = True
                    service_obj.save()
                return Response(ServiceTransactionsSerializer(tx).data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Transactions, pk=pk)
            serializer = ServiceTransactionsSerializer(obj, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Transactions, pk=pk)
            serializer = ServiceTransactionsSerializer(
                obj, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        with transaction.atomic():
            obj = get_object_or_404(Service_Transactions, pk=pk)
            obj.delete()

            return Response({"message": "Service transaction deleted successfully"})


# =========================================================
# 12. SERVICES API
# =========================================================

class ServicesAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Services, pk=pk)
            return Response(ServicesSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Services.objects.all().order_by("id")
        else:
            objects = Services.objects.filter(Active=True).order_by("id")
        return Response(ServicesSerializer(objects, many=True).data)

    def post(self, request):
        serializer = ServicesSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Services, pk=pk)
        serializer = ServicesSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Services, pk=pk)
        serializer = ServicesSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Services, pk=pk)
        obj.delete()

        return Response({"message": "Service deleted successfully"})


# =========================================================
# 13. SERVICE CHARGE API
# =========================================================

class ServiceChargeAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Service_Charge, pk=pk)
            return Response(ServiceChargeSerializer(obj).data)

        objects = Service_Charge.objects.all()
        return Response(ServiceChargeSerializer(objects, many=True).data)

    def post(self, request):
        serializer = ServiceChargeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Service_Charge, pk=pk)
        serializer = ServiceChargeSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Service_Charge, pk=pk)
        serializer = ServiceChargeSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Service_Charge, pk=pk)
        obj.delete()

        return Response({"message": "Service charge deleted successfully"})


# =========================================================
# 14. STATES WITH DISTRICTS API
# =========================================================

class StatesWithDistrictsAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(States_With_Districts, pk=pk)
            return Response(StatesWithDistrictsSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = States_With_Districts.objects.all().order_by("State")
        else:
            objects = States_With_Districts.objects.filter(Active=True).order_by("State")

        return Response(
            StatesWithDistrictsSerializer(objects, many=True).data
        )

    def post(self, request):
        serializer = StatesWithDistrictsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(States_With_Districts, pk=pk)
        serializer = StatesWithDistrictsSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(States_With_Districts, pk=pk)
        serializer = StatesWithDistrictsSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(States_With_Districts, pk=pk)
        obj.delete()

        return Response({"message": "State/district record deleted successfully"})


# =========================================================
# 15. NEAR DISTRICT API
# =========================================================

class NearDistAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(NearDist, pk=pk)
            return Response(NearDistSerializer(obj).data)

        district = request.query_params.get("district")
        state = request.query_params.get("state")
        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = NearDist.objects.all()
        else:
            active_states = States_With_Districts.objects.filter(Active=True).values_list("State", flat=True)
            objects = NearDist.objects.filter(Active=True).filter(State__in=active_states)

        if state and state.strip():
            objects = objects.filter(State__iexact=state.strip())
        if district and district.strip():
            objects = objects.filter(District__iexact=district.strip())
        return Response(NearDistSerializer(objects, many=True).data)

    def post(self, request):
        serializer = NearDistSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(NearDist, pk=pk)
        serializer = NearDistSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(NearDist, pk=pk)
        serializer = NearDistSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(NearDist, pk=pk)
        obj.delete()

        return Response({"message": "Near district record deleted successfully"})


# =========================================================
# 16. PLANS API
# =========================================================

class PlansAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Plans, pk=pk)
            return Response(PlansSerializer(obj).data)

        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        scope = request.query_params.get("scope") or request.query_params.get("all")
        include_inactive = request.query_params.get("include_inactive")

        if is_admin or scope in ["all", "admin", "global", "true"] or str(include_inactive).lower() in ["true", "1"]:
            objects = Plans.objects.all().order_by("Amount")
        else:
            objects = Plans.objects.filter(Active=True).order_by("Amount")

        return Response(PlansSerializer(objects, many=True).data)

    def post(self, request):
        serializer = PlansSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Plans, pk=pk)
        serializer = PlansSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Plans, pk=pk)
        serializer = PlansSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Plans, pk=pk)
        obj.delete()

        return Response({"message": "Plan deleted successfully"})


# =========================================================
# 17. SUCCESS STORY API
# =========================================================

class SuccessStoryAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Success_Story, pk=pk)
            return Response(SuccessStorySerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Success_Story.objects.all().order_by("-Success_id")
        else:
            objects = Success_Story.objects.filter(Active=True).order_by("-Success_id")

        return Response(SuccessStorySerializer(objects, many=True).data)

    def post(self, request):
        serializer = SuccessStorySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Success_Story, pk=pk)
        serializer = SuccessStorySerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Success_Story, pk=pk)
        serializer = SuccessStorySerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Success_Story, pk=pk)
        obj.delete()

        return Response({"message": "Success story deleted successfully"})


# =========================================================
# 18. PROFESSION API
# =========================================================

class ProfessionAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Profession, pk=pk)
            return Response(ProfessionSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Profession.objects.all().order_by("Profession_Name")
        else:
            objects = Profession.objects.filter(Active=True).order_by("Profession_Name")

        return Response(ProfessionSerializer(objects, many=True).data)

    def post(self, request):
        serializer = ProfessionSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Profession, pk=pk)
        serializer = ProfessionSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Profession, pk=pk)
        serializer = ProfessionSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Profession, pk=pk)
        obj.delete()

        return Response({"message": "Profession deleted successfully"})


# =========================================================
# 19. RELIGION API
# =========================================================

class ReligionAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Religion, pk=pk)
            return Response(ReligionSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Religion.objects.all().order_by("Religion_Name")
        else:
            objects = Religion.objects.filter(Active=True).order_by("Religion_Name")

        return Response(ReligionSerializer(objects, many=True).data)

    def post(self, request):
        serializer = ReligionSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Religion, pk=pk)
        serializer = ReligionSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Religion, pk=pk)
        serializer = ReligionSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Religion, pk=pk)
        obj.delete()

        return Response({"message": "Religion deleted successfully"})


# =========================================================
# 20. CASTE API
# =========================================================

class CasteAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Caste, pk=pk)
            return Response(CasteSerializer(obj).data)

        state_param = request.query_params.get("state") or request.query_params.get("State")
        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Caste.objects.all().order_by("State")
            if state_param:
                objects = objects.filter(State__iexact=state_param.strip())
        else:
            # Strictly active castes AND strictly active states for public / homepage:
            active_states = States_With_Districts.objects.filter(Active=True).values_list("State", flat=True)
            objects = Caste.objects.filter(Active=True).filter(State__in=active_states).order_by("State")
            if state_param:
                objects = objects.filter(State__iexact=state_param.strip())

        return Response(CasteSerializer(objects, many=True).data)

    def post(self, request):
        serializer = CasteSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Caste, pk=pk)
        serializer = CasteSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Caste, pk=pk)
        serializer = CasteSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Caste, pk=pk)
        obj.delete()

        return Response({"message": "Caste deleted successfully"})


# =========================================================
# 21. LANGUAGE API
# =========================================================

class LanguageAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Language, pk=pk)
            return Response(LanguageSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Language.objects.all().order_by("Language")
        else:
            objects = Language.objects.filter(Active=True).order_by("Language")

        return Response(LanguageSerializer(objects, many=True).data)

    def post(self, request):
        serializer = LanguageSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Language, pk=pk)
        serializer = LanguageSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Language, pk=pk)
        serializer = LanguageSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Language, pk=pk)
        obj.delete()

        return Response({"message": "Language deleted successfully"})


# =========================================================
# 21b. COLOR API
# =========================================================

class ColorAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Color, pk=pk)
            return Response(ColorSerializer(obj).data)

        scope = request.query_params.get("scope") or request.query_params.get("all")
        user_role = str(getattr(request.user, "Role", "") or "").lower()
        is_admin = (
            getattr(request.user, "is_authenticated", False)
            and (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
        )
        if is_admin or scope in ["all", "admin", "global", "true"]:
            objects = Color.objects.all().order_by("Color")
        else:
            objects = Color.objects.filter(Active=True).order_by("Color")

        return Response(ColorSerializer(objects, many=True).data)

    def post(self, request):
        serializer = ColorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Color, pk=pk)
        serializer = ColorSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Color, pk=pk)
        serializer = ColorSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Color, pk=pk)
        obj.delete()
        return Response({"message": "Color deleted successfully"})


# =========================================================
# 22. HELP API
# =========================================================

class HelpAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(Help, pk=pk)
            return Response(HelpSerializer(obj).data)

        # Support target info endpoint: /help/?info=support_targets
        if request.query_params.get("info") == "support_targets":
            added_by_staff = None
            ref_code = getattr(request.user, "Refered_By", None)
            if ref_code:
                try:
                    referrer = User.objects.filter(Reference_Code=int(ref_code)).first()
                    if referrer and str(getattr(referrer, "Role", "")).lower() == "staff":
                        staff_profile = Staff_Data.objects.filter(Staff_id=referrer).first()
                        added_by_staff = {
                            "id": referrer.pk,
                            "Reference_Code": referrer.Reference_Code,
                            "name": (staff_profile and staff_profile.Full_Name) or referrer.username or "Assigned Staff Counselor",
                            "contact": (staff_profile and staff_profile.WP_Contact) or referrer.Contact or "",
                            "email": (staff_profile and staff_profile.Email) or "",
                        }
                except (ValueError, TypeError):
                    added_by_staff = None

            admin_user = (
                User.objects.filter(Role__iexact="admin").first()
                or User.objects.filter(Role__iexact="superadmin").first()
                or User.objects.filter(is_superuser=True).first()
            )
            admin_data = User_Data.objects.filter(User_id=admin_user).first() if admin_user else None
            admin_info = {
                "id": admin_user.pk if admin_user else None,
                "Reference_Code": admin_user.Reference_Code if admin_user else None,
                "name": (admin_data and admin_data.Full_Name) or "Vaivaheek Manch Head Office Admin",
                "contact": "",
            }

            return Response({
                "has_staff": bool(added_by_staff),
                "added_by_type": "staff" if added_by_staff else "admin",
                "staff": added_by_staff,
                "admin": admin_info,
            })

        # Return help requests
        if getattr(request.user, "is_authenticated", False):
            role_param = request.query_params.get("role") or request.query_params.get("Role") or request.query_params.get("user_role")
            scope = request.query_params.get("scope") or request.query_params.get("all")
            user_role = str(getattr(request.user, "Role", "") or "").lower()
            is_admin = (
                getattr(request.user, "is_superuser", False)
                or getattr(request.user, "is_staff", False)
                or user_role in ["admin", "superadmin"]
            )
            if is_admin or scope in ["all", "admin", "global", "true"]:
                objects = Help.objects.all().order_by("-id")
            elif user_role == "staff":
                staff_ref = getattr(request.user, "Reference_Code", None)
                staff_q = Q(Reply_By=request.user) | Q(User_id=request.user) | Q(Target_User_id=request.user)
                if staff_ref:
                    try:
                        staff_ref_int = int(staff_ref)
                        staff_q |= (
                            (Q(User_id__Refered_By=staff_ref_int) | Q(User_id__Refered_By=str(staff_ref)))
                            & (Q(Target_User_id=request.user) | Q(Target_User_id__isnull=True) | Q(User_Role__iexact="user"))
                        )
                    except (ValueError, TypeError):
                        pass
                objects = Help.objects.filter(staff_q).distinct().order_by("-id")
            else:
                objects = Help.objects.filter(User_id=request.user).order_by("-id")

            if role_param:
                objects = objects.filter(Q(User_Role__iexact=role_param) | Q(Role__iexact=role_param))
        else:
            objects = Help.objects.none()

        return Response(HelpSerializer(objects, many=True).data)

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # Automatically assign User_id if authenticated
        if getattr(request.user, "is_authenticated", False) and not data.get("User_id"):
            data["User_id"] = request.user.pk

        user_role = str(getattr(request.user, "Role", "") or data.get("User_Role") or data.get("Role") or "user").strip().lower()
        is_staff_user = user_role == "staff"
        requested_target = str(data.get("target") or data.get("Target") or "").strip().lower()

        admin_user = (
            User.objects.filter(Role__iexact="admin").first()
            or User.objects.filter(Role__iexact="superadmin").first()
            or User.objects.filter(is_superuser=True).first()
        )

        # Set user role (raise request person role)
        data["User_Role"] = user_role

        # When creating a new Help query, NO ONE has replied yet!
        data["Reply_By"] = None
        data["Answer"] = None
        data["updated_date"] = None

        if is_staff_user:
            # Staff asking question to Admin
            data["Role"] = "staff"
            if admin_user:
                data["Target_User_id"] = admin_user.pk
        elif user_role == "service":
            # Service partner asking question to Admin
            data["Role"] = "service"
            if admin_user:
                data["Target_User_id"] = admin_user.pk
        else:
            # Regular user / Candidate asking
            added_by_staff = None
            ref_code = getattr(request.user, "Refered_By", None)
            if ref_code:
                try:
                    referrer = User.objects.filter(Reference_Code=int(ref_code)).first()
                    if referrer and str(getattr(referrer, "Role", "")).lower() == "staff":
                        added_by_staff = referrer
                except (ValueError, TypeError):
                    added_by_staff = None

            target = requested_target or str(data.get("Target_Role") or "")

            if added_by_staff and (target == "staff" or str(data.get("Target_User_id")) == str(added_by_staff.pk)):
                data["Role"] = "staff"
                data["Target_User_id"] = added_by_staff.pk
            else:
                data["Role"] = "admin"
                if admin_user:
                    data["Target_User_id"] = admin_user.pk

        # Also populate Target_User field for serializer backward compatibility
        if data.get("Target_User_id"):
            data["Target_User"] = data["Target_User_id"]

        serializer = HelpSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(Help, pk=pk)
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # When an answer is provided, record replying user and current timestamp
        answer_text = str(data.get("Answer", "")).strip() if data.get("Answer") is not None else ""
        if answer_text:
            if not data.get("Reply_By"):
                data["Reply_By"] = request.user.pk
            from django.utils import timezone
            data["updated_date"] = timezone.now()

        serializer = HelpSerializer(obj, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Help, pk=pk)
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)

        # When an answer is provided, record replying user and current timestamp
        answer_text = str(data.get("Answer", "")).strip() if data.get("Answer") is not None else ""
        if answer_text:
            if not data.get("Reply_By"):
                data["Reply_By"] = request.user.pk
            from django.utils import timezone
            data["updated_date"] = timezone.now()

        serializer = HelpSerializer(
            obj, data=data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Help, pk=pk)
        obj.delete()

        return Response({"message": "Help record deleted successfully"})


# =========================================================
# 23. EMAIL OTP API
# =========================================================

# class EmailOTPAPIView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get(self, request, pk=None):
#         if pk is not None:
#             obj = get_object_or_404(EmailOTP, pk=pk)
#             return Response(EmailOTPSerializer(obj).data)

#         objects = EmailOTP.objects.all()
#         return Response(EmailOTPSerializer(objects, many=True).data)

#     def post(self, request):
#         serializer = EmailOTPSerializer(data=request.data)

#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def put(self, request, pk):
#         obj = get_object_or_404(EmailOTP, pk=pk)
#         serializer = EmailOTPSerializer(obj, data=request.data)

#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def patch(self, request, pk):
#         obj = get_object_or_404(EmailOTP, pk=pk)
#         serializer = EmailOTPSerializer(
#             obj, data=request.data, partial=True
#         )

#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def delete(self, request, pk):
#         obj = get_object_or_404(EmailOTP, pk=pk)
#         obj.delete()

#         return Response({"message": "Email OTP record deleted successfully"})


# =========================================================
# 24. PHONE OTP API
# =========================================================

class PhoneOTPAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is not None:
            obj = get_object_or_404(PhoneOTP, pk=pk)
            return Response(PhoneOTPSerializer(obj).data)

        objects = PhoneOTP.objects.all()
        return Response(PhoneOTPSerializer(objects, many=True).data)

    def post(self, request):
        serializer = PhoneOTPSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        obj = get_object_or_404(PhoneOTP, pk=pk)
        serializer = PhoneOTPSerializer(obj, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(PhoneOTP, pk=pk)
        serializer = PhoneOTPSerializer(
            obj, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(PhoneOTP, pk=pk)
        obj.delete()

        return Response({"message": "Phone OTP record deleted successfully"})


# =========================================================
# 23. RAZORPAY PAYMENT API (ORDER CREATION & VERIFICATION)
# =========================================================

class RazorpayCreateOrderAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        return [AllowAny()]

    def post(self, request):
        try:
            amount = request.data.get("amount") or request.data.get("Amount")
            if not amount:
                return Response(
                    {"error": "Amount is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            amount_float = float(amount)
            amount_in_paise = int(amount_float * 100)

            key_id = getattr(settings, "RAZORPAY_KEY_ID", "rzp_test_TmLM4pKiwrBfmy")
            key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "U5ilLdNmGiT3ldIM4UPLu5AC")

            client = razorpay.Client(auth=(key_id, key_secret))
            receipt = f"rcpt_{int(timezone.now().timestamp())}"
            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": receipt,
                "payment_capture": 1,
            }
            order = client.order.create(data=order_data)

            return Response({
                "id": order.get("id"),
                "amount": order.get("amount"),
                "currency": order.get("currency", "INR"),
                "receipt": receipt,
                "key": key_id,
                "status": order.get("status"),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": f"Failed to create Razorpay order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RazorpayVerifyPaymentAPIView(APIView):
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        return [AllowAny()]

    def post(self, request):
        try:
            data = request.data
            order_id = data.get("razorpay_order_id")
            payment_id = data.get("razorpay_payment_id")
            signature = data.get("razorpay_signature")

            if not order_id or not payment_id or not signature:
                return Response(
                    {"status": "Payment verification failed", "error": "Missing payment signature details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            key_id = getattr(settings, "RAZORPAY_KEY_ID", "rzp_test_TmLM4pKiwrBfmy")
            key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "U5ilLdNmGiT3ldIM4UPLu5AC")

            # Allow dummy / simulated test payment in test mode
            is_dummy_test = (
                str(signature) in ["dummy_test_success", "test_dummy_payment", "simulated_success"]
                or str(payment_id).startswith("pay_test_dummy")
                or str(payment_id).startswith("pay_dummy_")
                or str(order_id).startswith("order_dummy_")
            ) and key_id.startswith("rzp_test_")

            if not is_dummy_test:
                client = razorpay.Client(auth=(key_id, key_secret))
                try:
                    client.utility.verify_payment_signature({
                        "razorpay_order_id": order_id,
                        "razorpay_payment_id": payment_id,
                        "razorpay_signature": signature,
                    })
                except razorpay.errors.SignatureVerificationError:
                    return Response(
                        {"status": "Payment verification failed", "error": "Invalid Razorpay signature"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            user_id = data.get("user_id") or data.get("User_id")
            if not user_id and getattr(request, "user", None) and request.user.is_authenticated:
                user_id = str(request.user.id)

            plan_name = data.get("plan") or data.get("Plan") or "Membership Plan"
            amount_val = data.get("amount") or data.get("Amount") or 100
            try:
                amount_int = int(float(amount_val))
            except (ValueError, TypeError):
                amount_int = 100

            user_obj = None
            if user_id:
                user_obj = User.objects.filter(id=user_id).first()

            txn = None
            new_valid_upto = None

            # 1. Put record in User_Transactions, update user balance, and extend membership validity atomically
            if user_obj:
                with transaction.atomic():
                    txn = User_Transactions.objects.create(
                        User_id=user_obj,
                        Plan=str(plan_name),
                        Amount=amount_int,
                        status="Success",
                    )
                    if hasattr(user_obj, "Amount"):
                        try:
                            user_obj.Amount = (getattr(user_obj, "Amount", 0) or 0) + amount_int
                            user_obj.save(update_fields=["Amount"])
                        except Exception:
                            pass

                    # 2. Update User_Data Valid_Upto based on plan validity (in days)
                    plan_id_val = data.get("plan_id") or data.get("Plan_id")
                    updated_valid_upto, _ = update_user_membership_validity(
                        user_obj=user_obj,
                        plan_name=plan_name,
                        plan_id=plan_id_val,
                        amount=amount_int,
                    )
                    if updated_valid_upto:
                        new_valid_upto = updated_valid_upto.strftime("%Y-%m-%d")

            return Response({
                "status": "Payment verified",
                "message": "Payment verified and membership updated successfully.",
                "order_id": order_id,
                "payment_id": payment_id,
                "valid_upto": new_valid_upto,
                "transaction_id": txn.id if txn else None,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"status": "Payment verification failed", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
