-- =============================================
-- AMBLE - Demo Seed Data
-- =============================================
-- Creates 4 realistic personas with mock data:
-- - 2 Indian elders (Padma Sharma, Rajesh Kumar)
-- - 2 British elders (Margaret Thompson, George Williams)
-- 
-- SETUP ORDER:
-- 1. Run schema_final.sql (create tables)
-- 2. Run migration_phase4_family_linking.sql (add family linking)
-- 3. Run cleanup_old_data.sql (remove test data)
-- 4. Run this file (seed_demo_data.sql)
-- =============================================

-- =============================================
-- USER PROFILES
-- =============================================

-- Indian Elder 1: Padma Sharma (Female, 68, Mumbai)
INSERT INTO user_profiles (user_id, name, location, role, preferences) VALUES
('padma_sharma', 'Padma Sharma', 'Mumbai, India', 'parent', '{
    "age": 68,
    "gender": "female",
    "avatar": "👵",
    "interests": ["yoga", "cooking", "temple", "reading", "grandchildren"],
    "languages": ["Hindi", "Marathi", "English"],
    "health_conditions": ["mild arthritis", "controlled diabetes"],
    "medications": ["Metformin 500mg", "Calcium supplements"],
    "emergency_contact": {"name": "Anita Sharma", "relation": "daughter", "phone": "+91-9876543210"},
    "family_members": [
        {"name": "Anita", "relation": "daughter", "avatar": "👩", "phone": "+91-9876543210"},
        {"name": "Vikram", "relation": "son", "avatar": "👨", "phone": "+91-9876543211"}
    ],
    "wake_time": "05:30",
    "sleep_time": "21:30",
    "onboarded": true
}'::jsonb);

-- Indian Elder 2: Rajesh Kumar (Male, 72, Delhi)
INSERT INTO user_profiles (user_id, name, location, role, preferences) VALUES
('rajesh_kumar', 'Rajesh Kumar', 'New Delhi, India', 'parent', '{
    "age": 72,
    "gender": "male",
    "avatar": "👴",
    "interests": ["cricket", "reading newspapers", "morning walks", "chess", "gardening"],
    "languages": ["Hindi", "English", "Punjabi"],
    "health_conditions": ["hypertension", "mild hearing loss"],
    "medications": ["Amlodipine 5mg", "Aspirin 75mg"],
    "emergency_contact": {"name": "Priya Kumar", "relation": "daughter", "phone": "+91-9988776655"},
    "family_members": [
        {"name": "Priya", "relation": "daughter", "avatar": "👩", "phone": "+91-9988776655"},
        {"name": "Suresh", "relation": "son", "avatar": "👨", "phone": "+91-9988776656"}
    ],
    "wake_time": "05:00",
    "sleep_time": "22:00",
    "onboarded": true
}'::jsonb);

-- British Elder 1: Margaret Thompson (Female, 75, London)
INSERT INTO user_profiles (user_id, name, location, role, preferences) VALUES
('margaret_thompson', 'Margaret Thompson', 'London, UK', 'parent', '{
    "age": 75,
    "gender": "female",
    "avatar": "👵",
    "interests": ["gardening", "baking", "church", "knitting", "grandchildren", "afternoon tea"],
    "languages": ["English"],
    "health_conditions": ["osteoporosis", "slight vision impairment"],
    "medications": ["Vitamin D", "Alendronic acid"],
    "emergency_contact": {"name": "Sarah Thompson", "relation": "daughter", "phone": "+44-7700900123"},
    "family_members": [
        {"name": "Sarah", "relation": "daughter", "avatar": "👩", "phone": "+44-7700900123"},
        {"name": "James", "relation": "son", "avatar": "👨", "phone": "+44-7700900124"}
    ],
    "wake_time": "07:00",
    "sleep_time": "22:30",
    "onboarded": true
}'::jsonb);

-- British Elder 2: George Williams (Male, 70, Manchester)
INSERT INTO user_profiles (user_id, name, location, role, preferences) VALUES
('george_williams', 'George Williams', 'Manchester, UK', 'parent', '{
    "age": 70,
    "gender": "male",
    "avatar": "👴",
    "interests": ["football", "pub quizzes", "crosswords", "woodworking", "walking the dog"],
    "languages": ["English"],
    "health_conditions": ["type 2 diabetes", "back pain"],
    "medications": ["Metformin 500mg", "Paracetamol as needed"],
    "emergency_contact": {"name": "Emma Williams", "relation": "daughter", "phone": "+44-7700900456"},
    "family_members": [
        {"name": "Emma", "relation": "daughter", "avatar": "👩", "phone": "+44-7700900456"},
        {"name": "Tom", "relation": "son", "avatar": "👨", "phone": "+44-7700900457"}
    ],
    "wake_time": "07:30",
    "sleep_time": "23:00",
    "onboarded": true
}'::jsonb);

-- Family member accounts (linked to elders)
INSERT INTO user_profiles (user_id, name, location, role, linked_elder_id, preferences) VALUES
('anita_sharma', 'Anita Sharma', 'Mumbai, India', 'family', 'padma_sharma', '{"relation": "daughter", "avatar": "👩"}'::jsonb),
('sarah_thompson', 'Sarah Thompson', 'London, UK', 'family', 'margaret_thompson', '{"relation": "daughter", "avatar": "👩"}'::jsonb);

-- =============================================
-- ACTIVITIES - Padma Sharma (Indian, spiritual & wellness focused)
-- =============================================
INSERT INTO activities (user_id, activity_type, description, duration_minutes, timestamp) VALUES
('padma_sharma', 'yoga', 'Morning yoga and pranayama', 45, NOW() - INTERVAL '1 day' + TIME '06:00'),
('padma_sharma', 'prayer', 'Morning puja and meditation', 30, NOW() - INTERVAL '1 day' + TIME '06:45'),
('padma_sharma', 'walking', 'Walk to nearby temple', 20, NOW() - INTERVAL '1 day' + TIME '08:00'),
('padma_sharma', 'cooking', 'Made lunch - dal, rice and sabzi', 60, NOW() - INTERVAL '1 day' + TIME '11:00'),
('padma_sharma', 'social', 'Video call with grandchildren in Bangalore', 40, NOW() - INTERVAL '1 day' + TIME '17:00'),
('padma_sharma', 'reading', 'Read Bhagavad Gita', 30, NOW() - INTERVAL '1 day' + TIME '20:00'),
('padma_sharma', 'yoga', 'Evening stretching exercises', 20, NOW() - INTERVAL '2 days' + TIME '18:00'),
('padma_sharma', 'social', 'Kitty party at Mrs. Joshi house', 120, NOW() - INTERVAL '3 days' + TIME '15:00'),
('padma_sharma', 'walking', 'Morning walk in Joggers Park', 35, NOW() - INTERVAL '4 days' + TIME '06:30'),
('padma_sharma', 'cooking', 'Made special laddoos for festival', 90, NOW() - INTERVAL '5 days' + TIME '10:00');

-- =============================================
-- ACTIVITIES - Rajesh Kumar (Indian, active retired professional)
-- =============================================
INSERT INTO activities (user_id, activity_type, description, duration_minutes, timestamp) VALUES
('rajesh_kumar', 'walking', 'Morning walk in Lodhi Garden', 45, NOW() - INTERVAL '1 day' + TIME '05:30'),
('rajesh_kumar', 'reading', 'Read The Hindu and Hindustan Times', 60, NOW() - INTERVAL '1 day' + TIME '07:00'),
('rajesh_kumar', 'exercise', 'Light exercises and stretching', 20, NOW() - INTERVAL '1 day' + TIME '08:30'),
('rajesh_kumar', 'social', 'Chess at the community center', 90, NOW() - INTERVAL '1 day' + TIME '16:00'),
('rajesh_kumar', 'gardening', 'Watered plants and pruned roses', 40, NOW() - INTERVAL '1 day' + TIME '17:30'),
('rajesh_kumar', 'television', 'Watched India vs Australia cricket match', 180, NOW() - INTERVAL '2 days' + TIME '14:00'),
('rajesh_kumar', 'social', 'Met old colleagues for chai', 120, NOW() - INTERVAL '3 days' + TIME '11:00'),
('rajesh_kumar', 'reading', 'Finished autobiography of APJ Abdul Kalam', 45, NOW() - INTERVAL '4 days' + TIME '20:00'),
('rajesh_kumar', 'walking', 'Evening walk with neighbor Sharma ji', 30, NOW() - INTERVAL '5 days' + TIME '18:00'),
('rajesh_kumar', 'prayer', 'Visited Hanuman Temple', 45, NOW() - INTERVAL '6 days' + TIME '09:00');

-- =============================================
-- ACTIVITIES - Margaret Thompson (British, traditional & community)
-- =============================================
INSERT INTO activities (user_id, activity_type, description, duration_minutes, timestamp) VALUES
('margaret_thompson', 'gardening', 'Planted new rose bushes in the garden', 60, NOW() - INTERVAL '1 day' + TIME '10:00'),
('margaret_thompson', 'cooking', 'Baked Victoria sponge for church fete', 90, NOW() - INTERVAL '1 day' + TIME '14:00'),
('margaret_thompson', 'social', 'Church coffee morning', 120, NOW() - INTERVAL '1 day' + TIME '11:00'),
('margaret_thompson', 'walking', 'Walk to the local shop on High Street', 25, NOW() - INTERVAL '1 day' + TIME '16:00'),
('margaret_thompson', 'craft', 'Knitting baby blanket for Sarahs friend', 60, NOW() - INTERVAL '2 days' + TIME '19:00'),
('margaret_thompson', 'social', 'Tea with Dorothy next door', 45, NOW() - INTERVAL '2 days' + TIME '15:00'),
('margaret_thompson', 'exercise', 'Chair yoga class at community center', 45, NOW() - INTERVAL '3 days' + TIME '10:00'),
('margaret_thompson', 'reading', 'Finished Agatha Christie novel', 40, NOW() - INTERVAL '4 days' + TIME '21:00'),
('margaret_thompson', 'social', 'Facetime with grandchildren in Bristol', 30, NOW() - INTERVAL '5 days' + TIME '17:00'),
('margaret_thompson', 'gardening', 'Weeding and deadheading flowers', 45, NOW() - INTERVAL '6 days' + TIME '11:00');

-- =============================================
-- ACTIVITIES - George Williams (British, sports & social)
-- =============================================
INSERT INTO activities (user_id, activity_type, description, duration_minutes, timestamp) VALUES
('george_williams', 'walking', 'Morning walk with Buster the dog', 40, NOW() - INTERVAL '1 day' + TIME '08:00'),
('george_williams', 'television', 'Watched Manchester United match', 120, NOW() - INTERVAL '1 day' + TIME '15:00'),
('george_williams', 'social', 'Pub quiz at The Red Lion', 150, NOW() - INTERVAL '1 day' + TIME '19:00'),
('george_williams', 'reading', 'Completed daily crossword in The Guardian', 30, NOW() - INTERVAL '1 day' + TIME '09:00'),
('george_williams', 'craft', 'Woodworking - making birdhouse for garden', 90, NOW() - INTERVAL '2 days' + TIME '14:00'),
('george_williams', 'walking', 'Long walk in Heaton Park', 60, NOW() - INTERVAL '3 days' + TIME '10:00'),
('george_williams', 'social', 'Coffee with mates at Costa', 60, NOW() - INTERVAL '4 days' + TIME '11:00'),
('george_williams', 'exercise', 'Swimming at local leisure center', 45, NOW() - INTERVAL '5 days' + TIME '09:00'),
('george_williams', 'gardening', 'Mowed the lawn and trimmed hedges', 75, NOW() - INTERVAL '6 days' + TIME '15:00'),
('george_williams', 'social', 'Video call with grandson about his new job', 25, NOW() - INTERVAL '7 days' + TIME '18:00');

-- =============================================
-- MOODS - Padma Sharma
-- =============================================
INSERT INTO moods (user_id, rating, notes, timestamp) VALUES
('padma_sharma', 'happy', 'Wonderful video call with grandchildren today. They showed me their school drawings.', NOW() - INTERVAL '1 day' + TIME '18:00'),
('padma_sharma', 'peaceful', 'Morning puja was very calming. Feeling blessed.', NOW() - INTERVAL '2 days' + TIME '07:30'),
('padma_sharma', 'tired', 'Knee was hurting a bit today. Need to rest more.', NOW() - INTERVAL '3 days' + TIME '20:00'),
('padma_sharma', 'happy', 'Kitty party was so much fun. Mrs. Joshi made excellent samosas.', NOW() - INTERVAL '4 days' + TIME '17:00'),
('padma_sharma', 'calm', 'Peaceful day at home. Did some reading and cooking.', NOW() - INTERVAL '5 days' + TIME '19:00'),
('padma_sharma', 'grateful', 'Anita called to check on me. Good daughter.', NOW() - INTERVAL '6 days' + TIME '21:00'),
('padma_sharma', 'energetic', 'Felt very good after yoga class today.', NOW() - INTERVAL '7 days' + TIME '08:00');

-- =============================================
-- MOODS - Rajesh Kumar
-- =============================================
INSERT INTO moods (user_id, rating, notes, timestamp) VALUES
('rajesh_kumar', 'excited', 'India won the cricket match! What a game!', NOW() - INTERVAL '2 days' + TIME '18:00'),
('rajesh_kumar', 'content', 'Good morning walk. Fresh air and met old friends.', NOW() - INTERVAL '1 day' + TIME '07:00'),
('rajesh_kumar', 'thoughtful', 'Reading about young entrepreneurs in India. Times are changing.', NOW() - INTERVAL '3 days' + TIME '20:00'),
('rajesh_kumar', 'happy', 'Beat Sharma ji at chess again! Still got it.', NOW() - INTERVAL '4 days' + TIME '17:30'),
('rajesh_kumar', 'tired', 'Hot weather today. Stayed inside mostly.', NOW() - INTERVAL '5 days' + TIME '14:00'),
('rajesh_kumar', 'peaceful', 'Quiet evening in the garden with chai.', NOW() - INTERVAL '6 days' + TIME '18:30'),
('rajesh_kumar', 'good', 'Normal day. Health is stable. Grateful.', NOW() - INTERVAL '7 days' + TIME '21:00');

-- =============================================
-- MOODS - Margaret Thompson
-- =============================================
INSERT INTO moods (user_id, rating, notes, timestamp) VALUES
('margaret_thompson', 'happy', 'My roses are blooming beautifully this year!', NOW() - INTERVAL '1 day' + TIME '17:00'),
('margaret_thompson', 'content', 'Lovely chat with Dorothy over tea. Good to have friends nearby.', NOW() - INTERVAL '2 days' + TIME '16:00'),
('margaret_thompson', 'proud', 'Victoria sponge was a hit at the church fete.', NOW() - INTERVAL '3 days' + TIME '15:00'),
('margaret_thompson', 'tired', 'A bit stiff today. Rain makes my joints ache.', NOW() - INTERVAL '4 days' + TIME '19:00'),
('margaret_thompson', 'joyful', 'Video call with grandchildren. Little Lily is growing so fast!', NOW() - INTERVAL '5 days' + TIME '18:00'),
('margaret_thompson', 'peaceful', 'Sunday service was lovely. Reverend Browns sermon was comforting.', NOW() - INTERVAL '6 days' + TIME '13:00'),
('margaret_thompson', 'okay', 'Quiet day. Missing Harold. Would have been our anniversary.', NOW() - INTERVAL '7 days' + TIME '20:00');

-- =============================================
-- MOODS - George Williams
-- =============================================
INSERT INTO moods (user_id, rating, notes, timestamp) VALUES
('george_williams', 'frustrated', 'United lost again. What are they doing?!', NOW() - INTERVAL '1 day' + TIME '17:30'),
('george_williams', 'happy', 'Our pub quiz team won! Free round of drinks!', NOW() - INTERVAL '1 day' + TIME '22:00'),
('george_williams', 'good', 'Nice walk with Buster. Hes such good company.', NOW() - INTERVAL '2 days' + TIME '09:00'),
('george_williams', 'proud', 'Finished the birdhouse. Looks proper good if I say so myself.', NOW() - INTERVAL '3 days' + TIME '16:00'),
('george_williams', 'content', 'Good swim this morning. Body feels better when I exercise.', NOW() - INTERVAL '5 days' + TIME '10:30'),
('george_williams', 'tired', 'Back playing up a bit today. Need to take it easy.', NOW() - INTERVAL '6 days' + TIME '19:00'),
('george_williams', 'cheerful', 'Grandson got promoted! Having a pint to celebrate.', NOW() - INTERVAL '7 days' + TIME '19:30');

-- =============================================
-- EXPENSES - Padma Sharma (in INR)
-- =============================================
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
('padma_sharma', 450, 'groceries', 'Vegetables from sabzi mandi', NOW()::date - 1),
('padma_sharma', 350, 'groceries', 'Milk, curd, and paneer from Mother Dairy', NOW()::date - 1),
('padma_sharma', 180, 'transport', 'Auto to temple and back', NOW()::date - 2),
('padma_sharma', 1200, 'health', 'Monthly medicines from Apollo Pharmacy', NOW()::date - 3),
('padma_sharma', 500, 'religious', 'Donation at Siddhivinayak Temple', NOW()::date - 4),
('padma_sharma', 250, 'groceries', 'Rice and dal from DMart', NOW()::date - 5),
('padma_sharma', 800, 'utilities', 'Mobile recharge - Jio', NOW()::date - 6),
('padma_sharma', 1500, 'household', 'New pressure cooker from local market', NOW()::date - 7),
('padma_sharma', 150, 'groceries', 'Fruits - mangoes and bananas', NOW()::date - 8),
('padma_sharma', 300, 'personal', 'Hair oil and soap from Big Bazaar', NOW()::date - 9);

-- =============================================
-- EXPENSES - Rajesh Kumar (in INR)
-- =============================================
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
('rajesh_kumar', 200, 'groceries', 'Newspaper subscription - monthly', NOW()::date - 1),
('rajesh_kumar', 600, 'food', 'Lunch at India Habitat Centre with friends', NOW()::date - 2),
('rajesh_kumar', 1500, 'health', 'Blood pressure medicines from Fortis', NOW()::date - 3),
('rajesh_kumar', 150, 'transport', 'Metro card recharge', NOW()::date - 4),
('rajesh_kumar', 450, 'groceries', 'Tea, biscuits, and dry fruits', NOW()::date - 5),
('rajesh_kumar', 2000, 'household', 'Garden supplies - fertilizer and pots', NOW()::date - 6),
('rajesh_kumar', 350, 'food', 'Chai and snacks at community center', NOW()::date - 7),
('rajesh_kumar', 999, 'entertainment', 'Hotstar subscription for cricket', NOW()::date - 8),
('rajesh_kumar', 800, 'personal', 'Haircut and grooming at salon', NOW()::date - 9),
('rajesh_kumar', 250, 'transport', 'Uber to doctors appointment', NOW()::date - 10);

-- =============================================
-- EXPENSES - Margaret Thompson (in GBP)
-- =============================================
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
('margaret_thompson', 45.50, 'groceries', 'Weekly shop at Waitrose', NOW()::date - 1),
('margaret_thompson', 12.99, 'groceries', 'Baking supplies - flour, sugar, eggs', NOW()::date - 2),
('margaret_thompson', 35.00, 'health', 'Prescription collection from Boots', NOW()::date - 3),
('margaret_thompson', 8.50, 'food', 'Tea and cake at church coffee morning', NOW()::date - 4),
('margaret_thompson', 28.00, 'household', 'Rose bushes from garden centre', NOW()::date - 5),
('margaret_thompson', 15.00, 'transport', 'Bus pass top-up', NOW()::date - 6),
('margaret_thompson', 22.00, 'personal', 'Knitting wool from Hobbycraft', NOW()::date - 7),
('margaret_thompson', 5.00, 'religious', 'Church collection plate', NOW()::date - 8),
('margaret_thompson', 18.50, 'groceries', 'Marks and Spencer treats', NOW()::date - 9),
('margaret_thompson', 42.00, 'utilities', 'Mobile phone bill - Vodafone', NOW()::date - 10);

-- =============================================
-- EXPENSES - George Williams (in GBP)
-- =============================================
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
('george_williams', 32.00, 'food', 'Pub dinner with mates at The Red Lion', NOW()::date - 1),
('george_williams', 18.50, 'food', 'Fish and chips takeaway', NOW()::date - 2),
('george_williams', 55.00, 'groceries', 'Big shop at Tesco', NOW()::date - 3),
('george_williams', 25.00, 'pet', 'Dog food and treats for Buster', NOW()::date - 4),
('george_williams', 8.00, 'entertainment', 'Pub quiz entry fee', NOW()::date - 5),
('george_williams', 45.00, 'health', 'Prescriptions from pharmacy', NOW()::date - 6),
('george_williams', 15.00, 'transport', 'Petrol for the car', NOW()::date - 7),
('george_williams', 35.00, 'household', 'Wood and supplies for birdhouse from B&Q', NOW()::date - 8),
('george_williams', 12.00, 'sport', 'Swimming session at leisure centre', NOW()::date - 9),
('george_williams', 4.50, 'food', 'Costa coffee with mates', NOW()::date - 10);

-- =============================================
-- APPOINTMENTS - Padma Sharma
-- =============================================
INSERT INTO appointments (user_id, title, description, date, time, location) VALUES
('padma_sharma', 'Doctor Checkup', 'Quarterly diabetes review with Dr. Mehta', NOW()::date + 3, '10:30', 'Hinduja Hospital, Mahim'),
('padma_sharma', 'Temple Visit', 'Monthly Satyanarayan Puja at ISKCON', NOW()::date + 5, '09:00', 'ISKCON Temple, Juhu'),
('padma_sharma', 'Video Call', 'Weekly call with Vikram and family', NOW()::date + 1, '18:00', 'Home - Video Call'),
('padma_sharma', 'Eye Checkup', 'Annual eye examination', NOW()::date + 10, '11:00', 'L V Prasad Eye Institute'),
('padma_sharma', 'Kitty Party', 'Monthly gathering at Mrs. Desais house', NOW()::date + 7, '15:00', 'Desai Residence, Bandra');

-- =============================================
-- APPOINTMENTS - Rajesh Kumar
-- =============================================
INSERT INTO appointments (user_id, title, description, date, time, location) VALUES
('rajesh_kumar', 'Cardiology Review', 'Blood pressure and heart checkup', NOW()::date + 2, '09:00', 'AIIMS, Delhi'),
('rajesh_kumar', 'Chess Tournament', 'Senior citizens championship', NOW()::date + 8, '14:00', 'Delhi Gymkhana Club'),
('rajesh_kumar', 'Family Dinner', 'Priya coming with grandchildren', NOW()::date + 4, '19:00', 'Home'),
('rajesh_kumar', 'Hearing Aid Service', 'Annual maintenance and check', NOW()::date + 12, '11:30', 'Siemens Hearing Center'),
('rajesh_kumar', 'Railway Pension', 'Quarterly pension verification', NOW()::date + 15, '10:00', 'Northern Railway Office');

-- =============================================
-- APPOINTMENTS - Margaret Thompson
-- =============================================
INSERT INTO appointments (user_id, title, description, date, time, location) VALUES
('margaret_thompson', 'GP Appointment', 'Routine checkup with Dr. Patel', NOW()::date + 4, '09:30', 'Highgate Medical Centre'),
('margaret_thompson', 'Church Service', 'Sunday morning service', NOW()::date + 2, '10:00', 'St Michaels Church'),
('margaret_thompson', 'Visiting Sarah', 'Weekend visit to daughters house', NOW()::date + 6, '11:00', 'Sarahs House, Hampstead'),
('margaret_thompson', 'Eye Test', 'Annual vision check at Specsavers', NOW()::date + 9, '14:00', 'Specsavers, High Street'),
('margaret_thompson', 'Bridge Club', 'Weekly bridge afternoon', NOW()::date + 3, '14:00', 'Community Centre, Highgate');

-- =============================================
-- APPOINTMENTS - George Williams
-- =============================================
INSERT INTO appointments (user_id, title, description, date, time, location) VALUES
('george_williams', 'Diabetes Review', '6-month checkup with nurse', NOW()::date + 5, '10:00', 'Wythenshawe Hospital'),
('george_williams', 'Pub Quiz', 'Weekly quiz night', NOW()::date + 1, '19:30', 'The Red Lion, Didsbury'),
('george_williams', 'Grandchildren Visit', 'Emma bringing kids for weekend', NOW()::date + 7, '12:00', 'Home'),
('george_williams', 'United Match', 'Manchester United vs Liverpool - watching at pub', NOW()::date + 10, '15:00', 'The Red Lion, Didsbury'),
('george_williams', 'Vet Appointment', 'Busters annual vaccination', NOW()::date + 3, '14:30', 'Companion Care Vets');

-- =============================================
-- CHAT HISTORY - Sample conversations
-- =============================================
INSERT INTO chat_history (user_id, session_id, user_message, agent_response, created_at) VALUES
-- Padma Sharma conversations
('padma_sharma', 'session_padma_1', 'Good morning Amble', 'Good morning, Padma ji! 🙏 Namaste! How are you feeling today? Did you do your morning yoga?', NOW() - INTERVAL '1 day' + TIME '06:30'),
('padma_sharma', 'session_padma_1', 'Yes, I did yoga and puja. Feeling peaceful.', 'Wonderful! Starting the day with yoga and prayer is so good for the mind and body. Your dedication to your morning routine is truly inspiring. Have you had your breakfast and morning medicines?', NOW() - INTERVAL '1 day' + TIME '06:35'),
('padma_sharma', 'session_padma_1', 'I want to call my grandchildren today', 'That sounds lovely! Video calls with grandchildren are so precious. Would you like me to remind you at 5 PM for the call? That would be after their school time in Bangalore. I can also suggest some fun things to ask them about - like their favorite subjects or what games they are playing!', NOW() - INTERVAL '1 day' + TIME '10:00'),

-- Rajesh Kumar conversations
('rajesh_kumar', 'session_rajesh_1', 'Amble, what time is the cricket match today?', 'Namaste, Rajesh ji! The India vs Australia match starts at 2 PM IST today. Would you like me to remind you 15 minutes before? Also, you could invite your friend Sharma ji to watch together - cricket is always more fun with company!', NOW() - INTERVAL '2 days' + TIME '09:00'),
('rajesh_kumar', 'session_rajesh_1', 'Good idea. Also remind me to take my BP medicine', 'Of course! I have set a reminder for 1:45 PM for the cricket match. And I will remind you about your Amlodipine at your usual time. By the way, your morning walk today was 45 minutes - excellent! How is your blood pressure feeling?', NOW() - INTERVAL '2 days' + TIME '09:05'),

-- Margaret Thompson conversations
('margaret_thompson', 'session_margaret_1', 'Hello dear', 'Good morning, Margaret! ☕ How lovely to chat with you. Such beautiful weather we are having today - perfect for the garden. How are your roses doing?', NOW() - INTERVAL '1 day' + TIME '09:00'),
('margaret_thompson', 'session_margaret_1', 'The roses are blooming beautifully! Pink ones especially', 'Oh how wonderful! Pink roses are so cheerful. You have such a green thumb! Are you planning any gardening today? And dont forget - you have the church coffee morning at 11. Would you like to take some biscuits from the tin?', NOW() - INTERVAL '1 day' + TIME '09:05'),
('margaret_thompson', 'session_margaret_1', 'I spent 35 pounds at Waitrose yesterday', 'I have logged that for you - £35 at Waitrose for groceries. Your weekly grocery budget is looking good! Did you get everything you needed for the Victoria sponge you mentioned baking?', NOW() - INTERVAL '1 day' + TIME '09:10'),

-- George Williams conversations
('george_williams', 'session_george_1', 'Morning Amble. United lost again last night', 'Morning George! Oh dear, another tough result for United. 😔 But chin up - there is always next week! On a brighter note, your pub quiz team won the other night! How about a nice walk with Buster to clear your head? The weather in Manchester is looking decent today.', NOW() - INTERVAL '1 day' + TIME '08:00'),
('george_williams', 'session_george_1', 'Good idea. My back is a bit stiff though', 'Take it easy then - maybe a shorter walk today? Gentle movement is good for back stiffness, but dont overdo it. Remember to do those stretches the physio showed you. Should I remind you to take some paracetamol before the walk?', NOW() - INTERVAL '1 day' + TIME '08:05'),
('george_williams', 'session_george_1', 'I finished making the birdhouse yesterday', 'Brilliant! That is proper craftsmanship. I bet the birds will love it. Where are you planning to hang it - in the back garden? Your granddaughter Emma would love to see it when she visits next weekend!', NOW() - INTERVAL '1 day' + TIME '08:10');

-- =============================================
-- ALERTS - Family notifications
-- =============================================
INSERT INTO alerts (user_id, type, message, read, timestamp) VALUES
('padma_sharma', 'wellness', 'Padma completed her yoga session this morning! 🧘', false, NOW() - INTERVAL '1 day' + TIME '07:00'),
('padma_sharma', 'social', 'Padma had a video call with grandchildren', true, NOW() - INTERVAL '1 day' + TIME '17:30'),
('rajesh_kumar', 'health', 'Rajesh blood pressure reading: 135/85 - within normal range', false, NOW() - INTERVAL '1 day' + TIME '08:00'),
('rajesh_kumar', 'activity', 'Rajesh walked 45 minutes this morning in Lodhi Garden', true, NOW() - INTERVAL '1 day' + TIME '06:30'),
('margaret_thompson', 'social', 'Margaret attended church coffee morning today', false, NOW() - INTERVAL '1 day' + TIME '13:00'),
('margaret_thompson', 'mood', 'Margaret feeling happy - roses blooming beautifully!', true, NOW() - INTERVAL '1 day' + TIME '17:00'),
('george_williams', 'health', 'George blood sugar: 6.8 mmol/L - good control!', false, NOW() - INTERVAL '1 day' + TIME '07:30'),
('george_williams', 'activity', 'George finished woodworking project - birdhouse complete!', true, NOW() - INTERVAL '2 days' + TIME '16:00');

-- =============================================
-- SESSIONS
-- =============================================
INSERT INTO sessions (user_id, session_id) VALUES
('padma_sharma', 'session_padma_1'),
('rajesh_kumar', 'session_rajesh_1'),
('margaret_thompson', 'session_margaret_1'),
('george_williams', 'session_george_1'),
('anita_sharma', 'session_anita_1'),
('sarah_thompson', 'session_sarah_1');

-- =============================================
-- VERIFICATION
-- =============================================
-- Run these to verify data was inserted correctly:
-- SELECT user_id, name, location, role FROM user_profiles;
-- SELECT user_id, COUNT(*) as activity_count FROM activities GROUP BY user_id;
-- SELECT user_id, COUNT(*) as mood_count FROM moods GROUP BY user_id;
-- SELECT user_id, SUM(amount) as total_spent FROM expenses GROUP BY user_id;
-- SELECT user_id, COUNT(*) as appointment_count FROM appointments GROUP BY user_id;
