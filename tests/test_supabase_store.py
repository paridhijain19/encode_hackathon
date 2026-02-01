"""
Test Suite: Supabase Data Store
Tests the Supabase integration directly.
"""
import pytest
import sys
import os

# Add agent folder to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestSupabaseConnection:
    """Test Supabase client connection."""
    
    def test_client_initialization(self):
        """Test Supabase client can be initialized."""
        from agent.supabase_store import get_supabase_client
        client = get_supabase_client()
        assert client is not None
    
    def test_client_singleton(self):
        """Test Supabase client is singleton."""
        from agent.supabase_store import get_supabase_client
        client1 = get_supabase_client()
        client2 = get_supabase_client()
        assert client1 is client2


class TestSessionManagement:
    """Test session CRUD operations."""
    
    def test_save_and_get_session(self):
        """Test saving and retrieving a session."""
        from agent.supabase_store import save_session, get_session
        
        test_user = "pytest_session_user"
        test_session = "pytest-session-12345"
        
        # Save session
        result = save_session(test_user, test_session)
        assert result == True
        
        # Get session back
        retrieved = get_session(test_user)
        assert retrieved == test_session
    
    def test_delete_session(self):
        """Test deleting a session."""
        from agent.supabase_store import save_session, delete_session, get_session
        
        test_user = "pytest_delete_session"
        test_session = "to-be-deleted"
        
        # Save first
        save_session(test_user, test_session)
        
        # Delete
        result = delete_session(test_user)
        assert result == True


class TestProfileManagement:
    """Test profile CRUD operations."""
    
    def test_save_and_get_profile(self):
        """Test saving and retrieving a profile."""
        from agent.supabase_store import save_profile, get_profile
        
        test_user = "pytest_profile_user"
        test_profile = {
            "name": "Pytest User",
            "location": "Test City",
            "age": 65,
            "interests": ["testing", "python"]
        }
        
        # Save profile
        result = save_profile(test_user, test_profile)
        assert result == True
        
        # Get profile back
        retrieved = get_profile(test_user)
        assert retrieved is not None
        assert retrieved["name"] == "Pytest User"
        assert retrieved["location"] == "Test City"
    
    def test_update_profile(self):
        """Test updating an existing profile."""
        from agent.supabase_store import save_profile, get_profile
        
        test_user = "pytest_update_profile"
        
        # Create initial
        save_profile(test_user, {"name": "Original", "location": "City A"})
        
        # Update
        save_profile(test_user, {"name": "Updated", "location": "City B"})
        
        # Verify update
        retrieved = get_profile(test_user)
        assert retrieved["name"] == "Updated"
        assert retrieved["location"] == "City B"


class TestExpenseTracking:
    """Test expense CRUD operations."""
    
    def test_save_expense(self):
        """Test saving an expense."""
        from agent.supabase_store import save_expense, get_expenses
        
        test_user = "pytest_expense_user"
        
        result = save_expense(
            user_id=test_user,
            amount=100.50,
            category="groceries",
            description="Test groceries",
            date="2026-02-01"
        )
        assert result == True
    
    def test_get_expenses(self):
        """Test retrieving expenses."""
        from agent.supabase_store import save_expense, get_expenses
        
        test_user = "pytest_get_expenses"
        
        # Save a test expense
        save_expense(test_user, 50.0, "food", "Test food")
        
        # Retrieve
        expenses = get_expenses(test_user)
        assert isinstance(expenses, list)
    
    def test_expenses_period_filter(self):
        """Test expenses with period filter."""
        from agent.supabase_store import get_expenses
        
        test_user = "parent_user"
        
        # Test different periods
        for period in ["today", "week", "month", "all"]:
            expenses = get_expenses(test_user, period=period)
            assert isinstance(expenses, list)


class TestActivityTracking:
    """Test activity CRUD operations."""
    
    def test_save_activity(self):
        """Test saving an activity."""
        from agent.supabase_store import save_activity
        
        test_user = "pytest_activity_user"
        
        result = save_activity(
            user_id=test_user,
            activity_type="walking",
            description="Morning walk",
            duration_minutes=30
        )
        assert result == True
    
    def test_get_activities(self):
        """Test retrieving activities."""
        from agent.supabase_store import get_activities
        
        test_user = "parent_user"
        activities = get_activities(test_user)
        assert isinstance(activities, list)


class TestMoodTracking:
    """Test mood CRUD operations."""
    
    def test_save_mood(self):
        """Test saving a mood entry."""
        from agent.supabase_store import save_mood
        
        test_user = "pytest_mood_user"
        
        result = save_mood(
            user_id=test_user,
            rating="happy",
            notes="Feeling great"
        )
        assert result == True
    
    def test_get_moods(self):
        """Test retrieving moods."""
        from agent.supabase_store import get_moods
        
        test_user = "parent_user"
        moods = get_moods(test_user)
        assert isinstance(moods, list)


class TestAppointments:
    """Test appointment CRUD operations."""
    
    def test_save_appointment(self):
        """Test saving an appointment."""
        from agent.supabase_store import save_appointment
        
        test_user = "pytest_appt_user"
        
        result = save_appointment(
            user_id=test_user,
            title="Doctor Visit",
            description="Annual checkup",
            date="2026-03-01",
            time="10:00",
            location="City Hospital"
        )
        assert result == True
    
    def test_get_appointments(self):
        """Test retrieving appointments."""
        from agent.supabase_store import get_appointments
        
        test_user = "parent_user"
        appointments = get_appointments(test_user)
        assert isinstance(appointments, list)


class TestAlerts:
    """Test alert CRUD operations."""
    
    def test_save_alert(self):
        """Test saving an alert."""
        from agent.supabase_store import save_alert
        
        test_user = "pytest_alert_user"
        
        result = save_alert(
            user_id=test_user,
            alert_type="info",
            message="Test alert message"
        )
        assert result == True
    
    def test_get_alerts(self):
        """Test retrieving alerts."""
        from agent.supabase_store import get_alerts
        
        test_user = "parent_user"
        alerts = get_alerts(test_user)
        assert isinstance(alerts, list)


class TestChatHistory:
    """Test chat history operations."""
    
    def test_save_chat(self):
        """Test saving chat message."""
        from agent.supabase_store import save_chat
        
        test_user = "pytest_chat_user"
        
        result = save_chat(
            user_id=test_user,
            session_id="pytest-session",
            user_message="Hello",
            agent_response="Hi there!"
        )
        assert result == True
    
    def test_get_chat_history(self):
        """Test retrieving chat history."""
        from agent.supabase_store import get_chat_history
        
        test_user = "parent_user"
        history = get_chat_history(test_user)
        assert isinstance(history, list)


class TestFamilySummary:
    """Test family summary function."""
    
    def test_get_family_summary(self):
        """Test getting comprehensive family summary."""
        from agent.supabase_store import get_family_summary
        
        summary = get_family_summary("parent_user")
        assert isinstance(summary, dict)
        
        # Should contain all expected keys
        expected_keys = ["user_profile", "activities", "expenses", "moods", "appointments", "alerts"]
        for key in expected_keys:
            assert key in summary


class TestWellnessData:
    """Test wellness data function."""
    
    def test_get_wellness_data(self):
        """Test getting wellness metrics."""
        from agent.supabase_store import get_wellness_data
        
        wellness = get_wellness_data("parent_user")
        assert isinstance(wellness, dict)
        
        # Should contain wellness metrics
        assert "mood_distribution" in wellness
        assert "activity_counts" in wellness
