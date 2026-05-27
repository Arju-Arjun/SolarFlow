import smtplib
from email.mime.text import MIMEText

def send_test_email():
    smtp_server = "smtp.gmail.com"
    smtp_port = 587  # TLS port
    username = "arjun.ai.tinos@gmail.com"
    app_password = "ydhregmrkxzjlgqy"
    to_email = "arjuarjun047@gmail.com"
    
    subject = "Test Email"
    body = "This is a test email from a Python script."

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = username
    msg['To'] = to_email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Secure the connection
        server.login(username, app_password)
        server.sendmail(username, to_email, msg.as_string())
        server.quit()
        print("Email sent successfully!")
    except Exception as e:
        print("Failed to send email:", e)

if __name__ == "__main__":
    send_test_email()