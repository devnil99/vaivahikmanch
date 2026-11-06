import logging
import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _build_connection_request_html(recipient_name, sender_name, sender_caste, sender_age, sender_qual, sender_prof, sender_loc, portal_url):
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Matrimonial Connection Request | वैवाहिक मंच</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #fdf2f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 30px rgba(225, 29, 72, 0.12); border: 1.5px solid #fecdd3;">
    <!-- Brand Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #e11d48 0%, #db2777 55%, #be123c 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
        <div style="font-size: 42px; margin-bottom: 8px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));">💍</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.3px; color: #ffffff;">वैवाहिक मंच</h1>
        <div style="font-size: 11px; font-weight: 800; color: #fef08a; letter-spacing: 1.6px; text-transform: uppercase; margin-top: 6px;">
          VAIVAHEEK MANCH MATRIMONIAL • पवित्र वैवाहिक संगम
        </div>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 14px; font-size: 19px; color: #1e293b; font-weight: 800;">
          Namaste {recipient_name},
        </h2>
        <p style="margin: 0 0 20px; font-size: 14.5px; color: #475569;">
          A prospective partner has expressed interest in your biodata and sent you a <strong>Matrimonial Connection Request</strong> on Vaivaheek Manch.
        </p>

        <!-- Candidate Snapshot Card -->
        <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 20px 22px; margin: 24px 0;">
          <div style="font-size: 18px; font-weight: 900; color: #881337; margin-bottom: 14px; border-bottom: 1px solid #fecdd3; padding-bottom: 8px;">
            🤵👰 {sender_name} {f"({sender_age})" if sender_age else ""}
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 38%;">Community / Caste:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 800;">{sender_caste or "Open / Compatible"}</td>
            </tr>
            {f'''<tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Education:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">{sender_qual}</td>
            </tr>''' if sender_qual else ''}
            {f'''<tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Profession:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">{sender_prof}</td>
            </tr>''' if sender_prof else ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Native Location:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">{sender_loc or "India"}</td>
            </tr>
          </table>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0 22px;">
          <a href="{portal_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 30px; box-shadow: 0 4px 16px rgba(225, 29, 72, 0.35); letter-spacing: 0.3px;">
            👉 Review & Respond to Request
          </a>
        </div>

        <!-- Privacy & Security Guarantee -->
        <div style="background: #f8fafc; border-left: 4px solid #e11d48; padding: 14px 16px; border-radius: 8px; font-size: 12.5px; color: #64748b; margin-top: 26px; line-height: 1.55;">
          🔒 <strong>Privacy Assurance:</strong> Your contact numbers, WhatsApp lines, and residential address are 100% confidential. They are never revealed to prospective candidates unless you choose to accept this connection request.
        </div>

        <p style="margin: 26px 0 0; font-size: 13.5px; color: #64748b;">
          Wishing you best wishes in finding your auspicious life partner.<br>
          <strong style="color: #881337;">टीम वैवाहिक मंच (Vaivaheek Manch Matrimonial Team)</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #fdf2f4; padding: 22px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #ffe4e6;">
        <p style="margin: 0 0 6px;">© 2026 वैवाहिक मंच (Vaivaheek Manch Matrimonial). All rights reserved.</p>
        <p style="margin: 0; font-size: 11px;">You received this automated notification because you are a registered matrimonial member.</p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_connection_request_email(recipient_email, recipient_name, sender_name, sender_caste="", sender_age="", sender_qual="", sender_prof="", sender_loc=""):
    """
    Sends the HTML connection request notification email in background thread.
    No database operations inside this function.
    """
    try:
        if not recipient_email or "@" not in str(recipient_email):
            logger.info("Email notification skipped: invalid recipient email %s", recipient_email)
            return

        portal_url = "http://localhost:3000/UserPanel?tab=requests"
        subject = f"💍 New Connection Request from {sender_name} | वैवाहिक मंच"

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
            "Vaivaheek Manch <nilkamalshriwas91@gmail.com>"
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
