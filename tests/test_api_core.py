"""
Test Suite: Core API Endpoints
Tests all basic API endpoints for health, state, and configuration.
"""
import pytest
import requests


class TestHealthAndState:
    """Test health check and state endpoints."""
    
    def test_health_check(self, base_url):
        """Test GET / returns healthy status."""
        r = requests.get(f"{base_url}/", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["agent"] == "amble"
    
    def test_get_state_default_user(self, base_url):
        """Test GET /api/state with default user."""
        r = requests.get(f"{base_url}/api/state", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "status" in data
        assert "user_id" in data
        assert "agent_ready" in data
        assert data["agent_ready"] == True
    
    def test_get_state_specific_user(self, base_url, parent_user_id):
        """Test GET /api/state with specific user_id."""
        r = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == parent_user_id
        # Should return lists for tracking data
        assert "expenses" in data
        assert "activities" in data
        assert "appointments" in data
        assert "moods" in data
        assert isinstance(data["expenses"], list)
        assert isinstance(data["activities"], list)
    
    def test_get_state_returns_user_profile(self, base_url, parent_user_id):
        """Test that state includes user profile data."""
        r = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "user_profile" in data
        # Profile should be a dict (may be empty for new users)
        assert isinstance(data["user_profile"], dict)


class TestScheduler:
    """Test scheduler endpoints."""
    
    def test_scheduler_status(self, base_url):
        """Test GET /api/scheduler/status returns scheduler info."""
        r = requests.get(f"{base_url}/api/scheduler/status", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "running" in data
        assert "jobs" in data
    
    def test_trigger_scheduler_task(self, base_url):
        """Test POST /api/scheduler/task/{task_name} triggers task."""
        # This may fail if task doesn't exist, but should not error
        r = requests.post(f"{base_url}/api/scheduler/task/daily_summary", timeout=10)
        # Could be 200 (success) or 404 (not found) - both are valid responses
        assert r.status_code in [200, 404]
