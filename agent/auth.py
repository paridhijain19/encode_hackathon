"""
Authentication Service for Amble

Provides user authentication and session management that can switch between:
- Local (development) - Simple token-based auth
- Supabase Auth (production) - Full auth with OAuth, magic links, etc.

Usage:
    from agent.auth import get_auth_service
    
    auth = get_auth_service()
    user = await auth.sign_up(email, password, metadata)
    session = await auth.sign_in(email, password)
    user = await auth.get_current_user(token)
"""

import os
import uuid
import hashlib
import secrets
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# User and Session Models
# ============================================================

class User:
    """User model."""
    def __init__(self, id: str, email: str, role: str = "elder", 
                 metadata: Dict[str, Any] = None, created_at: str = None):
        self.id = id
        self.email = email
        self.role = role  # 'elder', 'family'
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "metadata": self.metadata,
            "created_at": self.created_at
        }


class Session:
    """Session model."""
    def __init__(self, access_token: str, user: User, expires_at: str = None):
        self.access_token = access_token
        self.user = user
        self.expires_at = expires_at or (datetime.now() + timedelta(days=7)).isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "access_token": self.access_token,
            "user": self.user.to_dict(),
            "expires_at": self.expires_at
        }


# ============================================================
# Abstract Auth Interface
# ============================================================

class AuthInterface(ABC):
    """Abstract base class for authentication operations."""
    
    @abstractmethod
    async def sign_up(self, email: str, password: str, role: str = "elder",
                      metadata: Dict[str, Any] = None) -> User:
        """Create a new user account."""
        pass
    
    @abstractmethod
    async def sign_in(self, email: str, password: str) -> Session:
        """Sign in with email and password."""
        pass
    
    @abstractmethod
    async def sign_out(self, token: str) -> bool:
        """Sign out and invalidate session."""
        pass
    
    @abstractmethod
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get user from access token."""
        pass
    
    @abstractmethod
    async def create_invite_token(self, elder_user_id: str, family_email: str,
                                   relation: str) -> str:
        """Create an invite token for family member."""
        pass
    
    @abstractmethod
    async def accept_invite(self, token: str, password: str) -> User:
        """Accept invite and create family account."""
        pass
    
    @abstractmethod
    async def get_family_members(self, elder_user_id: str) -> List[Dict[str, Any]]:
        """Get all family members linked to an elder user."""
        pass


# ============================================================
# Local Auth (Development)
# ============================================================

class LocalAuth(AuthInterface):
    """Local authentication for development."""
    
    def __init__(self):
        from agent.db import get_db
        self.db = get_db()
        self._sessions: Dict[str, Session] = {}  # In-memory sessions
    
    def _hash_password(self, password: str) -> str:
        """Simple password hashing."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _generate_token(self) -> str:
        """Generate a secure token."""
        return secrets.token_urlsafe(32)
    
    async def sign_up(self, email: str, password: str, role: str = "elder",
                      metadata: Dict[str, Any] = None) -> User:
        """Create a new user account."""
        # Check if user exists
        existing = await self.db.query("users", {"email": email})
        if existing:
            raise ValueError("User already exists")
        
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": email,
            "password_hash": self._hash_password(password),
            "role": role,
            "metadata": metadata or {},
            "created_at": datetime.now().isoformat()
        }
        
        await self.db.insert("users", user_data)
        
        return User(
            id=user_id,
            email=email,
            role=role,
            metadata=metadata,
            created_at=user_data["created_at"]
        )
    
    async def sign_in(self, email: str, password: str) -> Session:
        """Sign in with email and password."""
        users = await self.db.query("users", {"email": email})
        if not users:
            raise ValueError("Invalid credentials")
        
        user_data = users[0]
        if user_data.get("password_hash") != self._hash_password(password):
            raise ValueError("Invalid credentials")
        
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            role=user_data.get("role", "elder"),
            metadata=user_data.get("metadata", {}),
            created_at=user_data.get("created_at")
        )
        
        token = self._generate_token()
        session = Session(access_token=token, user=user)
        self._sessions[token] = session
        
        return session
    
    async def sign_out(self, token: str) -> bool:
        """Sign out and invalidate session."""
        if token in self._sessions:
            del self._sessions[token]
            return True
        return False
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get user from access token."""
        session = self._sessions.get(token)
        if not session:
            return None
        
        # Check expiry
        if datetime.fromisoformat(session.expires_at) < datetime.now():
            del self._sessions[token]
            return None
        
        return session.user
    
    async def create_invite_token(self, elder_user_id: str, family_email: str,
                                   relation: str) -> str:
        """Create an invite token for family member."""
        invite_token = self._generate_token()
        
        invite_data = {
            "id": str(uuid.uuid4()),
            "token": invite_token,
            "elder_user_id": elder_user_id,
            "family_email": family_email,
            "relation": relation,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        await self.db.insert("invites", invite_data)
        
        return invite_token
    
    async def accept_invite(self, token: str, password: str) -> User:
        """Accept invite and create family account."""
        invites = await self.db.query("invites", {"token": token, "status": "pending"})
        if not invites:
            raise ValueError("Invalid or expired invite")
        
        invite = invites[0]
        
        # Check expiry
        if datetime.fromisoformat(invite["expires_at"]) < datetime.now():
            raise ValueError("Invite has expired")
        
        # Create family user
        user = await self.sign_up(
            email=invite["family_email"],
            password=password,
            role="family",
            metadata={
                "elder_user_id": invite["elder_user_id"],
                "relation": invite["relation"]
            }
        )
        
        # Add to family_members table
        await self.db.insert("family_members", {
            "id": str(uuid.uuid4()),
            "user_id": invite["elder_user_id"],
            "family_user_id": user.id,
            "name": invite["family_email"].split("@")[0],  # Default name
            "email": invite["family_email"],
            "relation": invite["relation"],
            "invite_accepted": True,
            "created_at": datetime.now().isoformat()
        })
        
        # Mark invite as accepted
        await self.db.update("invites", invite["id"], {"status": "accepted"})
        
        return user
    
    async def get_family_members(self, elder_user_id: str) -> List[Dict[str, Any]]:
        """Get all family members linked to an elder user."""
        return await self.db.query("family_members", {"user_id": elder_user_id})


# ============================================================
# Supabase Auth (Production)
# ============================================================

class SupabaseAuth(AuthInterface):
    """Supabase authentication for production."""
    
    def __init__(self):
        self.client = None
        self._initialized = False
    
    async def _ensure_client(self):
        """Lazy initialization of Supabase client."""
        if self._initialized:
            return
        
        try:
            from supabase import create_client, Client
            
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
            
            self.client: Client = create_client(url, key)
            self._initialized = True
            print("[Auth] Supabase client initialized")
        except ImportError:
            raise ImportError("supabase-py not installed. Run: pip install supabase")
    
    async def sign_up(self, email: str, password: str, role: str = "elder",
                      metadata: Dict[str, Any] = None) -> User:
        """Create a new user account using Supabase Auth."""
        await self._ensure_client()
        
        user_metadata = {
            "role": role,
            **(metadata or {})
        }
        
        result = self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": user_metadata}
        })
        
        if result.user:
            return User(
                id=result.user.id,
                email=result.user.email,
                role=role,
                metadata=user_metadata,
                created_at=result.user.created_at
            )
        
        raise ValueError("Sign up failed")
    
    async def sign_in(self, email: str, password: str) -> Session:
        """Sign in with Supabase Auth."""
        await self._ensure_client()
        
        result = self.client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if result.session:
            user_data = result.user.user_metadata or {}
            user = User(
                id=result.user.id,
                email=result.user.email,
                role=user_data.get("role", "elder"),
                metadata=user_data,
                created_at=result.user.created_at
            )
            
            return Session(
                access_token=result.session.access_token,
                user=user,
                expires_at=datetime.fromtimestamp(result.session.expires_at).isoformat()
            )
        
        raise ValueError("Invalid credentials")
    
    async def sign_out(self, token: str) -> bool:
        """Sign out from Supabase."""
        await self._ensure_client()
        
        try:
            self.client.auth.sign_out()
            return True
        except:
            return False
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get user from Supabase session."""
        await self._ensure_client()
        
        try:
            # Set the session token
            self.client.auth.set_session(token, token)
            user_response = self.client.auth.get_user(token)
            
            if user_response.user:
                user_data = user_response.user.user_metadata or {}
                return User(
                    id=user_response.user.id,
                    email=user_response.user.email,
                    role=user_data.get("role", "elder"),
                    metadata=user_data,
                    created_at=user_response.user.created_at
                )
        except:
            pass
        
        return None
    
    async def create_invite_token(self, elder_user_id: str, family_email: str,
                                   relation: str) -> str:
        """Create invite using Supabase magic link."""
        await self._ensure_client()
        
        # Generate invite token and store in database
        invite_token = secrets.token_urlsafe(32)
        
        self.client.table("family_invites").insert({
            "token": invite_token,
            "elder_user_id": elder_user_id,
            "family_email": family_email,
            "relation": relation,
            "accepted": False,
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }).execute()
        
        return invite_token
    
    async def accept_invite(self, token: str, password: str) -> User:
        """Accept invite and create Supabase account."""
        await self._ensure_client()
        
        # Get invite
        result = self.client.table("family_invites").select("*").eq("token", token).eq("accepted", False).single().execute()
        
        if not result.data:
            raise ValueError("Invalid or expired invite")
        
        invite = result.data
        
        # Create user account
        user = await self.sign_up(
            email=invite["family_email"],
            password=password,
            role="family",
            metadata={
                "elder_user_id": invite["elder_user_id"],
                "relation": invite["relation"]
            }
        )
        
        # Add to family_members
        self.client.table("family_members").insert({
            "user_id": invite["elder_user_id"],
            "family_user_id": user.id,
            "email": invite["family_email"],
            "relation": invite["relation"],
            "invite_accepted": True
        }).execute()
        
        # Mark invite accepted
        self.client.table("family_invites").update({"accepted": True}).eq("id", invite["id"]).execute()
        
        return user
    
    async def get_family_members(self, elder_user_id: str) -> List[Dict[str, Any]]:
        """Get family members from Supabase."""
        await self._ensure_client()
        
        result = self.client.table("family_members").select("*").eq("user_id", elder_user_id).execute()
        return result.data or []


# ============================================================
# Auth Service Factory
# ============================================================

_auth_instance: Optional[AuthInterface] = None

def get_auth_service() -> AuthInterface:
    """
    Get the auth service based on environment configuration.
    
    Set AUTH_BACKEND=supabase in .env to use Supabase Auth.
    Default: local auth.
    """
    global _auth_instance
    
    if _auth_instance is not None:
        return _auth_instance
    
    backend = os.getenv("AUTH_BACKEND", os.getenv("DB_BACKEND", "local")).lower()
    
    if backend == "supabase":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        if url and key:
            _auth_instance = SupabaseAuth()
            print("[Auth] Using Supabase authentication")
        else:
            print("[Auth] Supabase credentials not found, falling back to local auth")
            _auth_instance = LocalAuth()
    else:
        _auth_instance = LocalAuth()
        print("[Auth] Using local authentication")
    
    return _auth_instance


def reset_auth():
    """Reset the auth instance (for testing)."""
    global _auth_instance
    _auth_instance = None
