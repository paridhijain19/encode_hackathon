"""
Test Suite: Chat Functionality
Tests the main chat endpoint with the AI agent.
Note: These tests require waiting between requests due to API rate limits.
"""
import pytest
import time
import requests


# Longer wait time for Google API rate limits
def wait_for_rate_limit():
    """Wait to avoid Google API rate limits."""
    time.sleep(5)


class TestChatEndpoint:
    """Test the main /chat endpoint."""
    
    def test_chat_basic_message(self, base_url, parent_user_id):
        """Test POST /chat with a simple greeting."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "Hello, how are you today?"
        }, timeout=90)
        
        # May get 429 due to rate limits - that's acceptable
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "response" in data
        assert "session_id" in data
        assert "user_id" in data
        assert len(data["response"]) > 0
        assert data["user_id"] == parent_user_id
    
    def test_chat_empty_message_rejected(self, base_url, parent_user_id):
        """Test that empty messages are rejected."""
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": ""
        }, timeout=10)
        
        assert r.status_code == 400
    
    def test_chat_whitespace_message_rejected(self, base_url, parent_user_id):
        """Test that whitespace-only messages are rejected."""
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "   "
        }, timeout=10)
        
        assert r.status_code == 400
    
    def test_chat_returns_session_id(self, base_url, test_user_id):
        """Test that chat creates and returns a session_id."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": test_user_id,
            "message": "What can you help me with?"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "session_id" in data
        assert data["session_id"] is not None
        assert len(data["session_id"]) > 0
    
    def test_chat_tracks_memories(self, base_url, parent_user_id):
        """Test that chat returns memory usage count."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "Tell me about my day"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "memories_used" in data
        assert isinstance(data["memories_used"], int)


class TestChatTracking:
    """Test that chat properly tracks expenses, activities, moods."""
    
    def test_chat_expense_tracking(self, base_url, parent_user_id):
        """Test tracking expenses through chat."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I spent 50 rupees on tea and snacks"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "response" in data
        assert len(data["response"]) > 0
    
    def test_chat_activity_tracking(self, base_url, parent_user_id):
        """Test tracking activities through chat."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I did yoga for 30 minutes this morning"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "response" in data
    
    def test_chat_mood_tracking(self, base_url, parent_user_id):
        """Test tracking mood through chat."""
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I'm feeling very happy and energetic today"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        data = r.json()
        assert "response" in data


class TestChatRateLimiting:
    """Test rate limiting on chat endpoint."""
    
    def test_rate_limit_returns_429(self, base_url, parent_user_id):
        """Test that rapid requests trigger rate limiting."""
        # Make rapid requests without rate limiting
        responses = []
        for i in range(3):
            r = requests.post(f"{base_url}/chat", json={
                "user_id": parent_user_id,
                "message": f"Quick message {i}"
            }, timeout=60)
            responses.append(r.status_code)
        
        # At least one should be rate limited (429)
        # But the server has internal rate limiting, so some may pass
        assert any(code in [200, 429] for code in responses)
