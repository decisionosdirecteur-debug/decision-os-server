import express from "express";
const app = express();
app.get("/", (req, res) => { res.send("DECISION OS serveur pret"); });
app.get("/api/mails", (req, res) => { res.json({ connecte: true, mails: [] }); });
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Pret"));
