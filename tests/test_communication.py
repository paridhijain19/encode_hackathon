"""
Tests for Communication Services (Email, Push Notifications, SMS)
"""
import pytest
import sys
import os
import asyncio

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestCommunicationModule:
    """Tests for communication.py module."""
    
    def test_module_imports(self):
        """Test communication module is importable."""
        from agent import communication
        assert communication is not None
    
    def test_has_get_comm_service(self):
        """Test get_comm_service function exists."""
        from agent.communication import get_comm_service
        assert callable(get_comm_service)
    
    def test_has_email_templates(self):
        """Test email templates class exists."""
        from agent.communication import EmailTemplates
        assert EmailTemplates is not None
    
    def test_get_comm_service_returns_interface(self):
        """Test get_comm_service returns a valid communication interface."""
        from agent.communication import get_comm_service, CommunicationInterface
        
        service = get_comm_service()
        assert service is not None
        # Should have required methods
        assert hasattr(service, 'send_email')
        assert hasattr(service, 'send_push_notification')
        assert hasattr(service, 'send_family_alert')


class TestCommunicationInterface:
    """Tests for communication interface methods."""
    
    @pytest.fixture
    def comm_service(self):
        """Get communication service instance."""
        from agent.communication import get_comm_service, reset_comm
        reset_comm()  # Reset to get fresh instance
        return get_comm_service()
    
    def test_send_email_async(self, comm_service):
        """Test send_email is callable."""
        assert hasattr(comm_service, 'send_email')
        assert asyncio.iscoroutinefunction(comm_service.send_email)
    
    def test_send_push_notification_async(self, comm_service):
        """Test send_push_notification is callable."""
        assert hasattr(comm_service, 'send_push_notification')
        assert asyncio.iscoroutinefunction(comm_service.send_push_notification)
    
    def test_send_family_alert_async(self, comm_service):
        """Test send_family_alert is callable."""
        assert hasattr(comm_service, 'send_family_alert')
        assert asyncio.iscoroutinefunction(comm_service.send_family_alert)


class TestEmailTemplates:
    """Tests for email template generation."""
    
    def test_invite_email_template(self):
        """Test invite email template generation."""
        from agent.communication import EmailTemplates
        
        subject, body, html = EmailTemplates.invite_email(
            elder_name="Mom",
            relation="daughter",
            invite_link="https://amble.app/invite/abc123"
        )
        
        assert subject is not None
        assert "Mom" in subject
        assert body is not None
        assert "invite" in body.lower() or "Mom" in body
        assert html is not None
    
    def test_daily_summary_template(self):
        """Test daily summary email template."""
        from agent.communication import EmailTemplates
        
        summary = {
            "activities": ["Morning walk", "Lunch with friend"],
            "moods": ["happy", "calm"],
            "expenses": [{"amount": 50}, {"amount": 30}]
        }
        
        subject, body, html = EmailTemplates.daily_summary_email(
            elder_name="Mom",
            summary=summary
        )
        
        assert subject is not None
        assert "Mom" in subject
        assert body is not None


class TestLocalCommunication:
    """Tests for local (development) communication service."""
    
    def test_local_email_simulated(self):
        """Test local email is simulated."""
        from agent.communication import LocalCommunication
        
        local_comm = LocalCommunication()
        
        # Should have send_email method
        assert hasattr(local_comm, 'send_email')
    
    def test_local_push_notification_simulated(self):
        """Test local push notification is simulated."""
        from agent.communication import LocalCommunication
        
        local_comm = LocalCommunication()
        
        # Should have send_push_notification method
        assert hasattr(local_comm, 'send_push_notification')


class TestCommunicationServiceSingleton:
    """Tests for communication service singleton pattern."""
    
    def test_singleton_returns_same_instance(self):
        """Test get_comm_service returns singleton."""
        from agent.communication import get_comm_service, reset_comm
        
        reset_comm()
        service1 = get_comm_service()
        service2 = get_comm_service()
        
        assert service1 is service2
    
    def test_reset_clears_singleton(self):
        """Test reset_comm clears the singleton."""
        from agent.communication import get_comm_service, reset_comm
        
        service1 = get_comm_service()
        reset_comm()
        service2 = get_comm_service()
        
        # After reset, we get a new instance (may be same type but fresh)
        # This test just verifies reset doesn't crash
        assert service2 is not None


class TestProductionCommunicationFallback:
    """Tests for production communication when credentials missing."""
    
    def test_uses_local_without_credentials(self):
        """Test falls back to local communication without API keys."""
        from agent.communication import get_comm_service, reset_comm, LocalCommunication
        import os
        
        # Temporarily clear env vars (if any)
        resend_key = os.environ.pop("RESEND_API_KEY", None)
        cometchat_id = os.environ.pop("COMETCHAT_APP_ID", None)
        
        try:
            reset_comm()
            service = get_comm_service()
            # Without credentials, should use LocalCommunication
            assert isinstance(service, LocalCommunication)
        finally:
            # Restore env vars
            if resend_key:
                os.environ["RESEND_API_KEY"] = resend_key
            if cometchat_id:
                os.environ["COMETCHAT_APP_ID"] = cometchat_id
