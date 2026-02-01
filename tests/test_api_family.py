"""
Test Suite: Family Portal Endpoints
Tests all /api/family/* endpoints for the family dashboard.
"""
import pytest
import requests


class TestFamilySummary:
    """Test family summary endpoint."""
    
    def test_family_summary_returns_data(self, base_url, parent_user_id):
        """Test GET /api/family/{user_id}/summary returns summary data."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/summary", timeout=10)
        assert r.status_code == 200
        data = r.json()
        
        # Check all expected fields exist
        assert "user_profile" in data
        assert "recent_activities" in data
        assert "recent_moods" in data
        assert "upcoming_appointments" in data
        assert "recent_expenses" in data
        assert "alerts" in data
    
    def test_family_summary_nonexistent_user(self, base_url):
        """Test summary for non-existent user returns empty data."""
        r = requests.get(f"{base_url}/api/family/nonexistent_user_xyz/summary", timeout=10)
        assert r.status_code == 200
        # Should return empty but valid structure
        data = r.json()
        assert isinstance(data, dict)


class TestFamilyAlerts:
    """Test family alerts endpoint."""
    
    def test_get_alerts(self, base_url, parent_user_id):
        """Test GET /api/family/{user_id}/alerts returns alerts."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/alerts", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "alerts" in data
        assert isinstance(data["alerts"], list)
    
    def test_mark_alert_read(self, base_url, parent_user_id):
        """Test POST /api/family/{user_id}/alert/{id}/read marks alert as read."""
        # Use a dummy alert ID - should handle gracefully
        r = requests.post(f"{base_url}/api/family/{parent_user_id}/alert/test-alert-id/read", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "status" in data


class TestFamilyChatHistory:
    """Test family chat history endpoint."""
    
    def test_get_chat_history(self, base_url, parent_user_id):
        """Test GET /api/family/{user_id}/chat-history returns history."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/chat-history", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "chat_history" in data
        assert isinstance(data["chat_history"], list)
    
    def test_chat_history_with_limit(self, base_url, parent_user_id):
        """Test chat history respects limit parameter."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/chat-history?limit=5", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "chat_history" in data
        assert len(data["chat_history"]) <= 5


class TestFamilyWellness:
    """Test family wellness endpoint."""
    
    def test_get_wellness(self, base_url, parent_user_id):
        """Test GET /api/family/{user_id}/wellness returns wellness data."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/wellness", timeout=10)
        assert r.status_code == 200
        data = r.json()
        
        # Check expected wellness fields
        assert "recent_moods" in data
        assert "recent_activities" in data
        assert "wellness_score" in data
        assert "mood_trend" in data
    
    def test_wellness_score_range(self, base_url, parent_user_id):
        """Test wellness score is within valid range."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/wellness", timeout=10)
        assert r.status_code == 200
        data = r.json()
        score = data.get("wellness_score", 0)
        assert 0 <= score <= 100


class TestFamilyExpenses:
    """Test family expenses endpoint."""
    
    def test_get_expenses(self, base_url, parent_user_id):
        """Test GET /api/family/{user_id}/expenses returns expense data."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/expenses", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "recent_expenses" in data
        assert isinstance(data["recent_expenses"], list)
    
    def test_expenses_with_period(self, base_url, parent_user_id):
        """Test expenses endpoint accepts period parameter."""
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/expenses?period=week", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "recent_expenses" in data
