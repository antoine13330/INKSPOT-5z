-- Insert sample users
INSERT INTO users (username, email, password_hash, bio, verified) VALUES
('@pierce', 'pierce@example.com', '$2b$10$hash1', 'Professional tattoo artist specializing in custom designs', true),
('@despoteur_fou', 'despoteur@example.com', '$2b$10$hash2', 'Digital artist and designer', false),
('@the_homelander', 'homelander@example.com', '$2b$10$hash3', 'Superhero enthusiast', false),
('@gorillouz', 'gorillouz@example.com', '$2b$10$hash4', 'Street art lover', false),
('@doomslayer', 'doom@example.com', '$2b$10$hash5', 'Gaming content creator', false),
('@sam_sulek', 'sam@example.com', '$2b$10$hash6', 'Fitness influencer', false),
('@bigdackdock', 'big@example.com', '$2b$10$hash7', 'Music producer', false),
('@gaufre_salee', 'gaufre@example.com', '$2b$10$hash8', 'Food blogger', false);

-- Insert sample conversations
INSERT INTO conversations (id) VALUES (1), (2), (3), (4), (5);

-- Insert conversation participants
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3),
(3, 1), (3, 4),
(4, 1), (4, 5),
(5, 1), (5, 6);

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES
(1, 2, 'Is typing...', 'text'),
(2, 3, 'Are you open for a new tattoo project ? I have some...', 'text'),
(3, 4, 'Are you open for a new tattoo project ? I have some...', 'text'),
(4, 5, '', 'text'),
(5, 6, 'Are you open for a new tattoo project ? I have some...', 'text');

-- Insert sample posts
INSERT INTO posts (user_id, content, image_url, likes_count, comments_count) VALUES
(1, 'Pas sur que ça soit si bon, ça aurait été mieux au bbq mais c''est pas encore la saison pleut dehors', '/placeholder.svg?height=400&width=400', 12, 3),
(1, 'J''ai créé ces quelques avec mon design. Super limité que 100 exemplaires faites vite !!', NULL, 45, 8);

-- Insert sample likes
INSERT INTO likes (user_id, post_id) VALUES
(2, 1), (3, 1), (4, 1),
(2, 2), (3, 2), (4, 2), (5, 2), (6, 2);

-- Insert sample comments
INSERT INTO comments (user_id, post_id, content) VALUES
(2, 1, 'Looks amazing! 🔥'),
(3, 1, 'Great work as always'),
(4, 1, 'When can I book an appointment?'),
(2, 2, 'Just ordered one!'),
(3, 2, 'The design is incredible');
