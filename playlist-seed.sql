-- Insert Sample Users
INSERT INTO users (username, email, password) VALUES
('user1', 'user1@example.com', 'hashedpassword1'),
('user2', 'user2@example.com', 'hashedpassword2');

-- Insert Sample Playlists
INSERT INTO playlists (name, description, owner_id, is_private) VALUES
('Road Trip Vibes', 'A playlist for long drives', 1, FALSE),
('House Party', 'High-energy tracks for a party', 2, TRUE);

-- Insert Sample Songs (from Spotify API)
INSERT INTO songs (spotify_id, title, artist, album, duration, preview_url, image_url) VALUES
('3n3Ppam7vgaVa1iaRUc9Lp', 'Blinding Lights', 'The Weeknd', 'After Hours', 200000, 'https://p.scdn.co/mp3-preview/url', 'https://i.scdn.co/image/url'),
('1I2M1ZAn0cyFna7Ck6U4OG', 'Levitating', 'Dua Lipa', 'Future Nostalgia', 203000, 'https://p.scdn.co/mp3-preview/url', 'https://i.scdn.co/image/url');

-- Insert Playlist-Song Relationships
INSERT INTO playlist_songs (playlist_id, song_id, added_by) VALUES
(1, 1, 1),
(2, 2, 2);

-- Insert Playlist Users (collaborators)
INSERT INTO playlist_users (playlist_id, user_id, role) VALUES
(1, 2, 'contributor'),
(2, 1, 'contributor');
