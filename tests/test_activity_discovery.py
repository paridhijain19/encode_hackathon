"""
Tests for Activity Discovery Service
"""
import pytest
import sys
import os
import asyncio

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agent.activity_discovery import ActivityDiscoveryService


class TestActivityDiscoveryService:
    """Tests for activity discovery functionality."""
    
    @pytest.fixture
    def service(self):
        """Create activity discovery service instance."""
        return ActivityDiscoveryService()
    
    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert hasattr(service, 'search_local_events')
        assert hasattr(service, 'get_activity_for_mood')
    
    def test_curated_suggestions_exist(self, service):
        """Test that curated suggestions are available."""
        suggestions = service._get_curated_suggestions("New York", None, "social")
        assert suggestions is not None
        assert 'events' in suggestions or 'status' in suggestions
    
    def test_get_activity_for_mood_happy(self, service):
        """Test activity suggestions for happy mood."""
        result = asyncio.run(service.get_activity_for_mood('happy', energy_level=8))
        assert result is not None
        assert 'suggestions' in result
        assert len(result['suggestions']) > 0
    
    def test_get_activity_for_mood_sad(self, service):
        """Test activity suggestions for sad mood."""
        result = asyncio.run(service.get_activity_for_mood('sad', energy_level=3))
        assert result is not None
        assert 'suggestions' in result
    
    def test_get_activity_for_mood_anxious(self, service):
        """Test activity suggestions for anxious mood."""
        result = asyncio.run(service.get_activity_for_mood('anxious', energy_level=5))
        assert result is not None
        assert 'suggestions' in result
    
    def test_get_activity_for_mood_tired(self, service):
        """Test activity suggestions for tired mood."""
        result = asyncio.run(service.get_activity_for_mood('tired', energy_level=2))
        assert result is not None
        assert 'suggestions' in result
    
    def test_get_activity_for_mood_unknown(self, service):
        """Test activity suggestions for unknown mood defaults gracefully."""
        result = asyncio.run(service.get_activity_for_mood('unknown_mood', energy_level=5))
        assert result is not None
        # Should still return some suggestions
        assert 'suggestions' in result
    
    def test_search_local_events_returns_structure(self, service):
        """Test search_local_events returns proper structure."""
        result = asyncio.run(service.search_local_events(
            location="San Francisco, CA",
            interests=["social"],
            event_type="social"
        ))
        assert result is not None
        assert 'status' in result or 'events' in result
    
    def test_curated_fitness_suggestions(self, service):
        """Test fitness category suggestions exist."""
        suggestions = service._get_curated_suggestions("Chicago", None, "fitness")
        assert suggestions is not None
        assert 'events' in suggestions or 'status' in suggestions
    
    def test_curated_social_suggestions(self, service):
        """Test social category suggestions exist."""
        suggestions = service._get_curated_suggestions("Denver", None, "social")
        assert suggestions is not None
    
    def test_curated_hobby_suggestions(self, service):
        """Test hobby category suggestions exist."""
        suggestions = service._get_curated_suggestions("Boston", None, "hobby")
        assert suggestions is not None
    
    def test_mood_suggestions_low_energy(self, service):
        """Test suggestions for low energy."""
        result = asyncio.run(service.get_activity_for_mood('okay', energy_level=2))
        assert 'suggestions' in result
        # Low energy suggestions should be gentle
        assert len(result['suggestions']) > 0
    
    def test_mood_suggestions_high_energy(self, service):
        """Test suggestions for high energy."""
        result = asyncio.run(service.get_activity_for_mood('happy', energy_level=9))
        assert 'suggestions' in result
        assert len(result['suggestions']) > 0


class TestActivityDiscoveryIntegration:
    """Integration tests for activity discovery module."""
    
    def test_module_imports(self):
        """Test that activity discovery module is importable."""
        from agent.activity_discovery import ActivityDiscoveryService
        from agent.activity_discovery import get_activity_discovery
        
        assert ActivityDiscoveryService is not None
        assert callable(get_activity_discovery)
    
    def test_singleton_pattern(self):
        """Test get_activity_discovery returns singleton."""
        from agent.activity_discovery import get_activity_discovery
        
        service1 = get_activity_discovery()
        service2 = get_activity_discovery()
        assert service1 is service2
    
    def test_tools_has_activity_functions(self):
        """Test tools.py has the activity discovery functions."""
        from agent import tools
        
        assert hasattr(tools, 'search_local_activities')
        assert hasattr(tools, 'get_mood_based_suggestions')
        assert callable(tools.search_local_activities)
        assert callable(tools.get_mood_based_suggestions)
