const SpotifyWebApi = require("spotify-web-api-node");
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = require("./config");

// Create a new Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

// Function to get and refresh Spotify Access Token
async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body["access_token"]);

    if (process.env.NODE_ENV !== "test") {
      console.log("✅ Spotify API Token Set!");
      setTimeout(refreshSpotifyToken, 55 * 60 * 1000);
    }
  } catch (err) {
    console.error("❌ Error refreshing Spotify token:", err);
  }
}

// ✅ Only call this when not testing
if (process.env.NODE_ENV !== "test") {
  refreshSpotifyToken();
}

module.exports = spotifyApi;
