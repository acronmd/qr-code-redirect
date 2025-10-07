import express from "express";
import fs from "fs";
import QRCode from "qrcode";
import auth from "basic-auth";

const app = express();
app.use(express.urlencoded({ extended: true }));

const CURRENT_FILE = "./current_target.txt";
const UPCOMING_FILE = "./upcoming_target.txt";

// Basic Auth middleware
const username = process.env.MANAGER_USER || "admin";
const password = process.env.MANAGER_PASS || "password";

function requireAuth(req, res, next) {
  const user = auth(req);
  if (!user || user.name !== username || user.pass !== password) {
    res.set("WWW-Authenticate", 'Basic realm="QR Redirect Manager"');
    return res.status(401).send("Authentication required.");
  }
  next();
}

// Management page
app.get("/", requireAuth, async (req, res) => {
  const current = fs.existsSync(CURRENT_FILE) ? fs.readFileSync(CURRENT_FILE, "utf8") : "";
  const upcoming = fs.existsSync(UPCOMING_FILE) ? fs.readFileSync(UPCOMING_FILE, "utf8") : "";

  const currentQR = await QRCode.toDataURL(`https://qr.acrn.me/redirect`);
  const upcomingQR = await QRCode.toDataURL(`https://qr.acrn.me/upcoming`);

  res.send(`
    <h1>QR Redirect Manager</h1>
    <h2>Current QR</h2>
    <p>Link: <a href="${current}" target="_blank">${current}</a></p>
    <img src="${currentQR}" width="200"/>
    <form method="POST" action="/update-current">
      <input type="text" name="url" value="${current}" placeholder="New current URL" style="width:300px"/>
      <button type="submit">Update Current</button>
    </form>

    <h2>Upcoming QR</h2>
    <p>Link: <a href="${upcoming}" target="_blank">${upcoming}</a></p>
    <img src="${upcomingQR}" width="200"/>
    <form method="POST" action="/update-upcoming">
      <input type="text" name="url" value="${upcoming}" placeholder="New upcoming URL" style="width:300px"/>
      <button type="submit">Update Upcoming</button>
    </form>
  `);
});

// Update endpoints
app.post("/update-current", requireAuth, (req, res) => {
  const newUrl = req.body.url.trim();
  if (newUrl) fs.writeFileSync(CURRENT_FILE, newUrl);
  res.redirect("/");
});

app.post("/update-upcoming", requireAuth, (req, res) => {
  const newUrl = req.body.url.trim();
  if (newUrl) fs.writeFileSync(UPCOMING_FILE, newUrl);
  res.redirect("/");
});

// Redirect endpoints
app.get("/redirect", (req, res) => {
  const target = fs.existsSync(CURRENT_FILE) ? fs.readFileSync(CURRENT_FILE, "utf8") : null;
  if (target) res.redirect(target);
  else res.send("No current URL set.");
});

app.get("/upcoming", (req, res) => {
  const target = fs.existsSync(UPCOMING_FILE) ? fs.readFileSync(UPCOMING_FILE, "utf8") : null;
  if (target) res.redirect(target);
  else res.send("No upcoming URL set.");
});

// Port for Coolify
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
