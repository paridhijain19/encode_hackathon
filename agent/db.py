"""
Database Abstraction Layer for Amble - DEPRECATED

⚠️  WARNING: This module is DEPRECATED. Please use agent.supabase_store directly.

This module provides backward compatibility for code that still imports from agent.db.
All operations are delegated to supabase_store.

Migration guide:
    # OLD (deprecated):
    from agent.db import get_db
    db = get_db()
    await db.insert("expenses", {...})
    
    # NEW (recommended):
    from agent.supabase_store import save_expense, get_expenses
    save_expense(user_id, amount, category, description)
    expenses = get_expenses(user_id, period="month")
"""

import warnings
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional

# Show deprecation warning on import
warnings.warn(
    "agent.db is deprecated. Use agent.supabase_store directly for all database operations.",
    DeprecationWarning,
    stacklevel=2
)


# ============================================================
# Abstract Database Interface (kept for backward compatibility)
# ============================================================

class DatabaseInterface(ABC):
    """Abstract base class for database operations."""
    
    @abstractmethod
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def query(self, table: str, filters: Optional[Dict[str, Any]] = None, 
                   order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def update(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def delete(self, table: str, record_id: str) -> bool:
        pass
    
    @abstractmethod
    async def get_by_id(self, table: str, record_id: str) -> Optional[Dict[str, Any]]:
        pass


# ============================================================
# Supabase Wrapper (delegates to supabase_store)
# ============================================================

class SupabaseWrapper(DatabaseInterface):
    """Wrapper that delegates to supabase_store for backward compatibility."""
    
    def __init__(self):
        # Import lazily to avoid circular imports
        pass
    
    def _get_client(self):
        from agent.supabase_store import get_supabase_client
        return get_supabase_client()
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record using Supabase client directly."""
        client = self._get_client()
        
        if "created_at" not in data:
            data["created_at"] = datetime.now().isoformat()
        
        try:
            result = client.table(table).insert(data).execute()
            return result.data[0] if result.data else data
        except Exception as e:
            print(f"[DB-Compat] Insert error for {table}: {e}")
            return data
    
    async def query(self, table: str, filters: Optional[Dict[str, Any]] = None,
                   order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query records using Supabase client directly."""
        client = self._get_client()
        
        try:
            # Handle user_profile special case
            if table == "user_profile":
                from agent.supabase_store import list_users
                return list_users()
            
            query = client.table(table).select("*")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            if order_by:
                desc = order_by.startswith("-")
                field = order_by.lstrip("-")
                query = query.order(field, desc=desc)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return result.data or []
        except Exception as e:
            print(f"[DB-Compat] Query error for {table}: {e}")
            return []
    
    async def update(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record using Supabase client directly."""
        client = self._get_client()
        
        data["updated_at"] = datetime.now().isoformat()
        
        try:
            result = client.table(table).update(data).eq("id", record_id).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"[DB-Compat] Update error for {table}: {e}")
            return {}
    
    async def delete(self, table: str, record_id: str) -> bool:
        """Delete a record using Supabase client directly."""
        client = self._get_client()
        
        try:
            result = client.table(table).delete().eq("id", record_id).execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"[DB-Compat] Delete error for {table}: {e}")
            return False
    
    async def get_by_id(self, table: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Get a single record using Supabase client directly."""
        client = self._get_client()
        
        try:
            result = client.table(table).select("*").eq("id", record_id).single().execute()
            return result.data
        except Exception as e:
            print(f"[DB-Compat] Get error for {table}/{record_id}: {e}")
            return None


# ============================================================
# Database Factory (backward compatible)
# ============================================================

_db_instance: Optional[DatabaseInterface] = None

def get_db() -> DatabaseInterface:
    """
    Get the database instance.
    
    ⚠️  DEPRECATED: Use agent.supabase_store functions directly instead.
    
    This function now always returns a SupabaseWrapper that delegates
    to supabase_store for all operations.
    """
    global _db_instance
    
    if _db_instance is None:
        _db_instance = SupabaseWrapper()
        print("[DB] Using Supabase via compatibility wrapper (consider migrating to supabase_store)")
    
    return _db_instance


def reset_db():
    """Reset the database instance (for testing)."""
    global _db_instance
    _db_instance = None

