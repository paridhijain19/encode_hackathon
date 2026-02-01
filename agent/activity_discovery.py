"""
Activity Discovery Service for Amble

Provides local event and activity discovery using web search.
Helps elderly users find community events, classes, and social activities.
"""

import os
import json
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class ActivityDiscoveryService:
    """
    Service for discovering local activities and events.
    Uses Google Custom Search API or falls back to curated suggestions.
    """
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.google_search_cx = os.getenv("GOOGLE_SEARCH_CX")  # Custom Search Engine ID
        self.has_search = bool(self.google_api_key and self.google_search_cx)
        
        if self.has_search:
            print("[Activity Discovery] Google Search API configured")
        else:
            print("[Activity Discovery] Using curated suggestions (no Google API)")
    
    async def search_local_events(
        self,
        location: str,
        interests: List[str] = None,
        event_type: str = "community"
    ) -> Dict:
        """
        Search for local events and activities.
        
        Args:
            location: City or area name
            interests: User's interests for better recommendations
            event_type: Type of event (community, fitness, social, religious, hobby)
            
        Returns:
            Dictionary with events and suggestions
        """
        if self.has_search:
            return await self._search_with_google(location, interests, event_type)
        else:
            return self._get_curated_suggestions(location, interests, event_type)
    
    async def _search_with_google(
        self,
        location: str,
        interests: List[str],
        event_type: str
    ) -> Dict:
        """Search using Google Custom Search API."""
        
        # Build search query
        interest_terms = " ".join(interests[:3]) if interests else "senior activities"
        query = f"{event_type} events for seniors {interest_terms} near {location}"
        
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.google_api_key,
            "cx": self.google_search_cx,
            "q": query,
            "num": 5
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                events = []
                for item in data.get("items", []):
                    events.append({
                        "title": item.get("title", ""),
                        "description": item.get("snippet", ""),
                        "link": item.get("link", ""),
                        "source": item.get("displayLink", "")
                    })
                
                return {
                    "status": "success",
                    "source": "google_search",
                    "events": events,
                    "query": query,
                    "location": location
                }
        except Exception as e:
            print(f"[Activity Discovery] Google search error: {e}")
            return self._get_curated_suggestions(location, interests, event_type)
    
    def _get_curated_suggestions(
        self,
        location: str,
        interests: List[str],
        event_type: str
    ) -> Dict:
        """Return curated activity suggestions based on interests."""
        
        # Activity database organized by type
        activity_database = {
            "fitness": [
                {
                    "title": "Morning Yoga for Seniors",
                    "description": "Gentle yoga sessions designed for flexibility and balance. Perfect for beginners.",
                    "time": "9:00 AM - 10:00 AM",
                    "frequency": "Daily",
                    "category": "fitness"
                },
                {
                    "title": "Walking Group",
                    "description": "Join a friendly group for morning walks in the park. Great for socializing!",
                    "time": "7:30 AM",
                    "frequency": "Mon, Wed, Fri",
                    "category": "fitness"
                },
                {
                    "title": "Chair Exercises Class",
                    "description": "Low-impact exercises you can do while seated. Great for mobility.",
                    "time": "11:00 AM",
                    "frequency": "Tue, Thu",
                    "category": "fitness"
                },
                {
                    "title": "Swimming for Seniors",
                    "description": "Aqua aerobics and lap swimming at the community pool.",
                    "time": "10:00 AM - 11:30 AM",
                    "frequency": "Daily",
                    "category": "fitness"
                }
            ],
            "social": [
                {
                    "title": "Community Tea & Chat",
                    "description": "Weekly gathering for tea, snacks, and good conversation.",
                    "time": "3:00 PM - 5:00 PM",
                    "frequency": "Every Saturday",
                    "category": "social"
                },
                {
                    "title": "Book Club",
                    "description": "Monthly book discussions with like-minded readers.",
                    "time": "2:00 PM",
                    "frequency": "First Sunday",
                    "category": "social"
                },
                {
                    "title": "Lunch Bunch",
                    "description": "Group lunch outings to local restaurants.",
                    "time": "12:00 PM",
                    "frequency": "Wednesdays",
                    "category": "social"
                }
            ],
            "hobby": [
                {
                    "title": "Art & Painting Workshop",
                    "description": "Express yourself through watercolors and sketching. No experience needed!",
                    "time": "2:00 PM - 4:00 PM",
                    "frequency": "Thursdays",
                    "category": "hobby"
                },
                {
                    "title": "Gardening Club",
                    "description": "Learn gardening tips and maintain community gardens together.",
                    "time": "9:00 AM - 11:00 AM",
                    "frequency": "Saturdays",
                    "category": "hobby"
                },
                {
                    "title": "Bridge & Card Games",
                    "description": "Friendly card games for all skill levels.",
                    "time": "1:00 PM - 4:00 PM",
                    "frequency": "Mon, Wed, Fri",
                    "category": "hobby"
                },
                {
                    "title": "Photography Class",
                    "description": "Learn to take beautiful photos with your phone or camera.",
                    "time": "10:00 AM",
                    "frequency": "Tuesdays",
                    "category": "hobby"
                }
            ],
            "religious": [
                {
                    "title": "Morning Prayer Group",
                    "description": "Start your day with peaceful prayers and meditation.",
                    "time": "6:00 AM - 7:00 AM",
                    "frequency": "Daily",
                    "category": "religious"
                },
                {
                    "title": "Temple/Church Visit Group",
                    "description": "Weekly group visits to local places of worship.",
                    "time": "Varies",
                    "frequency": "Weekends",
                    "category": "religious"
                },
                {
                    "title": "Bhajan/Hymn Singing",
                    "description": "Community devotional singing sessions.",
                    "time": "5:00 PM - 6:30 PM",
                    "frequency": "Sundays",
                    "category": "religious"
                }
            ],
            "learning": [
                {
                    "title": "Smartphone Basics Class",
                    "description": "Learn to use your phone for video calls, photos, and apps.",
                    "time": "11:00 AM - 12:00 PM",
                    "frequency": "Tuesdays",
                    "category": "learning"
                },
                {
                    "title": "Health & Wellness Talk",
                    "description": "Monthly talks by doctors on staying healthy.",
                    "time": "3:00 PM",
                    "frequency": "Last Saturday",
                    "category": "learning"
                },
                {
                    "title": "Language Learning Circle",
                    "description": "Practice English or learn a new language with peers.",
                    "time": "10:00 AM",
                    "frequency": "Thursdays",
                    "category": "learning"
                }
            ],
            "community": [
                {
                    "title": "Senior Center Open House",
                    "description": "Visit your local senior center for activities, meals, and services.",
                    "time": "9:00 AM - 5:00 PM",
                    "frequency": "Weekdays",
                    "category": "community"
                },
                {
                    "title": "Volunteer Opportunities",
                    "description": "Give back by helping at local charities and events.",
                    "time": "Flexible",
                    "frequency": "Various",
                    "category": "community"
                },
                {
                    "title": "Community Movie Afternoon",
                    "description": "Free classic movie screenings with popcorn!",
                    "time": "2:00 PM",
                    "frequency": "Fridays",
                    "category": "community"
                }
            ]
        }
        
        # Get relevant activities
        relevant = []
        
        # Add activities from requested type
        if event_type in activity_database:
            relevant.extend(activity_database[event_type][:3])
        
        # Add activities matching user interests
        if interests:
            interest_keywords = {
                "yoga": "fitness",
                "walking": "fitness",
                "exercise": "fitness",
                "reading": "social",
                "books": "social",
                "art": "hobby",
                "painting": "hobby",
                "gardening": "hobby",
                "prayer": "religious",
                "temple": "religious",
                "church": "religious",
                "technology": "learning",
                "cooking": "hobby"
            }
            
            for interest in interests:
                interest_lower = interest.lower()
                for keyword, category in interest_keywords.items():
                    if keyword in interest_lower and category in activity_database:
                        for activity in activity_database[category]:
                            if activity not in relevant:
                                relevant.append(activity)
                                break
        
        # If still not enough, add general community activities
        if len(relevant) < 3:
            for activity in activity_database.get("community", []):
                if activity not in relevant:
                    relevant.append(activity)
                if len(relevant) >= 5:
                    break
        
        return {
            "status": "success",
            "source": "curated",
            "events": relevant[:5],
            "location": location,
            "message": f"Here are some activities you might enjoy in {location}!"
        }
    
    async def get_activity_for_mood(self, mood: str, energy_level: int) -> Dict:
        """
        Suggest activities based on current mood and energy.
        
        Args:
            mood: Current mood (happy, sad, tired, anxious, etc.)
            energy_level: 1-10 scale
            
        Returns:
            Activity suggestions appropriate for current state
        """
        
        # Activity suggestions by mood/energy
        suggestions = {
            "low_energy": [
                "Listen to your favorite music or podcast",
                "Do some gentle stretching in your chair",
                "Call a friend or family member for a chat",
                "Watch a comforting movie or TV show",
                "Read a book or magazine"
            ],
            "medium_energy": [
                "Take a short walk around your home or garden",
                "Do a simple puzzle or crossword",
                "Practice some light yoga or breathing exercises",
                "Cook or prepare a healthy snack",
                "Water your plants or do light gardening"
            ],
            "high_energy": [
                "Go for a morning walk in the park",
                "Join a group exercise or yoga class",
                "Visit a friend or neighbor",
                "Work on a hobby project",
                "Volunteer at a local community center"
            ],
            "sad": [
                "Call someone who makes you smile",
                "Look through happy photos",
                "Step outside for fresh air and sunlight",
                "Listen to uplifting music",
                "Write in a gratitude journal"
            ],
            "anxious": [
                "Practice deep breathing exercises",
                "Take a slow, mindful walk",
                "Listen to calming music or nature sounds",
                "Do a simple repetitive task (knitting, coloring)",
                "Talk to someone you trust"
            ]
        }
        
        # Determine which suggestions to use
        mood_lower = mood.lower()
        
        if mood_lower in ["sad", "lonely", "down", "depressed"]:
            relevant = suggestions["sad"]
        elif mood_lower in ["anxious", "worried", "stressed", "nervous"]:
            relevant = suggestions["anxious"]
        elif energy_level <= 3:
            relevant = suggestions["low_energy"]
        elif energy_level <= 6:
            relevant = suggestions["medium_energy"]
        else:
            relevant = suggestions["high_energy"]
        
        return {
            "status": "success",
            "suggestions": relevant,
            "mood": mood,
            "energy_level": energy_level,
            "message": "Here are some activities that might help you feel better!"
        }


# Singleton instance
_discovery_service: Optional[ActivityDiscoveryService] = None

def get_activity_discovery() -> ActivityDiscoveryService:
    """Get the activity discovery service singleton."""
    global _discovery_service
    if _discovery_service is None:
        _discovery_service = ActivityDiscoveryService()
    return _discovery_service
