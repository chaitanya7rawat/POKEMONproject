// const API_URL = "http://localhost:5000/api";
const API_URL="https://pokemonproject-10.onrender.com";
// DOM Elements
const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app");
const userBox = document.getElementById("userBox");
const userDropdown = document.getElementById("userDropdown");
const usernameDisplay = document.getElementById("usernameDisplay");
const userInfoName = document.getElementById("userInfoName");
const userNameWelcome = document.getElementById("user-name");
const timelineLog = document.getElementById("timeline-log");
const loginError = document.getElementById("login-error");

document.addEventListener("DOMContentLoaded", async () => {
  await checkSession();
  setupUserBoxToggle();
});

// Check for existing session
async function checkSession() {
  try {
    const res = await fetch(`${API_URL}/me`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      onLoginSuccess(data.user.username);
    }
  } catch (error) {
    console.error("Session check failed", error);
  }
}

// Login
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const rememberMe = document.getElementById("rememberMe").checked;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rememberMe }),
      credentials: "include"
    });

    if (!res.ok) {
      const err = await res.json();
      loginError.innerText = err.message || "Login failed!";
      return;
    }

    const data = await res.json();
    onLoginSuccess(data.user.username);
  } catch (err) {
    loginError.innerText = "Login error!";
    console.error(err);
  }
}

// Logout
async function logout() {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });
    location.reload();
  } catch (err) {
    console.error("Logout failed", err);
  }
}

// Successful login display
async function onLoginSuccess(username) {
  loginSection.style.display = "none";
  appSection.classList.remove("hidden");

  userNameWelcome.innerText = username;
  usernameDisplay.innerText = username;
  userInfoName.innerText = username;
  userBox.style.display = "block";

  await fetchPokemon();
  await fetchFavorites();
  await fetchTimeline();
}

// Fetch Pokemons
async function fetchPokemon() {
  try {
    const res = await fetch(`${API_URL}/pokemon`, { credentials: "include" });
    const pokemons = await res.json();

    const list = document.getElementById("pokemon-list");
    list.innerHTML = "";

    pokemons.forEach(pokemon => {
      const li = document.createElement("li");
      li.className = "p-2 bg-yellow-100 rounded flex justify-between items-center";
      li.innerHTML = `
        <span>${pokemon.name}</span>
        <button class="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm px-2 py-1 rounded" onclick="addFavorite('${pokemon.name}')">❤️ Add</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to fetch Pokémon", err);
  }
}

// Add Favorite
async function addFavorite(pokemon) {
  try {
    await fetch(`${API_URL}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pokemon }),
      credentials: "include"
    });

    await fetchFavorites();
    await fetchTimeline();
  } catch (err) {
    console.error("Failed to add favorite", err);
  }
}

// Remove Favorite
async function removeFavorite(pokemon) {
  try {
    // Fixed to match the backend route structure
    const res = await fetch(`${API_URL}/favorite/${pokemon}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to remove favorite");
    }

    await fetchFavorites();
    await fetchTimeline();
  } catch (err) {
    console.error("Failed to remove favorite", err);
    console.error("Error details:", err.message);
  }
}


// Fetch Favorites
async function fetchFavorites() {
  try {
    const res = await fetch(`${API_URL}/favorites`, { credentials: "include" });
    const data = await res.json();

    const list = document.getElementById("favorites-list");
    list.innerHTML = "";

    data?.favorites?.forEach(fav => {
      const li = document.createElement("li");
      li.className = "p-2 bg-pink-100 rounded flex justify-between items-center";
      li.innerHTML = `
        <span>${fav}</span>
        <button class="ml-2 bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded" onclick="removeFavorite('${fav}')">🗑️ Remove</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to fetch favorites", err);
  }
}

// Fetch Timeline
async function fetchTimeline() {
  try {
    const res = await fetch(`${API_URL}/timeline`, { credentials: "include" });
    const timeline = await res.json();

    timelineLog.innerHTML = "";
    timeline?.forEach(entry => {
      const li = document.createElement("li");
      li.className = "text-gray-800";
      li.innerText = `${new Date(entry.timestamp).toLocaleString()} - ${entry.activity}`;
      timelineLog.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to fetch timeline", err);
  }
}

// Toggle dropdown menu
function setupUserBoxToggle() {
  userBox.addEventListener("click", () => {
    userDropdown.classList.toggle("hidden");
    userDropdown.classList.toggle("flex");
    userDropdown.classList.toggle("flex-col");
    userDropdown.classList.toggle("space-y-2");
  });
}
