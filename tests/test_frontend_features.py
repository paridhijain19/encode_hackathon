"""
Tests for Frontend Services and Components
These tests verify the JavaScript/React code structure and exports.
"""
import pytest
import os
import re
import json


class TestServiceFiles:
    """Tests to verify frontend service files exist and have correct structure."""
    
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'services')
    
    def test_realtime_service_exists(self):
        """Test realtime.js exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'realtime.js')
        assert os.path.exists(filepath), "realtime.js should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required exports
        assert 'subscribeToAlerts' in content
        assert 'subscribeToActivities' in content
        assert 'subscribeToMoods' in content
        assert 'subscribeToExpenses' in content
        assert 'subscribeToAllUpdates' in content
        assert 'unsubscribeAll' in content
    
    def test_cometchat_service_exists(self):
        """Test cometchat.js exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'cometchat.js')
        assert os.path.exists(filepath), "cometchat.js should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required exports
        assert 'initCometChat' in content
        assert 'startVoiceCall' in content
        assert 'startVideoCall' in content
        assert 'endCall' in content
        assert 'isCometChatAvailable' in content
    
    def test_auth_service_exists(self):
        """Test auth.js exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'auth.js')
        assert os.path.exists(filepath), "auth.js should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required exports
        assert 'signUpWithEmail' in content
        assert 'signInWithEmail' in content
        assert 'signOut' in content
        assert 'getSession' in content
        assert 'getCurrentUser' in content
        assert 'isSupabaseAuthAvailable' in content
    
    def test_google_calendar_service_exists(self):
        """Test googleCalendar.js exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'googleCalendar.js')
        assert os.path.exists(filepath), "googleCalendar.js should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required exports
        assert 'initGoogleCalendar' in content
        assert 'getCalendarEvents' in content
        assert 'createCalendarEvent' in content
        assert 'isGoogleCalendarAvailable' in content
        assert 'getDemoCalendarEvents' in content


class TestComponentFiles:
    """Tests to verify frontend component files exist and have correct structure."""
    
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'components')
    
    def test_video_call_component_exists(self):
        """Test VideoCall.jsx exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'VideoCall.jsx')
        assert os.path.exists(filepath), "VideoCall.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for component definition
        assert 'export default function VideoCall' in content
        assert 'IncomingCallModal' in content
        assert 'CallFamilyWidget' in content
        
        # Check for required functionality
        assert 'handleEndCall' in content
        assert 'toggleMute' in content
        assert 'toggleVideo' in content
    
    def test_video_call_css_exists(self):
        """Test VideoCall.css exists."""
        filepath = os.path.join(self.BASE_PATH, 'VideoCall.css')
        assert os.path.exists(filepath), "VideoCall.css should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert '.video-call-container' in content
        assert '.call-controls' in content
    
    def test_calendar_component_exists(self):
        """Test Calendar.jsx exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'Calendar.jsx')
        assert os.path.exists(filepath), "Calendar.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for component definition
        assert 'export default function Calendar' in content
        assert 'CalendarWidget' in content
        assert 'AddAppointmentModal' in content
    
    def test_calendar_css_exists(self):
        """Test Calendar.css exists."""
        filepath = os.path.join(self.BASE_PATH, 'Calendar.css')
        assert os.path.exists(filepath), "Calendar.css should exist"
    
    def test_photo_sharing_component_exists(self):
        """Test PhotoSharing.jsx exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'PhotoSharing.jsx')
        assert os.path.exists(filepath), "PhotoSharing.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for component definition
        assert 'export default function PhotoSharing' in content
        assert 'PhotoViewer' in content
        assert 'Slideshow' in content
        assert 'PhotoWidget' in content
    
    def test_photo_sharing_css_exists(self):
        """Test PhotoSharing.css exists."""
        filepath = os.path.join(self.BASE_PATH, 'PhotoSharing.css')
        assert os.path.exists(filepath), "PhotoSharing.css should exist"
    
    def test_smart_home_component_exists(self):
        """Test SmartHome.jsx exists and has required exports."""
        filepath = os.path.join(self.BASE_PATH, 'SmartHome.jsx')
        assert os.path.exists(filepath), "SmartHome.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for component definition
        assert 'export default function SmartHome' in content
        assert 'SmartHomeWidget' in content
        assert 'getSampleDevices' in content
    
    def test_smart_home_css_exists(self):
        """Test SmartHome.css exists."""
        filepath = os.path.join(self.BASE_PATH, 'SmartHome.css')
        assert os.path.exists(filepath), "SmartHome.css should exist"


class TestPageFiles:
    """Tests to verify page files exist and have correct structure."""
    
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'pages')
    
    def test_settings_page_exists(self):
        """Test Settings.jsx exists and has required sections."""
        filepath = os.path.join(self.BASE_PATH, 'Settings.jsx')
        assert os.path.exists(filepath), "Settings.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for component definition
        assert 'export default function Settings' in content
        
        # Check for required sections
        assert 'NotificationSettings' in content
        assert 'MedicationSettings' in content
        assert 'EmergencyContactSettings' in content
        assert 'PrivacySettings' in content
    
    def test_settings_css_exists(self):
        """Test Settings.css exists."""
        filepath = os.path.join(self.BASE_PATH, 'Settings.css')
        assert os.path.exists(filepath), "Settings.css should exist"
    
    def test_family_dashboard_has_realtime(self):
        """Test FamilyDashboard.jsx has realtime integration."""
        filepath = os.path.join(self.BASE_PATH, 'FamilyDashboard.jsx')
        assert os.path.exists(filepath), "FamilyDashboard.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for realtime imports
        assert 'subscribeToAllUpdates' in content
        assert 'unsubscribeAll' in content
        
        # Check for video call integration
        assert 'VideoCall' in content
        assert 'handleStartCall' in content


class TestPWAFiles:
    """Tests to verify PWA files exist and have correct structure."""
    
    BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'public')
    
    def test_manifest_json_exists(self):
        """Test manifest.json exists and is valid JSON."""
        filepath = os.path.join(self.BASE_PATH, 'manifest.json')
        assert os.path.exists(filepath), "manifest.json should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Should be valid JSON
        manifest = json.loads(content)
        
        # Check required fields
        assert 'name' in manifest
        assert 'short_name' in manifest
        assert 'start_url' in manifest
        assert 'display' in manifest
        assert 'icons' in manifest
        
        # Check values
        assert manifest['name'] == 'Amble - AI Family Companion'
        assert manifest['short_name'] == 'Amble'
        assert manifest['display'] == 'standalone'
    
    def test_service_worker_exists(self):
        """Test sw.js exists and has required functionality."""
        filepath = os.path.join(self.BASE_PATH, 'sw.js')
        assert os.path.exists(filepath), "sw.js should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required event listeners
        assert "addEventListener('install'" in content
        assert "addEventListener('activate'" in content
        assert "addEventListener('fetch'" in content
        assert "addEventListener('push'" in content
        
        # Check for caching strategy
        assert 'CACHE_NAME' in content
        assert 'caches.open' in content
    
    def test_offline_html_exists(self):
        """Test offline.html exists."""
        filepath = os.path.join(self.BASE_PATH, 'offline.html')
        assert os.path.exists(filepath), "offline.html should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert "You're Offline" in content or "Offline" in content


class TestAppConfiguration:
    """Tests to verify App.jsx configuration."""
    
    def test_app_jsx_has_routes(self):
        """Test App.jsx has all required routes."""
        filepath = os.path.join(os.path.dirname(__file__), '..', 'src', 'App.jsx')
        assert os.path.exists(filepath), "App.jsx should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required routes
        assert '/settings' in content
        assert '/smart-home' in content
        assert 'Settings' in content
        assert 'SmartHome' in content
        
        # Check for service worker registration
        assert 'serviceWorker' in content
        assert 'registerServiceWorker' in content
    
    def test_index_html_has_pwa_meta(self):
        """Test index.html has PWA meta tags."""
        filepath = os.path.join(os.path.dirname(__file__), '..', 'index.html')
        assert os.path.exists(filepath), "index.html should exist"
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for PWA meta tags
        assert 'manifest.json' in content
        assert 'theme-color' in content
        assert 'apple-mobile-web-app-capable' in content
