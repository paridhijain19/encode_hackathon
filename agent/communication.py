"""
Communication Service for Amble

Unified communication hub that handles:
- Text chat (CometChat or local fallback)
- Voice/Video calls (CometChat)
- Email notifications (Resend)
- Push notifications (Web Push)

Usage:
    from agent.communication import get_comm_service
    
    comm = get_comm_service()
    await comm.send_email(to, subject, body)
    await comm.send_push_notification(user_id, title, message)
"""

import os
import json
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# Abstract Communication Interface
# ============================================================

class CommunicationInterface(ABC):
    """Abstract base class for communication operations."""
    
    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str, 
                        html: Optional[str] = None) -> bool:
        """Send an email."""
        pass
    
    @abstractmethod
    async def send_push_notification(self, user_id: str, title: str, 
                                      message: str, data: Optional[Dict] = None) -> bool:
        """Send a push notification."""
        pass
    
    @abstractmethod
    async def send_family_alert(self, elder_user_id: str, message: str,
                                 urgency: str, category: str) -> bool:
        """Send an alert to all family members."""
        pass
    
    @abstractmethod
    async def get_chat_credentials(self, user_id: str) -> Dict[str, Any]:
        """Get credentials for chat SDK initialization."""
        pass


# ============================================================
# Local Communication (Development/Fallback)
# ============================================================

class LocalCommunication(CommunicationInterface):
    """Local communication service for development."""
    
    def __init__(self):
        from agent.db import get_db
        self.db = get_db()
    
    async def send_email(self, to: str, subject: str, body: str,
                        html: Optional[str] = None) -> bool:
        """Log email (simulated send)."""
        print(f"[Email] To: {to}")
        print(f"[Email] Subject: {subject}")
        print(f"[Email] Body: {body[:100]}...")
        
        # Store for debugging
        await self.db.insert("email_logs", {
            "to": to,
            "subject": subject,
            "body": body,
            "html": html,
            "status": "simulated",
            "sent_at": datetime.now().isoformat()
        })
        
        return True
    
    async def send_push_notification(self, user_id: str, title: str,
                                      message: str, data: Optional[Dict] = None) -> bool:
        """Log push notification (simulated send)."""
        print(f"[Push] User: {user_id}")
        print(f"[Push] Title: {title}")
        print(f"[Push] Message: {message}")
        
        # Store notification for in-app display
        await self.db.insert("notifications", {
            "user_id": user_id,
            "title": title,
            "message": message,
            "data": data,
            "read": False,
            "created_at": datetime.now().isoformat()
        })
        
        return True
    
    async def send_family_alert(self, elder_user_id: str, message: str,
                                 urgency: str, category: str) -> bool:
        """Send alert to family (stored in DB)."""
        # Store the alert
        await self.db.insert("family_alerts", {
            "user_id": elder_user_id,
            "message": message,
            "urgency": urgency,
            "category": category,
            "read_by": [],
            "created_at": datetime.now().isoformat()
        })
        
        # For high/critical urgency, also log email intent
        if urgency in ["high", "critical"]:
            from agent.auth import get_auth_service
            auth = get_auth_service()
            
            family_members = await auth.get_family_members(elder_user_id)
            for member in family_members:
                if member.get("email"):
                    await self.send_email(
                        to=member["email"],
                        subject=f"[{urgency.upper()}] Alert from Amble",
                        body=message
                    )
        
        return True
    
    async def get_chat_credentials(self, user_id: str) -> Dict[str, Any]:
        """Return mock credentials for development."""
        return {
            "provider": "local",
            "user_id": user_id,
            "message": "Chat SDK not configured. Using local mode."
        }


# ============================================================
# Production Communication (Resend + CometChat)
# ============================================================

class ProductionCommunication(CommunicationInterface):
    """Production communication using Resend and CometChat."""
    
    def __init__(self):
        self.resend_client = None
        self.cometchat_app_id = os.getenv("COMETCHAT_APP_ID")
        self.cometchat_auth_key = os.getenv("COMETCHAT_AUTH_KEY")
        self.cometchat_region = os.getenv("COMETCHAT_REGION", "us")
        self._init_resend()
    
    def _init_resend(self):
        """Initialize Resend client."""
        api_key = os.getenv("RESEND_API_KEY")
        if api_key:
            try:
                import resend
                resend.api_key = api_key
                self.resend_client = resend
                print("[Comm] Resend email client initialized")
            except ImportError:
                print("[Comm] Resend not installed. Run: pip install resend")
    
    async def send_email(self, to: str, subject: str, body: str,
                        html: Optional[str] = None) -> bool:
        """Send email via Resend."""
        if not self.resend_client:
            print(f"[Email] Simulated to {to}: {subject}")
            return True
        
        try:
            params = {
                "from": os.getenv("EMAIL_FROM", "Amble <onboarding@resend.dev>"),
                "to": [to],
                "subject": subject,
                "text": body
            }
            
            if html:
                params["html"] = html
            
            self.resend_client.Emails.send(params)
            print(f"[Email] Sent to {to}: {subject}")
            return True
        except Exception as e:
            print(f"[Email] Error: {e}")
            return False
    
    async def send_push_notification(self, user_id: str, title: str,
                                      message: str, data: Optional[Dict] = None) -> bool:
        """Send web push notification."""
        from agent.db import get_db
        db = get_db()
        
        # Get user's push subscriptions
        subscriptions = await db.query("push_subscriptions", {"user_id": user_id})
        
        if not subscriptions:
            print(f"[Push] No subscription for user {user_id}")
            # Store as in-app notification
            await db.insert("notifications", {
                "user_id": user_id,
                "title": title,
                "message": message,
                "data": data,
                "read": False,
                "created_at": datetime.now().isoformat()
            })
            return True
        
        try:
            from pywebpush import webpush, WebPushException
            
            vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
            vapid_claims = {
                "sub": f"mailto:{os.getenv('VAPID_CONTACT_EMAIL', 'admin@example.com')}"
            }
            
            payload = json.dumps({
                "title": title,
                "body": message,
                "data": data
            })
            
            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info=sub["subscription"],
                        data=payload,
                        vapid_private_key=vapid_private_key,
                        vapid_claims=vapid_claims
                    )
                except WebPushException as e:
                    print(f"[Push] Error sending to subscription: {e}")
            
            return True
        except ImportError:
            print("[Push] pywebpush not installed. Run: pip install pywebpush")
            return False
    
    async def send_family_alert(self, elder_user_id: str, message: str,
                                 urgency: str, category: str) -> bool:
        """Send alert to all family members."""
        from agent.db import get_db
        from agent.auth import get_auth_service
        
        db = get_db()
        auth = get_auth_service()
        
        # Store the alert
        await db.insert("family_alerts", {
            "user_id": elder_user_id,
            "message": message,
            "urgency": urgency,
            "category": category,
            "read_by": [],
            "created_at": datetime.now().isoformat()
        })
        
        # Get family members
        family_members = await auth.get_family_members(elder_user_id)
        
        for member in family_members:
            family_user_id = member.get("family_user_id")
            email = member.get("email")
            
            # Send push notification
            if family_user_id:
                await self.send_push_notification(
                    user_id=family_user_id,
                    title=f"Alert: {category.title()}",
                    message=message,
                    data={"urgency": urgency, "elder_user_id": elder_user_id}
                )
            
            # Send email for high/critical urgency
            if email and urgency in ["high", "critical"]:
                urgency_emoji = "🔴" if urgency == "critical" else "🟠"
                await self.send_email(
                    to=email,
                    subject=f"{urgency_emoji} [{urgency.upper()}] Amble Alert",
                    body=f"""
Hi,

This is an automated alert from Amble:

{message}

Urgency Level: {urgency.upper()}
Category: {category}
Time: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}

Please check in with your family member.

- Amble
                    """.strip(),
                    html=f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: {'#D32F2F' if urgency == 'critical' else '#F57C00'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">{urgency_emoji} {urgency.upper()} Alert</h1>
    </div>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; color: #333;">{message}</p>
        <p style="color: #666;">
            <strong>Category:</strong> {category}<br>
            <strong>Time:</strong> {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
        </p>
        <p style="color: #888; font-size: 14px;">Please check in with your family member.</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">Sent by Amble - Companion for Elderly Care</p>
</div>
                    """
                )
        
        return True
    
    async def get_chat_credentials(self, user_id: str) -> Dict[str, Any]:
        """Get CometChat credentials for frontend."""
        if not self.cometchat_app_id:
            return {
                "provider": "none",
                "message": "Chat not configured"
            }
        
        return {
            "provider": "cometchat",
            "app_id": self.cometchat_app_id,
            "region": self.cometchat_region,
            "user_id": user_id,
            # Auth token should be generated server-side for production
            # For now, return the auth key (only for development!)
            "auth_key": self.cometchat_auth_key if os.getenv("ENV") == "development" else None
        }


# ============================================================
# Email Templates
# ============================================================

class EmailTemplates:
    """Pre-built email templates."""
    
    @staticmethod
    def invite_email(elder_name: str, relation: str, invite_link: str) -> tuple:
        """Generate family invite email."""
        subject = f"{elder_name} has invited you to join Amble"
        
        body = f"""
Hi there,

{elder_name} has invited you to join Amble as their {relation}.

Amble is a companion app that helps elderly family members stay connected, 
track their daily activities, and maintain their independence.

Click the link below to create your account and start receiving updates:
{invite_link}

This invite link will expire in 7 days.

If you have any questions, please reply to this email.

Best regards,
The Amble Team
        """.strip()
        
        html = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #5B7355, #7A9A6D); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">You're Invited! 🌿</h1>
    </div>
    <div style="background: #FAF9F7; padding: 30px;">
        <p style="font-size: 18px; color: #333;">
            <strong>{elder_name}</strong> has invited you to join Amble as their <strong>{relation}</strong>.
        </p>
        <p style="color: #666;">
            Amble is a companion app that helps elderly family members stay connected, 
            track their daily activities, and maintain their independence.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{invite_link}" style="background: #5B7355; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invitation
            </a>
        </div>
        <p style="color: #999; font-size: 14px;">
            This invite link will expire in 7 days.
        </p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center; padding: 20px;">
        Amble - Companion for Elderly Care
    </p>
</div>
        """
        
        return subject, body, html
    
    @staticmethod
    def daily_summary_email(elder_name: str, summary: Dict[str, Any]) -> tuple:
        """Generate daily summary email for family."""
        subject = f"Daily Update: {elder_name}'s Day"
        
        activities = summary.get("activities", [])
        moods = summary.get("moods", [])
        expenses = summary.get("expenses", [])
        
        activities_text = "\n".join([f"- {a}" for a in activities]) or "No activities logged"
        moods_text = ", ".join(moods) or "No mood recorded"
        expenses_total = sum(e.get("amount", 0) for e in expenses)
        
        body = f"""
Hi,

Here's a summary of {elder_name}'s day:

ACTIVITIES:
{activities_text}

MOOD: {moods_text}

EXPENSES: ₹{expenses_total:.2f}

Stay connected!
- Amble
        """.strip()
        
        return subject, body, None


# ============================================================
# Communication Service Factory
# ============================================================

_comm_instance: Optional[CommunicationInterface] = None

def get_comm_service() -> CommunicationInterface:
    """
    Get the communication service based on environment configuration.
    
    Uses production services if RESEND_API_KEY or COMETCHAT_APP_ID are set.
    """
    global _comm_instance
    
    if _comm_instance is not None:
        return _comm_instance
    
    # Check if any production service is configured
    has_resend = bool(os.getenv("RESEND_API_KEY"))
    has_cometchat = bool(os.getenv("COMETCHAT_APP_ID"))
    
    if has_resend or has_cometchat:
        _comm_instance = ProductionCommunication()
        print("[Comm] Using production communication services")
    else:
        _comm_instance = LocalCommunication()
        print("[Comm] Using local communication (simulated)")
    
    return _comm_instance


def reset_comm():
    """Reset the communication instance (for testing)."""
    global _comm_instance
    _comm_instance = None
