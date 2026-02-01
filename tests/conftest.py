"""
Pytest configuration and fixtures for Amble test suite.
"""
import pytest
import requests
import time

BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_pytest"
PARENT_USER_ID = "parent_user"
FAMILY_USER_ID = "family_sarah"

# Rate limiting helper
_last_request_time = 0
MIN_REQUEST_INTERVAL = 2.5  # seconds between requests to avoid 429


def rate_limited_request(method, url, **kwargs):
    """Make a rate-limited request to avoid 429 errors."""
    global _last_request_time
    
    current_time = time.time()
    time_since_last = current_time - _last_request_time
    if time_since_last < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - time_since_last)
    
    _last_request_time = time.time()
    
    if method == "GET":
        return requests.get(url, **kwargs)
    elif method == "POST":
        return requests.post(url, **kwargs)
    elif method == "PUT":
        return requests.put(url, **kwargs)
    elif method == "DELETE":
        return requests.delete(url, **kwargs)


@pytest.fixture(scope="session")
def base_url():
    """Base URL for API requests."""
    return BASE_URL


@pytest.fixture(scope="session")
def test_user_id():
    """Test user ID."""
    return TEST_USER_ID


@pytest.fixture(scope="session")
def parent_user_id():
    """Parent user ID."""
    return PARENT_USER_ID


@pytest.fixture(scope="session")
def family_user_id():
    """Family member user ID."""
    return FAMILY_USER_ID


@pytest.fixture(scope="session")
def api_client():
    """Returns a rate-limited request function."""
    return rate_limited_request


@pytest.fixture(scope="session", autouse=True)
def check_server_running(base_url):
    """Ensure the server is running before tests."""
    try:
        r = requests.get(f"{base_url}/", timeout=5)
        if r.status_code != 200:
            pytest.skip("Backend server not running")
    except requests.exceptions.ConnectionError:
        pytest.skip("Backend server not running on localhost:8000")
