import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from .models import OTP
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def generate_otp(length=6):
    """Generate a random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(phone_number, email):
    """
    Generate OTP and send it via email
    """
    try:
        print(f"\n🔔 OTP REQUEST: Phone={phone_number}, Email={email}")
        
        # Generate OTP
        otp_code = generate_otp()
        print(f"✅ OTP Generated: {otp_code}")
        
        # Calculate expiry time (5 minutes from now)
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Create or update OTP record
        otp_obj, created = OTP.objects.update_or_create(
            phone_number=phone_number,
            defaults={
                'otp_code': otp_code,
                'is_verified': False,
                'created_at': timezone.now(),
                'expires_at': expires_at,
                'attempts': 0
            }
        )
        print(f"✅ OTP Saved to Database: ID={otp_obj.id}")
        
        # Send email with OTP
        subject = 'LMS Payment Verification Code'
        message = f"""
Dear User,

Your LMS payment verification code is: {otp_code}

This code is valid for 5 minutes only.

If you did not request this code, please ignore this email.

Best regards,
LMS Team
        """
        
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Payment Verification Code</h2>
                    <p>Your LMS payment verification code is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center;">
                        <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                    <p style="color: #666;">This code is valid for <strong>5 minutes</strong> only.</p>
                    <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">LMS Team</p>
                </div>
            </body>
        </html>
        """
        
        print(f"📧 Sending email to: {email}")
        print(f"📧 Using backend: {settings.EMAIL_BACKEND}")
        print(f"📧 From: {settings.DEFAULT_FROM_EMAIL}")
        
        email_result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✅ Email sent successfully! Result: {email_result}")
        
        return {
            'success': True,
            'message': f'OTP sent to {email}',
            'otp_id': otp_obj.id
        }
    
    except Exception as e:
        error_msg = f"❌ ERROR in send_otp_email: {str(e)}"
        print(error_msg)
        logger.error(error_msg, exc_info=True)
        return {
            'success': False,
            'message': str(e)
        }


def verify_otp(phone_number, otp_code):
    """
    Verify OTP entered by user
    """
    try:
        otp_obj = OTP.objects.get(phone_number=phone_number)
        
        # Check if OTP is expired
        if timezone.now() > otp_obj.expires_at:
            return {
                'success': False,
                'message': 'OTP has expired. Please request a new one.'
            }
        
        # Check attempts
        if otp_obj.attempts >= otp_obj.max_attempts:
            return {
                'success': False,
                'message': f'Maximum attempts exceeded. Please request a new OTP.'
            }
        
        # Verify OTP code
        if otp_obj.otp_code == otp_code:
            otp_obj.is_verified = True
            otp_obj.save()
            return {
                'success': True,
                'message': 'OTP verified successfully'
            }
        else:
            otp_obj.attempts += 1
            otp_obj.save()
            remaining_attempts = otp_obj.max_attempts - otp_obj.attempts
            return {
                'success': False,
                'message': f'Invalid OTP. {remaining_attempts} attempts remaining.'
            }
    
    except OTP.DoesNotExist:
        return {
            'success': False,
            'message': 'No OTP found for this phone number.'
        }


def is_otp_verified(phone_number):
    """
    Check if OTP is verified for a phone number
    """
    try:
        otp_obj = OTP.objects.get(phone_number=phone_number)
        return otp_obj.is_verified and timezone.now() <= otp_obj.expires_at
    except OTP.DoesNotExist:
        return False
