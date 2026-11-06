from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import *

urlpatterns = [
    # Authentication
    path("send-otp/", SendOTPAPIView.as_view(), name="send-otp"),
    path("verify-otp/", VerifyOTPAPIView.as_view(), name="verify-otp"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # User
    path("users/", UserAPIView.as_view(), name="user-list-create"),
    path("users/<str:pk>/", UserAPIView.as_view(), name="user-detail"),

    # User Data
    path("user-data/", UserDataAPIView.as_view(), name="user-data-list-create"),
    path("user-data/<str:pk>/", UserDataAPIView.as_view(), name="user-data-detail"),

    # User Transactions
    path("user-transactions/", UserTransactionsAPIView.as_view(), name="user-transactions-list-create"),
    path("user-transactions/<str:pk>/", UserTransactionsAPIView.as_view(), name="user-transactions-detail"),

    # Wish List
    path("wish-list/", WishListAPIView.as_view(), name="wish-list-create"),
    path("wish-list/incoming/", IncomingWishListAPIView.as_view(), name="wish-list-incoming"),
    path("wish-list/approved/", ApprovedWishListAPIView.as_view(), name="wish-list-approved"),
    path("wish-list/request/", DirectProfileRequestAPIView.as_view(), name="wish-list-direct-request"),
    path("wish-list/<str:pk>/request/", WishListRequestAPIView.as_view(), name="wish-list-request"),
    path("wish-list/<str:pk>/respond/", WishListResponseAPIView.as_view(), name="wish-list-respond"),
    path("wish-list/<str:pk>/", WishListAPIView.as_view(), name="wish-list-detail"),

    # Staff Data
    path("staff-data/", StaffDataAPIView.as_view(), name="staff-data-list-create"),
    path("staff-data/<str:pk>/", StaffDataAPIView.as_view(), name="staff-data-detail"),

    # Staff Transactions
    path("staff-transactions/", StaffTransactionsAPIView.as_view(), name="staff-transactions-list-create"),
    path("staff-transactions/<str:pk>/", StaffTransactionsAPIView.as_view(), name="staff-transactions-detail"),

    # Staff Commission
    path("staff-commission/", StaffCommissionAPIView.as_view(), name="staff-commission-list-create"),
    path("staff-commission/<int:pk>/", StaffCommissionAPIView.as_view(), name="staff-commission-detail"),

    # Service Data
    path("service-data/", ServiceDataAPIView.as_view(), name="service-data-list-create"),
    path("service-data/<str:pk>/", ServiceDataAPIView.as_view(), name="service-data-detail"),
    path("service-users/", ServiceDataAPIView.as_view(), name="service-users-list-create"),
    path("service-users/<str:pk>/", ServiceDataAPIView.as_view(), name="service-users-detail"),

    # Service Transactions
    path("service-transactions/", ServiceTransactionsAPIView.as_view(), name="service-transactions-list-create"),
    path("service-transactions/<str:pk>/", ServiceTransactionsAPIView.as_view(), name="service-transactions-detail"),

    # Services
    path("services/", ServicesAPIView.as_view(), name="services-list-create"),
    path("services/<str:pk>/", ServicesAPIView.as_view(), name="services-detail"),

    # Service Charge
    path("service-charges/", ServiceChargeAPIView.as_view(), name="service-charges-list-create"),
    path("service-charges/<str:pk>/", ServiceChargeAPIView.as_view(), name="service-charges-detail"),

    # States and Districts
    path("states-districts/", StatesWithDistrictsAPIView.as_view(), name="states-districts-list-create"),
    path("states-districts/<str:pk>/", StatesWithDistrictsAPIView.as_view(), name="states-districts-detail"),

    # Near District
    path("near-districts/", NearDistAPIView.as_view(), name="near-districts-list-create"),
    path("near-districts/<str:pk>/", NearDistAPIView.as_view(), name="near-districts-detail"),

    # Plans
    path("plans/", PlansAPIView.as_view(), name="plans-list-create"),
    path("plans/<str:pk>/", PlansAPIView.as_view(), name="plans-detail"),

    # Success Stories
    path("success-stories/", SuccessStoryAPIView.as_view(), name="success-stories-list-create"),
    path("success-stories/<str:pk>/", SuccessStoryAPIView.as_view(), name="success-stories-detail"),

    # Profession
    path("professions/", ProfessionAPIView.as_view(), name="professions-list-create"),
    path("professions/<str:pk>/", ProfessionAPIView.as_view(), name="professions-detail"),

    # Religion
    path("religions/", ReligionAPIView.as_view(), name="religions-list-create"),
    path("religions/<str:pk>/", ReligionAPIView.as_view(), name="religions-detail"),

    # Caste
    path("castes/", CasteAPIView.as_view(), name="castes-list-create"),
    path("castes/<str:pk>/", CasteAPIView.as_view(), name="castes-detail"),

    # Language
    path("languages/", LanguageAPIView.as_view(), name="languages-list-create"),
    path("languages/<str:pk>/", LanguageAPIView.as_view(), name="languages-detail"),

    # Color
    path("colors/", ColorAPIView.as_view(), name="colors-list-create"),
    path("colors/<str:pk>/", ColorAPIView.as_view(), name="colors-detail"),

    # Help
    path("help/", HelpAPIView.as_view(), name="help-list-create"),
    path("help/<str:pk>/", HelpAPIView.as_view(), name="help-detail"),

    # Email OTP
    # path("email-otp/", EmailOTPAPIView.as_view(), name="email-otp-list-create"),
    # path("email-otp/<str:pk>/", EmailOTPAPIView.as_view(), name="email-otp-detail"),

    # Phone OTP
    path("phone-otp/", PhoneOTPAPIView.as_view(), name="phone-otp-list-create"),
    path("phone-otp/<str:pk>/", PhoneOTPAPIView.as_view(), name="phone-otp-detail"),

    # Razorpay Payment Integration
    path("create-order/", RazorpayCreateOrderAPIView.as_view(), name="create-order"),
    path("verify-payment/", RazorpayVerifyPaymentAPIView.as_view(), name="verify-payment"),
]
