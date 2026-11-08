import logging
import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

# Base platform frontend URL
def _get_portal_url(path="/"):
    base = getattr(settings, "FRONTEND_URL", "https://vaivahikmanch.in").rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return f"{base}{path}"


def _build_connection_request_html(recipient_name, sender_name, sender_caste, sender_age, sender_qual, sender_prof, sender_loc, portal_url):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Matrimonial Connection Request | वैवाहिक मंच</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #fdf2f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 32px rgba(184, 13, 59, 0.12); border: 1.5px solid #fecdd3;">
    <!-- Royal Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #881337 0%, #b80d3b 50%, #991b1b 100%); padding: 34px 24px; text-align: center; color: #ffffff;">
        <div style="font-size: 32px; margin-bottom: 6px; color: #fde047;">⚜️</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.4px; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
          वैवाहिक मंच
        </h1>
        <div style="font-size: 11px; font-weight: 800; color: #fde047; letter-spacing: 1.8px; text-transform: uppercase; margin-top: 6px;">
          VAIVAHEEK MANCH • पवित्र वैवाहिक संगम
        </div>
      </td>
    </tr>
    <!-- Golden Accent Border -->
    <tr>
      <td style="height: 3px; background: linear-gradient(90deg, #d4af37 0%, #fef08a 50%, #d4af37 100%);"></td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 14px; font-size: 19px; color: #0f172a; font-weight: 800;">
          Namaste {recipient_name},
        </h2>
        <p style="margin: 0 0 20px; font-size: 14.5px; color: #475569; line-height: 1.65;">
          A prospective partner has expressed interest in your biodata and sent you a <strong>Matrimonial Connection Request</strong> on Vaivaheek Manch.
        </p>

        <!-- Candidate Snapshot Card -->
        <div style="background: #fff8f9; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 22px; margin: 24px 0; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #ffe4e6; padding-bottom: 12px; margin-bottom: 14px;">
            <div style="font-size: 18px; font-weight: 900; color: #881337;">
              👰🤵 {sender_name} {f"({sender_age})" if sender_age else ""}
            </div>
            <div style="display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">
              ✓ Verified Profile
            </div>
          </div>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 38%;">🕉️ Community / Caste:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 800;">{sender_caste or "Compatible Community"}</td>
            </tr>
            {f'''<tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">🎓 Education:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{sender_qual}</td>
            </tr>''' if sender_qual else ''}
            {f'''<tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">💼 Profession:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{sender_prof}</td>
            </tr>''' if sender_prof else ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">📍 Native Location:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{sender_loc or "India"}</td>
            </tr>
          </table>
        </div>

        <!-- High-Converting CTA Button -->
        <div style="text-align: center; margin: 30px 0 24px;">
          <a href="{portal_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #b80d3b 0%, #991b1b 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 30px; box-shadow: 0 4px 18px rgba(184, 13, 59, 0.35); letter-spacing: 0.3px;">
            👉 Review &amp; Respond to Request
          </a>
        </div>

        <!-- Privacy & Security Guarantee -->
        <div style="background: #f8fafc; border-left: 4px solid #b80d3b; padding: 14px 16px; border-radius: 8px; font-size: 12.5px; color: #475569; margin-top: 24px; line-height: 1.55;">
          🔒 <strong>100% Privacy Guarantee:</strong> Your direct contact numbers, WhatsApp lines, and residential address remain strictly confidential. They are never revealed to prospective candidates unless you choose to accept this connection request.
        </div>

        <p style="margin: 26px 0 0; font-size: 13.5px; color: #64748b;">
          Wishing you auspicious matchmaking and a wonderful journey ahead.<br>
          <strong style="color: #881337;">टीम वैवाहिक मंच (Vaivaheek Manch Matrimonial Team)</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #fdf2f4; padding: 22px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #ffe4e6;">
        <p style="margin: 0 0 6px;">© 2026 वैवाहिक मंच (Vaivaheek Manch Matrimonial). All rights reserved.</p>
        <p style="margin: 0; font-size: 11px;">You received this notification because you are a registered matrimonial member on vaivahikmanch.in.</p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_connection_accepted_html(recipient_name, approver_name, approver_caste, approver_loc, portal_url):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Request Accepted | वैवाहिक मंच</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #fdf2f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 32px rgba(5, 150, 105, 0.12); border: 1.5px solid #a7f3d0;">
    <!-- Royal Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #059669 50%, #047857 100%); padding: 34px 24px; text-align: center; color: #ffffff;">
        <div style="font-size: 38px; margin-bottom: 6px;">🎉</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff;">
          Connection Request Accepted!
        </h1>
        <div style="font-size: 11px; font-weight: 800; color: #fef08a; letter-spacing: 1.8px; text-transform: uppercase; margin-top: 6px;">
          वैवाहिक मंच • बधाई हो! Congratulations
        </div>
      </td>
    </tr>
    <tr>
      <td style="height: 3px; background: linear-gradient(90deg, #d4af37 0%, #fef08a 50%, #d4af37 100%);"></td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 14px; font-size: 19px; color: #0f172a; font-weight: 800;">
          Namaste {recipient_name},
        </h2>
        <p style="margin: 0 0 20px; font-size: 14.5px; color: #475569; line-height: 1.65;">
          Great news! <strong>{approver_name}</strong> has accepted your matrimonial connection request. You both now have mutual access to communicate and view verified profiles.
        </p>

        <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 14px; padding: 22px; margin: 24px 0;">
          <div style="font-size: 18px; font-weight: 900; color: #065f46; margin-bottom: 8px;">
            ✓ Mutual Connection Established with {approver_name}
          </div>
          <div style="font-size: 13.5px; color: #047857;">
            {f"Community: <strong>{approver_caste}</strong> | " if approver_caste else ""}Location: <strong>{approver_loc or 'India'}</strong>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0 24px;">
          <a href="{portal_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 36px; border-radius: 30px; box-shadow: 0 4px 18px rgba(5, 150, 105, 0.35);">
            👉 View Approved Partner &amp; Contact Details
          </a>
        </div>

        <p style="margin: 26px 0 0; font-size: 13.5px; color: #64748b;">
          Best wishes on this exciting step towards your auspicious union.<br>
          <strong style="color: #065f46;">टीम वैवाहिक मंच (Vaivaheek Manch Matrimonial Team)</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f0fdf4; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #bbf7d0;">
        <p style="margin: 0;">© 2026 वैवाहिक मंच • vaivahikmanch.in</p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_connection_request_email(recipient_email, recipient_name, sender_name, sender_caste="", sender_age="", sender_qual="", sender_prof="", sender_loc=""):
    """
    Sends the HTML connection request notification email in a background thread.
    """
    try:
        if not recipient_email or "@" not in str(recipient_email):
            logger.info("Email notification skipped: invalid recipient email %s", recipient_email)
            return

        portal_url = _get_portal_url("/UserPanel?tab=requests")
        subject = f"✨ New Connection Request from {sender_name} | वैवाहिक मंच"

        text_content = (
            f"Namaste {recipient_name},\n\n"
            f"You have received a new matrimonial connection request from {sender_name} on Vaivaheek Manch.\n\n"
            f"Candidate Details:\n"
            f"- Name: {sender_name} {f'({sender_age})' if sender_age else ''}\n"
            f"- Community / Caste: {sender_caste or 'Compatible'}\n"
            f"- Education: {sender_qual or 'Not specified'}\n"
            f"- Profession: {sender_prof or 'Not specified'}\n"
            f"- Native Location: {sender_loc or 'India'}\n\n"
            f"Please visit your dashboard to review and respond to this request:\n"
            f"{portal_url}\n\n"
            f"Privacy Note: Your direct contact numbers and address remain strictly private until mutual approval.\n\n"
            f"Warm regards,\n"
            f"टीम वैवाहिक मंच (Vaivaheek Manch Matrimonial)"
        )

        html_content = _build_connection_request_html(
            recipient_name=recipient_name,
            sender_name=sender_name,
            sender_caste=sender_caste,
            sender_age=sender_age,
            sender_qual=sender_qual,
            sender_prof=sender_prof,
            sender_loc=sender_loc,
            portal_url=portal_url,
        )

        from_email = getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            "Vaivaheek Manch <vaivahikmanch.in@gmail.com>"
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
        logger.info("Connection request notification successfully sent to %s", recipient_email)

    except Exception as exc:
        logger.exception("Failed to dispatch connection request email: %s", exc)


def send_connection_accepted_email(recipient_email, recipient_name, approver_name, approver_caste="", approver_loc=""):
    """
    Sends the HTML connection accepted notification email in a background thread.
    """
    try:
        if not recipient_email or "@" not in str(recipient_email):
            return

        portal_url = _get_portal_url("/UserPanel?tab=approved")
        subject = f"🎉 Connection Request Accepted by {approver_name} | वैवाहिक मंच"

        text_content = (
            f"Namaste {recipient_name},\n\n"
            f"Great news! {approver_name} has accepted your matrimonial connection request on Vaivaheek Manch.\n\n"
            f"Please visit your dashboard to view the approved partner biodata and direct contact information:\n"
            f"{portal_url}\n\n"
            f"Warm regards,\n"
            f"टीम वैवाहिक मंच (Vaivaheek Manch Matrimonial)"
        )

        html_content = _build_connection_accepted_html(
            recipient_name=recipient_name,
            approver_name=approver_name,
            approver_caste=approver_caste,
            approver_loc=approver_loc,
            portal_url=portal_url,
        )

        from_email = getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            "Vaivaheek Manch <vaivahikmanch.in@gmail.com>"
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
        logger.info("Connection accepted notification successfully sent to %s", recipient_email)

    except Exception as exc:
        logger.exception("Failed to dispatch connection accepted email: %s", exc)


def notify_partner_request_async(sender_user, target_user):
    """
    Extracts summary in main thread and dispatches email via background daemon thread.
    Guarantees instant HTTP API response without blocking user experience or application performance.
    """
    try:
        from VMApp.models import User_Data
        from django.contrib.auth import get_user_model
        User = get_user_model()

        if isinstance(sender_user, (int, str)):
            sender_user = User.objects.filter(pk=sender_user).first()
        if isinstance(target_user, (int, str)):
            target_user = User.objects.filter(pk=target_user).first()

        if not sender_user or not target_user:
            return

        target_profile = User_Data.objects.filter(User_id=target_user).first()
        recipient_email = target_user.email or (getattr(target_profile, "Email", None) if target_profile else None)
        if not recipient_email or "@" not in str(recipient_email):
            logger.info("Connection request email skipped: target user %s has no email.", getattr(target_user, "pk", ""))
            return

        recipient_name = (
            (getattr(target_profile, "Full_Name", None) or "")
            or f"{target_user.first_name} {target_user.last_name}".strip()
            or target_user.username
        )

        sender_profile = User_Data.objects.filter(User_id=sender_user).first()
        sender_name = (
            (getattr(sender_profile, "Full_Name", None) or "")
            or f"{sender_user.first_name} {sender_user.last_name}".strip()
            or sender_user.username
        )

        sender_caste = getattr(sender_profile, "Caste", "") if sender_profile else ""
        sender_age = f"{getattr(sender_profile, 'Age', '')} yrs" if sender_profile and getattr(sender_profile, "Age", None) else ""
        sender_qual = getattr(sender_profile, "Qualification", "") if sender_profile else ""
        sender_prof = getattr(sender_profile, "Profession", "") if sender_profile else ""
        sender_dist = getattr(sender_profile, "District", "") if sender_profile else ""
        sender_state = getattr(sender_profile, "State", "") if sender_profile else ""
        sender_loc = ", ".join(filter(None, [sender_dist, sender_state]))

        thread = threading.Thread(
            target=send_connection_request_email,
            kwargs={
                "recipient_email": recipient_email,
                "recipient_name": recipient_name,
                "sender_name": sender_name,
                "sender_caste": sender_caste,
                "sender_age": sender_age,
                "sender_qual": sender_qual,
                "sender_prof": sender_prof,
                "sender_loc": sender_loc,
            },
            daemon=True,
            name=f"NotifyReq-{getattr(sender_user, 'pk', '')}->{getattr(target_user, 'pk', '')}",
        )
        thread.start()

    except Exception as exc:
        logger.exception("Failed to prepare connection request notification: %s", exc)


def notify_partner_acceptance_async(approver_user, requester_user):
    """
    Extracts summary in main thread and dispatches acceptance email via background daemon thread.
    """
    try:
        from VMApp.models import User_Data
        from django.contrib.auth import get_user_model
        User = get_user_model()

        if isinstance(approver_user, (int, str)):
            approver_user = User.objects.filter(pk=approver_user).first()
        if isinstance(requester_user, (int, str)):
            requester_user = User.objects.filter(pk=requester_user).first()

        if not approver_user or not requester_user:
            return

        requester_profile = User_Data.objects.filter(User_id=requester_user).first()
        recipient_email = requester_user.email or (getattr(requester_profile, "Email", None) if requester_profile else None)
        if not recipient_email or "@" not in str(recipient_email):
            return

        recipient_name = (
            (getattr(requester_profile, "Full_Name", None) or "")
            or f"{requester_user.first_name} {requester_user.last_name}".strip()
            or requester_user.username
        )

        approver_profile = User_Data.objects.filter(User_id=approver_user).first()
        approver_name = (
            (getattr(approver_profile, "Full_Name", None) or "")
            or f"{approver_user.first_name} {approver_user.last_name}".strip()
            or approver_user.username
        )

        approver_caste = getattr(approver_profile, "Caste", "") if approver_profile else ""
        approver_dist = getattr(approver_profile, "District", "") if approver_profile else ""
        approver_state = getattr(approver_profile, "State", "") if approver_profile else ""
        approver_loc = ", ".join(filter(None, [approver_dist, approver_state]))

        thread = threading.Thread(
            target=send_connection_accepted_email,
            kwargs={
                "recipient_email": recipient_email,
                "recipient_name": recipient_name,
                "approver_name": approver_name,
                "approver_caste": approver_caste,
                "approver_loc": approver_loc,
            },
            daemon=True,
            name=f"NotifyAcc-{getattr(approver_user, 'pk', '')}->{getattr(requester_user, 'pk', '')}",
        )
        thread.start()

    except Exception as exc:
        logger.exception("Failed to prepare connection acceptance notification: %s", exc)
