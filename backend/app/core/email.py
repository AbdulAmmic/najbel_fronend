import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import threading

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "ammicsystems@gmail.com"
EMAIL_PASSWORD = "gdgt oixg kukw rrdz"

def send_email_sync(to_email: str, subject: str, body_html: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Najbel Clinic <{EMAIL_ADDRESS}>"
        msg["To"] = to_email

        # Attach body
        part = MIMEText(body_html, "html")
        msg.attach(part)

        # Connect and send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
            
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_email_background(to_email: str, subject: str, body_html: str, background_tasks: Optional[any] = None):
    """Sends an email in a background thread or using FastAPI BackgroundTasks."""
    if background_tasks:
        background_tasks.add_task(send_email_sync, to_email, subject, body_html)
    else:
        thread = threading.Thread(target=send_email_sync, args=(to_email, subject, body_html))
        thread.daemon = True
        thread.start()

# Helper Templates
def generate_appointment_email(patient_name: str, doctor_name: str, action: str, note: str, doctor_phone: str, new_date: Optional[str] = None):
    action_text = "Confirmed" if action == "confirm" else "Rescheduled" if action == "reschedule" else "Cancelled"
    date_text = f"<p><strong>New Appointment Time:</strong> {new_date}</p>" if new_date and action == "reschedule" else ""
    
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Appointment {action_text}</h2>
                <p>Hello <strong>{patient_name}</strong>,</p>
                <p>Your appointment with <strong>{doctor_name}</strong> has been <strong>{action_text.lower()}</strong>.</p>
                {date_text}
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Note from the Doctor/Admin:</p>
                    <p style="margin: 10px 0 0 0; font-style: italic;">"{note}"</p>
                </div>
                <p>If you have any questions, you can contact your doctor directly:</p>
                <p><strong>Doctor's Phone:</strong> {doctor_phone}</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">This is an automated message from Najbel Clinic. Please do not reply to this email.</p>
            </div>
        </body>
    </html>
    """

def generate_wallet_alert_email(patient_name: str, type: str, amount: float, balance: float, description: str = None):
    color = "#10b981" if type == "credit" else "#ef4444"
    desc_html = f"<p style='margin-bottom: 5px;'><strong>Description:</strong> {description}</p>" if description else ""
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: {color};">Wallet {type.capitalize()} Alert</h2>
                <p>Hello <strong>{patient_name}</strong>,</p>
                <p>A <strong>{type}</strong> transaction has been processed on your Najbel Clinic wallet.</p>
                {desc_html}
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; margin: 0; color: {color};">
                        {"+" if type == "credit" else "-"}₦{amount:,.2f}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #666;">Note: A ₦60.00 service charge is applied to all wallet funding transactions.</p>
                    <hr style="margin: 15px 0; border: none; border-top: 1px dashed #ccc;">
                    <p style="margin: 0;"><strong>Current Balance:</strong> ₦{balance:,.2f}</p>
                </div>
            </div>
        </body>
    </html>
    """

def generate_otp_email(otp_code: str):
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9fafb; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800;">Password Reset Request</h2>
                <p style="color: #4b5563; font-size: 16px;">We received a request to reset the password for your Najbel Clinic account.</p>
                <p style="color: #4b5563; font-size: 16px;">Use the secure verification code below to authorize the reset. This code is absolutely confidential and will expire in <strong>15 minutes</strong>.</p>
                
                <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                    <span style="font-family: monospace; font-size: 40px; font-weight: 900; letter-spacing: 0.2em; color: #4338ca;">{otp_code}</span>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email. Your account remains protected.</p>
            </div>
        </body>
    </html>
    """

def generate_welcome_email(full_name: str, email: str, password: str, role: str):
    return f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f4f7f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800;">Welcome to Najbel Clinic</h1>
                    <p style="color: #64748b; font-size: 16px; margin-top: 5px;">Your healthcare journey starts here</p>
                </div>
                
                <p>Hello <strong>{full_name}</strong>,</p>
                <p>An account has been created for you at Najbel Clinic as a <strong>{role.capitalize()}</strong>. We're excited to have you on board!</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">Your Login Credentials</h3>
                    <p style="margin: 10px 0; font-size: 15px;"><strong>Email:</strong> <span style="color: #2563eb;">{email}</span></p>
                    <p style="margin: 10px 0; font-size: 15px;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">{password}</span></p>
                </div>
                
                <p style="font-size: 14px; color: #64748b;"><strong>Security Tip:</strong> We recommend changing your password after your first login to keep your account secure.</p>
                
                <div style="text-align: center; margin-top: 40px;">
                    <a href="http://localhost:3000/login" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login to Your Account</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </body>
    </html>
    """
def generate_lab_tech_notification_email(tech_name: str, patient_name: str, test_name: str, short_id: str, priority: str):
    color = "#ef4444" if priority == "urgent" else "#2563eb"
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: {color};">New Lab Request - {short_id}</h2>
                <p>Hello <strong>{tech_name}</strong>,</p>
                <p>A new lab request has been assigned to the laboratory department.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Patient:</strong> {patient_name}</p>
                    <p><strong>Test:</strong> {test_name}</p>
                    <p><strong>Lab ID:</strong> <span style="font-family: monospace; font-weight: bold; font-size: 1.1em;">{short_id}</span></p>
                    <p><strong>Priority:</strong> <span style="color: {color}; font-weight: bold; text-transform: uppercase;">{priority}</span></p>
                </div>
                <p>Please log in to the laboratory dashboard to process this request once payment is confirmed.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Najbel Clinic LIS - Automated Notification</p>
            </div>
        </body>
    </html>
    """

def generate_lab_payment_request_email(patient_name: str, test_name: str, short_id: str, amount: float):
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Lab Test Payment Required</h2>
                <p>Hello <strong>{patient_name}</strong>,</p>
                <p>A lab test request (<strong>{short_id}</strong>) has been made for you. Please settle the diagnostic fees to proceed with sample collection.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dbeafe;">
                    <p><strong>Test:</strong> {test_name}</p>
                    <p><strong>Amount Due:</strong> <span style="font-size: 1.25em; font-weight: bold; color: #1e40af;">₦{amount:,.2f}</span></p>
                </div>
                <p>You can pay this invoice directly from your **Najbel Clinic Wallet** by logging into your patient dashboard.</p>
                <p style="font-size: 14px; color: #64748b;">The laboratory will only be able to accept your samples after payment has been verified.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Thank you for choosing Najbel Clinic.</p>
            </div>
        </body>
    </html>
    """
