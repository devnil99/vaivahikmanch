import requests
from rest_framework_simplejwt.tokens import RefreshToken

import secrets
import requests
from django.conf import settings


def send_otp_via_f2sms(phone):
    otp = f"{secrets.randbelow(900000) + 100000}"

    url = "https://www.fast2sms.com/dev/bulkV2"

    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": phone,
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=15,
        )
        response.raise_for_status()
        result = response.json()

        if result.get("return") is True:
            return True, otp

        return False, None

    except (requests.RequestException, ValueError):
        return False, None


import hashlib
import shortuuid

def secure_short_uuid():
    # Generate a short UUID (base57 compressed string)
    short_id = shortuuid.uuid()
    
    # Hash the short UUID using SHA-256
    hashed_id = hashlib.sha256(short_id.encode()).hexdigest()
    
    # Return the first 22 characters to maintain shorter length
    return hashed_id[:22]


# myapp/utils.py
import random

def generate_random_number():
    # Generate a 6-digit random number
    return random.randint(100000, 999999)


# utils.py


def get_tokens_for_user(user):
    """
    Generates JWT access and refresh tokens for the user.
    Returns:
        dict: Tokens and user role.
    """
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'role': getattr(user, 'Role', getattr(user, 'role', 'user')),
    }


def get_default_admin_reference_code():
    """
    Returns the Reference_Code of the default administrator.
    """
    from .models import User
    admin_user = (
        User.objects.filter(Role__iexact="admin").first()
        or User.objects.filter(Role__iexact="superadmin").first()
        or User.objects.filter(is_superuser=True).first()
    )
    if admin_user:
        if not admin_user.Reference_Code:
            admin_user.Reference_Code = generate_random_number()
            admin_user.save(update_fields=["Reference_Code"])
        try:
            return int(admin_user.Reference_Code)
        except (ValueError, TypeError):
            return 0
    return 0


def resolve_valid_referral_code(refered_by_raw):
    """
    Validates and resolves a referral code for user registration:
    - If user registers using a staff referral code and Staff_Data is not present,
      then no need to add balance anywhere, and use admin referral by default.
    - If referral code is not provided or invalid/unrecognized, use admin referral by default.
    """
    admin_ref = get_default_admin_reference_code()
    if not refered_by_raw:
        return admin_ref

    try:
        ref_code = int(refered_by_raw)
    except (ValueError, TypeError):
        return admin_ref

    from .models import User, Staff_Data
    referring_user = User.objects.filter(Reference_Code=ref_code).first()
    if not referring_user:
        return admin_ref

    # If referring user is staff, check if Staff_Data exists
    if str(getattr(referring_user, "Role", "")).lower() == "staff":
        staff_data_exists = Staff_Data.objects.filter(Staff_id=referring_user.id).exists()
        if not staff_data_exists:
            # Staff data not present -> no balance added anywhere, fallback to admin referral
            return admin_ref

    return ref_code


