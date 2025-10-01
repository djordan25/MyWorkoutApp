import { getAvailableUsers, setCurrentUser } from "../core/storage.js";

export function showLoginScreen(onLogin) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "#041B2F"; // Solid background color
  overlay.style.zIndex = "10000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.flexDirection = "column";
  overlay.id = "loginScreen";

  // Create container
  const container = document.createElement("div");
  container.style.maxWidth = "400px";
  container.style.width = "90%";
  container.style.padding = "40px";
  container.style.background = "var(--cardBg)";
  container.style.borderRadius = "20px";
  container.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
  container.style.textAlign = "center";

  // App icon/logo
  const icon = document.createElement("img");
  icon.src = "icon-512.png";
  icon.alt = "Workout Tracker Logo";
  icon.style.width = "194px";
  icon.style.height = "194px";
  icon.style.margin = "0 auto 24px";
  icon.style.display = "block";
  icon.style.borderRadius = "20px";

  // Title
  const title = document.createElement("h1");
  title.textContent = "Workout Tracker";
  title.style.fontSize = "28px";
  title.style.fontWeight = "900";
  title.style.marginBottom = "12px";
  title.style.color = "var(--ink)";

  // Subtitle
  const subtitle = document.createElement("p");
  subtitle.textContent = "Select your profile to continue";
  subtitle.className = "small";
  subtitle.style.marginBottom = "32px";
  subtitle.style.opacity = "0.7";

  // User buttons
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.flexDirection = "column";
  buttonsContainer.style.gap = "12px";

  const users = getAvailableUsers();
  users.forEach(username => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.style.width = "100%";
    btn.style.padding = "16px 24px";
    btn.style.fontSize = "18px";
    btn.style.fontWeight = "600";
    btn.textContent = username;
    
    btn.onclick = () => {
      try {
        setCurrentUser(username);
        if (onLogin) onLogin(username);
        overlay.remove();
      } catch (error) {
        console.error("Login error:", error);
        alert("Failed to login. Please try again.");
      }
    };
    
    buttonsContainer.appendChild(btn);
  });

  // Assemble
  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(buttonsContainer);
  overlay.appendChild(container);

  // Add to page
  document.body.appendChild(overlay);

  return overlay;
}

export function removeLoginScreen() {
  const existing = document.getElementById("loginScreen");
  if (existing) existing.remove();
}
