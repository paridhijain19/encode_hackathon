"""
API Key Fallback Manager for Amble
==================================

Handles multiple API keys with automatic fallback when quotas are exhausted.
Supports Google/Gemini API keys and Anam API keys.

Environment Variables:
    GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, GOOGLE_API_KEY_3, ...
    ANAM_API_KEY_1, ANAM_API_KEY_2, ANAM_API_KEY_3, ...
    
    Or single keys (backward compatibility):
    GOOGLE_API_KEY, ANAM_API_KEY
"""

import os
import time
from typing import List, Optional, Dict, Any
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class APIKeyManager:
    """
    Manages multiple API keys with automatic fallback on quota exhaustion.
    
    Usage:
        manager = APIKeyManager()
        google_key = manager.get_key('google')  # Returns next available Google key
        anam_key = manager.get_key('anam')      # Returns next available Anam key
        elevenlabs_key = manager.get_key('elevenlabs')  # Returns next available ElevenLabs key
        
        # Mark key as exhausted (will skip it for some time)
        manager.mark_exhausted('google', google_key)
    """
    
    def __init__(self):
        self.google_keys = self._load_keys('GOOGLE_API_KEY')
        self.anam_keys = self._load_keys('ANAM_API_KEY')
        self.elevenlabs_keys = self._load_keys('ELEVENLABS_API_KEY')
        
        # Track exhausted keys with timestamp
        self.exhausted_keys: Dict[str, Dict[str, float]] = defaultdict(dict)
        
        # Current key indices
        self.current_indices = {
            'google': 0,
            'anam': 0,
            'elevenlabs': 0
        }
        
        # Cooldown period in seconds (1 hour)
        self.cooldown_period = 3600
        
        logger.info(f"[APIKeyManager] Loaded {len(self.google_keys)} Google keys, {len(self.anam_keys)} Anam keys, {len(self.elevenlabs_keys)} ElevenLabs keys")
    
    def _load_keys(self, base_name: str) -> List[str]:
        """Load API keys from environment variables."""
        keys = []
        
        # Check for single key first (backward compatibility)
        single_key = os.getenv(base_name)
        if single_key:
            keys.append(single_key)
        
        # Check for numbered keys
        i = 1
        while True:
            key = os.getenv(f"{base_name}_{i}")
            if key:
                keys.append(key)
                i += 1
            else:
                break
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keys = []
        for key in keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        
        return unique_keys
    
    def _is_key_available(self, key_type: str, key: str) -> bool:
        """Check if a key is available (not exhausted or cooled down)."""
        if key not in self.exhausted_keys[key_type]:
            return True
        
        exhausted_time = self.exhausted_keys[key_type][key]
        return time.time() - exhausted_time > self.cooldown_period
    
    def get_key(self, key_type: str) -> Optional[str]:
        """
        Get next available API key for the given type.
        
        Args:
            key_type: 'google', 'anam', or 'elevenlabs'
            
        Returns:
            API key string or None if no keys available
        """
        if key_type == 'google':
            keys = self.google_keys
        elif key_type == 'anam':
            keys = self.anam_keys
        elif key_type == 'elevenlabs':
            keys = self.elevenlabs_keys
        else:
            logger.error(f"[APIKeyManager] Unknown key type: {key_type}")
            return None
        
        if not keys:
            logger.error(f"[APIKeyManager] No {key_type} keys configured")
            return None
        
        # Try to find an available key starting from current index
        start_index = self.current_indices[key_type]
        
        for i in range(len(keys)):
            index = (start_index + i) % len(keys)
            key = keys[index]
            
            if self._is_key_available(key_type, key):
                self.current_indices[key_type] = (index + 1) % len(keys)
                logger.info(f"[APIKeyManager] Using {key_type} key {index + 1}/{len(keys)}")
                return key
        
        # All keys exhausted
        logger.error(f"[APIKeyManager] All {key_type} keys exhausted")
        return None
    
    def mark_exhausted(self, key_type: str, key: str, reason: str = "quota_exceeded"):
        """
        Mark a key as exhausted/rate limited.
        
        Args:
            key_type: 'google' or 'anam'
            key: The API key that was exhausted
            reason: Reason for exhaustion (for logging)
        """
        self.exhausted_keys[key_type][key] = time.time()
        logger.warning(f"[APIKeyManager] Marked {key_type} key as exhausted: {reason}")
        
        # Log available keys count
        if key_type == 'google':
            available = sum(1 for k in self.google_keys if self._is_key_available(key_type, k))
            logger.info(f"[APIKeyManager] {available}/{len(self.google_keys)} Google keys still available")
        elif key_type == 'anam':
            available = sum(1 for k in self.anam_keys if self._is_key_available(key_type, k))
            logger.info(f"[APIKeyManager] {available}/{len(self.anam_keys)} Anam keys still available")
        elif key_type == 'elevenlabs':
            available = sum(1 for k in self.elevenlabs_keys if self._is_key_available(key_type, k))
            logger.info(f"[APIKeyManager] {available}/{len(self.elevenlabs_keys)} ElevenLabs keys still available")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of all keys."""
        now = time.time()
        
        def key_status(key_type: str, keys: List[str]) -> Dict[str, Any]:
            available = 0
            exhausted = 0
            cooling_down = 0
            
            for key in keys:
                if key not in self.exhausted_keys[key_type]:
                    available += 1
                else:
                    exhausted_time = self.exhausted_keys[key_type][key]
                    if now - exhausted_time > self.cooldown_period:
                        available += 1
                    else:
                        cooling_down += 1
                        
            return {
                'total': len(keys),
                'available': available,
                'cooling_down': cooling_down,
                'exhausted': exhausted
            }
        
        return {
            'google': key_status('google', self.google_keys),
            'anam': key_status('anam', self.anam_keys),
            'elevenlabs': key_status('elevenlabs', self.elevenlabs_keys)
        }


def is_quota_error(exception: Exception) -> bool:
    """
    Check if an exception indicates API quota/rate limit exhaustion.
    
    Common error patterns:
    - Google API: "Quota exceeded", "Rate limit exceeded", 429 status
    - Anam API: Similar patterns
    """
    error_str = str(exception).lower()
    error_patterns = [
        'quota exceeded',
        'rate limit exceeded',
        'too many requests',
        'resource exhausted',
        'daily limit exceeded',
        'monthly limit exceeded',
        '429',  # HTTP 429 Too Many Requests
        'limit exceeded',
        'usage limit',
        'billing'
    ]
    
    return any(pattern in error_str for pattern in error_patterns)


def is_auth_error(exception: Exception) -> bool:
    """Check if an exception indicates invalid/expired API key."""
    error_str = str(exception).lower()
    auth_patterns = [
        'invalid api key',
        'authentication failed',
        'unauthorized',
        '401',  # HTTP 401 Unauthorized
        '403',  # HTTP 403 Forbidden
        'api key not valid',
        'invalid key'
    ]
    
    return any(pattern in error_str for pattern in auth_patterns)


# Global instance
api_key_manager = APIKeyManager()


def get_google_api_key() -> Optional[str]:
    """Get next available Google API key."""
    return api_key_manager.get_key('google')


def get_anam_api_key() -> Optional[str]:
    """Get next available Anam API key.""" 
    return api_key_manager.get_key('anam')


def get_elevenlabs_api_key() -> Optional[str]:
    """Get next available ElevenLabs API key."""
    return api_key_manager.get_key('elevenlabs')


def mark_google_key_exhausted(key: str, reason: str = "quota_exceeded"):
    """Mark a Google API key as exhausted."""
    api_key_manager.mark_exhausted('google', key, reason)


def mark_anam_key_exhausted(key: str, reason: str = "quota_exceeded"):
    """Mark an Anam API key as exhausted."""
    api_key_manager.mark_exhausted('anam', key, reason)


def mark_elevenlabs_key_exhausted(key: str, reason: str = "quota_exceeded"):
    """Mark an ElevenLabs API key as exhausted."""
    api_key_manager.mark_exhausted('elevenlabs', key, reason)