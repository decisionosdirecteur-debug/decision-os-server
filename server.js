// DECISION OS - Serveur branchement Gmail / Outlook
// A lancer avec : npm install express googleapis express-session puis node server.js
import express from "express";
import { google } from "googleapis";
import session from "express-session";
const app = express();
app.use(express.json());
app.use(session({ secret: "decision-os-secret-changez-moi", resave: false, saveUninitialized: true }));
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "COLLEZ_ICI_VOTRE_CLIENT_ID";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "COLLEZ_ICI_VOTRE_CLIENT_SECRET";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "https://votre-domaine.com/auth/google/callback";
const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
app.get("/", (req, res) => { res.send("DECISION OS serveur en ligne"); });
app.get("/auth/google", (req, res) => {
  const url = oauth2.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["https://www.googleapis.com/auth/gmail.readonly", "profile", "email"] });
  res.redirect(url);
});
app.get("/auth/google/callback", async (req, res) => {
  const { tokens } = await oauth2.getToken(req.query.code);
  req.session.tokens = tokens;
  res.redirect("/briefing?connecte=1");
});
app.get("/api/mails", async (req, res) => {
  try {
    oauth2.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2 });
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 20, q: "newer_than:1d" });
    const mails = [];
    for (const m of (list.data.messages || [])) {
      const full = await gmail.users.messages.get({ userId: "me", id: m.id });
      const headers = Object.fromEntries(full.data.payload.headers.map(h => [h.name, h.value]));
      mails.push({ id: m.id, objet: headers.Subject || "(Sans objet)", expediteur: headers.From || "", date: headers.Date || "", extrait: full.data.snippet || "" });
    }
    res.json({ connecte: true, mails });
  } catch (e) { res.status(401).json({ connecte: false, message: "Non connecte - cliquez sur Connecter Gmail" }); }
});
app.listen(process.env.PORT || 3000, () => console.log("DECISION OS serveur pret"));
