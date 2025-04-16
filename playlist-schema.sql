-- Drop existing tables if they exist
DROP TABLE IF EXISTS playlist_access;
DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS songs; -- Songs table should be dropped last

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- Hashed
    image_url TEXT, -- User profile image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Songs Table (Spotify Data)
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(50) UNIQUE NOT NULL,  -- Stores the Spotify track ID
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    duration INTEGER,  -- Duration in milliseconds
    preview_url TEXT,  -- 30-sec preview URL
    image_url TEXT,  -- Album cover URL
    spotify_url TEXT  -- Link to the song on Spotify
);

-- Playlists Table
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT TRUE,
    password TEXT,  -- Null if public
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT  -- Playlist cover image
);

-- Playlist Songs (Join Table)
CREATE TABLE playlist_songs (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist Access (Tracks users who entered a private playlist's password)
CREATE TABLE playlist_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, playlist_id) -- Prevents duplicate access records
);
