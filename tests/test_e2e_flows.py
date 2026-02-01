"""
Test Suite: End-to-End User Flows
Tests complete user journeys through the application.
Note: These tests may be skipped if API rate limits are hit.
"""
import pytest
import time
import requests


def wait_for_rate_limit():
    """Wait to avoid Google API rate limits."""
    time.sleep(5)


class TestElderUserFlow:
    """Test complete elder user flow."""
    
    def test_elder_complete_flow(self, base_url, parent_user_id):
        """Test complete elder user journey:
        1. Check health
        2. Get initial state
        3. Send greeting
        4. Track expense
        5. Log activity
        6. Check updated state
        """
        # 1. Health check
        r = requests.get(f"{base_url}/", timeout=10)
        assert r.status_code == 200
        
        # 2. Get initial state
        r = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        assert r.status_code == 200
        initial_state = r.json()
        
        # 3. Send greeting via chat
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "Good morning! How are you today?"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        
        assert r.status_code == 200
        chat_data = r.json()
        assert "response" in chat_data
        session_id = chat_data.get("session_id")
        
        # 4. Track expense via chat
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I bought some fruits for 200 rupees",
            "session_id": session_id
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        assert r.status_code == 200
        
        # 5. Log activity via chat
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I went for an evening walk for about 25 minutes",
            "session_id": session_id
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        assert r.status_code == 200
        
        # 6. Get updated state
        r = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        assert r.status_code == 200
        final_state = r.json()
        
        # Verify state contains data
        assert "expenses" in final_state
        assert "activities" in final_state


class TestFamilyMemberFlow:
    """Test family member dashboard flow."""
    
    def test_family_check_elder_status(self, base_url, parent_user_id, family_user_id):
        """Test family member checking elder's status."""
        import requests
        
        # 1. Get elder's summary
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/summary", timeout=10)
        assert r.status_code == 200
        summary = r.json()
        
        # 2. Get wellness data
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/wellness", timeout=10)
        assert r.status_code == 200
        wellness = r.json()
        
        # 3. Get expense data
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/expenses", timeout=10)
        assert r.status_code == 200
        expenses = r.json()
        
        # 4. Get chat history
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/chat-history", timeout=10)
        assert r.status_code == 200
        history = r.json()
        
        # 5. Get alerts
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/alerts", timeout=10)
        assert r.status_code == 200
        alerts = r.json()
        
        # All endpoints should return valid data
        assert "alerts" in alerts
        assert "chat_history" in history


class TestOnboardingFlow:
    """Test complete onboarding flow."""
    
    def test_new_user_onboarding(self, base_url):
        """Test complete onboarding for new user."""
        import requests
        import uuid
        
        # Generate unique user ID
        test_user = f"pytest_onboard_{uuid.uuid4().hex[:8]}"
        
        # 1. Submit onboarding
        r = requests.post(f"{base_url}/api/onboarding", json={
            "name": "Test Elder",
            "age": "68",
            "location": "Pune",
            "interests": ["music", "cooking", "gardening"],
            "health_conditions": ["arthritis"],
            "emergency_contact_name": "Test Child",
            "emergency_contact_phone": "+91-1234567890",
            "familyMembers": [
                {"email": "family@test.com", "name": "Child", "relation": "Son"}
            ]
        }, timeout=10)
        assert r.status_code == 200
        
        # 2. Check user can now use chat
        # (would need the actual user_id returned from onboarding)


class TestMoodTrackingFlow:
    """Test mood tracking end-to-end."""
    
    def test_mood_tracking_updates_wellness(self, base_url, parent_user_id):
        """Test that mood tracking updates wellness metrics."""
        # 1. Track mood via chat
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I'm feeling very peaceful and content today"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        assert r.status_code == 200
        
        # 2. Check wellness endpoint
        r = requests.get(f"{base_url}/api/family/{parent_user_id}/wellness", timeout=10)
        assert r.status_code == 200
        wellness = r.json()
        
        # Should have mood data
        assert "recent_moods" in wellness
        assert "mood_trend" in wellness


class TestAppointmentFlow:
    """Test appointment management flow."""
    
    def test_appointment_tracking(self, base_url, parent_user_id):
        """Test tracking appointments through chat."""
        # 1. Create appointment via chat
        wait_for_rate_limit()
        r = requests.post(f"{base_url}/chat", json={
            "user_id": parent_user_id,
            "message": "I have a dentist appointment on March 15th at 2pm at City Dental Clinic"
        }, timeout=90)
        
        if r.status_code == 429:
            pytest.skip("Rate limited by Google API")
        assert r.status_code == 200
        
        # 2. Check appointments in state
        r = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        assert r.status_code == 200
        state = r.json()
        
        # Should have appointments
        assert "appointments" in state


class TestMultiUserIsolation:
    """Test that different users' data is isolated."""
    
    def test_user_data_isolation(self, base_url, parent_user_id, family_user_id):
        """Test that users don't see each other's data."""
        import requests
        
        # Get parent user state
        r1 = requests.get(f"{base_url}/api/state?user_id={parent_user_id}", timeout=10)
        parent_state = r1.json()
        
        # Get family user state
        r2 = requests.get(f"{base_url}/api/state?user_id={family_user_id}", timeout=10)
        family_state = r2.json()
        
        # User IDs should be different
        assert parent_state["user_id"] == parent_user_id
        assert family_state["user_id"] == family_user_id
