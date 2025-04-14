const express = require("express");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

// MongoDB connection
// mongoose.connect("mongodb://localhost:27017/pokemonApp", {
mongoose.connect("mongodb+srv://chaitanya:ssUyw3YhCOVUsH00@cluster0.3nhex46.mongodb.net/pokemonApp?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  favorites: [String],
});

const timelineSchema = new mongoose.Schema({
  username: String,
  activity: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Timeline = mongoose.model("Timeline", timelineSchema);

// Pre-populate users (if they don’t exist)
const predefinedUsers = [
  { username: "ash", password: "pikachu" },
  { username: "misty", password: "starmie" },
  { username: "brock", password: "onix" },
];

async function seedUsers() {
  for (const user of predefinedUsers) {
    const exists = await User.findOne({ username: user.username });
    if (!exists) {
      await new User({ ...user, favorites: [] }).save();
    }
  }
}
seedUsers();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));
app.use(express.static('public'));

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (!req.session.username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Login route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.username = user.username;

  // Log login activity
  await Timeline.create({ username: user.username, activity: "Logged in" });

  res.json({ message: "Login successful", user: { username: user.username } });
});

// Logout route
app.post("/api/logout", isAuthenticated, async (req, res) => {
  await Timeline.create({ username: req.session.username, activity: "Logged out" });
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// Fetch Pokémon list
app.get("/api/pokemon", async (req, res) => {
  try {
    const response = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=20");
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Pokémon" });
  }
});

// Get favorites
app.get("/api/favorites", isAuthenticated, async (req, res) => {
  const user = await User.findOne({ username: req.session.username });
  res.json({ favorites: user.favorites });
});

// Add favorite
app.post("/api/favorite", isAuthenticated, async (req, res) => {
  const { pokemon } = req.body;
  await User.updateOne(
    { username: req.session.username },
    { $addToSet: { favorites: pokemon } }
  );
  await Timeline.create({
    username: req.session.username,
    activity: `Added ${pokemon} to favorites`,
  });
  res.json({ success: true });
});

// Remove favorite
app.delete("/api/favorite/:pokemon", isAuthenticated, async (req, res) => {
  const { pokemon } = req.params;
  await User.updateOne(
    { username: req.session.username },
    { $pull: { favorites: pokemon } }
  );
  await Timeline.create({
    username: req.session.username,
    activity: `Removed ${pokemon} from favorites`,
  });
  res.json({ success: true });
});

// Get timeline
app.get("/api/timeline", isAuthenticated, async (req, res) => {
  const logs = await Timeline.find({ username: req.session.username })
    .sort({ timestamp: -1 })
    .limit(20);
  res.json(logs);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
