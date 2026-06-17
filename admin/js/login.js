const { api, setMessage } = globalThis.adminCommon;

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

try {
  await api("/me", { method: "GET" });
  globalThis.location.href = "./overview.html";
} catch (error) {
  console.info("No active admin session", error.message);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "", "");

  const payload = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  try {
    await api("/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    globalThis.location.href = "./overview.html";
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
});
