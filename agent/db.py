"""
Database Abstraction Layer for Amble

Provides a unified interface for data storage that can switch between:
- Local JSON (development/fallback)
- Supabase (production)

Usage:
    from agent.db import get_db
    
    db = get_db()
    await db.insert("expenses", {"amount": 100, "category": "groceries"})
    expenses = await db.query("expenses", {"user_id": "123"})
"""

import os
import json
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# Abstract Database Interface
# ============================================================

class DatabaseInterface(ABC):
    """Abstract base class for database operations."""
    
    @abstractmethod
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record into a table."""
        pass
    
    @abstractmethod
    async def query(self, table: str, filters: Optional[Dict[str, Any]] = None, 
                   order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query records from a table."""
        pass
    
    @abstractmethod
    async def update(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record by ID."""
        pass
    
    @abstractmethod
    async def delete(self, table: str, record_id: str) -> bool:
        """Delete a record by ID."""
        pass
    
    @abstractmethod
    async def get_by_id(self, table: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Get a single record by ID."""
        pass


# ============================================================
# Local JSON Storage (Development/Fallback)
# ============================================================

class LocalJSONDatabase(DatabaseInterface):
    """Local JSON file storage for development and fallback."""
    
    def __init__(self, data_file: str = None):
        if data_file is None:
            data_dir = os.path.dirname(os.path.abspath(__file__))
            data_file = os.path.join(data_dir, "data.json")
        self.data_file = data_file
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create data file with default structure if missing."""
        if not os.path.exists(self.data_file):
            default_data = {
                "users": [],
                "family_members": [],
                "expenses": [],
                "moods": [],
                "activities": [],
                "appointments": [],
                "family_alerts": [],
                "long_term_memory": [],
                "user_profile": {},
                "push_subscriptions": [],
                "notifications": []
            }
            self._write_data(default_data)
    
    def _read_data(self) -> Dict[str, Any]:
        """Read all data from JSON file."""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            self._ensure_file_exists()
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    
    def _write_data(self, data: Dict[str, Any]):
        """Write all data to JSON file."""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except IOError as e:
            print(f"[DB] Error writing data: {e}")
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record into a table (list in JSON)."""
        all_data = self._read_data()
        
        # Auto-generate ID if not provided
        if "id" not in data:
            existing_ids = [r.get("id", 0) for r in all_data.get(table, []) if isinstance(r.get("id"), int)]
            data["id"] = max(existing_ids, default=0) + 1
        
        # Add timestamp if not provided
        if "timestamp" not in data and "created_at" not in data:
            data["created_at"] = datetime.now().isoformat()
        
        # Handle special case for user_profile (single object, not list)
        if table == "user_profile":
            all_data[table] = data
        else:
            if table not in all_data:
                all_data[table] = []
            all_data[table].append(data)
        
        self._write_data(all_data)
        return data
    
    async def query(self, table: str, filters: Optional[Dict[str, Any]] = None,
                   order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query records from a table."""
        all_data = self._read_data()
        
        # Handle user_profile as special case
        if table == "user_profile":
            profile = all_data.get(table, {})
            return [profile] if profile else []
        
        records = all_data.get(table, [])
        
        # Apply filters
        if filters:
            filtered = []
            for record in records:
                match = True
                for key, value in filters.items():
                    if record.get(key) != value:
                        match = False
                        break
                if match:
                    filtered.append(record)
            records = filtered
        
        # Apply ordering
        if order_by:
            desc = order_by.startswith("-")
            field = order_by.lstrip("-")
            records = sorted(records, key=lambda x: x.get(field, ""), reverse=desc)
        
        # Apply limit
        if limit:
            records = records[:limit]
        
        return records
    
    async def update(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record by ID."""
        all_data = self._read_data()
        
        # Handle user_profile as special case
        if table == "user_profile":
            all_data[table].update(data)
            all_data[table]["updated_at"] = datetime.now().isoformat()
            self._write_data(all_data)
            return all_data[table]
        
        records = all_data.get(table, [])
        for i, record in enumerate(records):
            if str(record.get("id")) == str(record_id):
                records[i].update(data)
                records[i]["updated_at"] = datetime.now().isoformat()
                self._write_data(all_data)
                return records[i]
        
        return {}
    
    async def delete(self, table: str, record_id: str) -> bool:
        """Delete a record by ID."""
        all_data = self._read_data()
        records = all_data.get(table, [])
        
        for i, record in enumerate(records):
            if str(record.get("id")) == str(record_id):
                del records[i]
                self._write_data(all_data)
                return True
        
        return False
    
    async def get_by_id(self, table: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Get a single record by ID."""
        all_data = self._read_data()
        
        # Handle user_profile as special case
        if table == "user_profile":
            return all_data.get(table, {})
        
        records = all_data.get(table, [])
        for record in records:
            if str(record.get("id")) == str(record_id):
                return record
        return None


# ============================================================
# Supabase Storage (Production)
# ============================================================

class SupabaseDatabase(DatabaseInterface):
    """Supabase database storage for production."""
    
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
            print("[DB] Supabase client initialized")
        except ImportError:
            raise ImportError("supabase-py not installed. Run: pip install supabase")
        except Exception as e:
            print(f"[DB] Supabase initialization failed: {e}")
            raise
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record into Supabase."""
        await self._ensure_client()
        
        # Add timestamp if not provided
        if "created_at" not in data:
            data["created_at"] = datetime.now().isoformat()
        
        result = self.client.table(table).insert(data).execute()
        return result.data[0] if result.data else {}
    
    async def query(self, table: str, filters: Optional[Dict[str, Any]] = None,
                   order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query records from Supabase."""
        await self._ensure_client()
        
        query = self.client.table(table).select("*")
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        # Apply ordering
        if order_by:
            desc = order_by.startswith("-")
            field = order_by.lstrip("-")
            query = query.order(field, desc=desc)
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        result = query.execute()
        return result.data or []
    
    async def update(self, table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record in Supabase."""
        await self._ensure_client()
        
        data["updated_at"] = datetime.now().isoformat()
        result = self.client.table(table).update(data).eq("id", record_id).execute()
        return result.data[0] if result.data else {}
    
    async def delete(self, table: str, record_id: str) -> bool:
        """Delete a record from Supabase."""
        await self._ensure_client()
        
        result = self.client.table(table).delete().eq("id", record_id).execute()
        return len(result.data) > 0 if result.data else False
    
    async def get_by_id(self, table: str, record_id: str) -> Optional[Dict[str, Any]]:
        """Get a single record from Supabase."""
        await self._ensure_client()
        
        result = self.client.table(table).select("*").eq("id", record_id).single().execute()
        return result.data


# ============================================================
# Database Factory
# ============================================================

_db_instance: Optional[DatabaseInterface] = None

def get_db() -> DatabaseInterface:
    """
    Get the database instance based on environment configuration.
    
    Set DB_BACKEND=supabase in .env to use Supabase.
    Default: local JSON storage.
    """
    global _db_instance
    
    if _db_instance is not None:
        return _db_instance
    
    backend = os.getenv("DB_BACKEND", "local").lower()
    
    if backend == "supabase":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        if url and key:
            _db_instance = SupabaseDatabase()
            print("[DB] Using Supabase backend")
        else:
            print("[DB] Supabase credentials not found, falling back to local JSON")
            _db_instance = LocalJSONDatabase()
    else:
        _db_instance = LocalJSONDatabase()
        print("[DB] Using local JSON backend")
    
    return _db_instance


def reset_db():
    """Reset the database instance (for testing)."""
    global _db_instance
    _db_instance = None


# ============================================================
# Sync wrappers for non-async code (tools.py compatibility)
# ============================================================

def sync_insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronous wrapper for insert."""
    db = get_db()
    return asyncio.get_event_loop().run_until_complete(db.insert(table, data))

def sync_query(table: str, filters: Optional[Dict[str, Any]] = None,
               order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Synchronous wrapper for query."""
    db = get_db()
    return asyncio.get_event_loop().run_until_complete(db.query(table, filters, order_by, limit))

def sync_update(table: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Synchronous wrapper for update."""
    db = get_db()
    return asyncio.get_event_loop().run_until_complete(db.update(table, record_id, data))

def sync_delete(table: str, record_id: str) -> bool:
    """Synchronous wrapper for delete."""
    db = get_db()
    return asyncio.get_event_loop().run_until_complete(db.delete(table, record_id))

def sync_get_by_id(table: str, record_id: str) -> Optional[Dict[str, Any]]:
    """Synchronous wrapper for get_by_id."""
    db = get_db()
    return asyncio.get_event_loop().run_until_complete(db.get_by_id(table, record_id))
