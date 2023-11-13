require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const shortId = require("short-unique-id");
const uid = new shortId({ length: 6 });
const validUrl = require("valid-url");
// Basic Configuration
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to database..."))
  .catch((e) => console.log(e));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const URL = mongoose.model("URL", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async function (req, res) {
  const givenUrl = req.body.url;

  if (!validUrl.isUri(givenUrl)) {
    res.json({ error: "invalid url" });
  } else {
    try {
      const found = await URL.findOne({
        original_url: givenUrl,
      });
      if (found) {
        res.json({
          original_url: found.original_url,
          short_url: found.short_url,
        });
      } else {
        const newUrl = new URL({
          original_url: givenUrl,
          short_url: uid.rnd(),
        });
        await newUrl.save();
        res.json({
          original_url: newUrl.origianl_url,
          short_url: newUrl.short_url,
        });
      }
    } catch (e) {
      console.log(e);
      res.json({ error: "Database error" });
    }
  }
});

app.get("/api/shorturl/:url", async function (req, res) {
  try {
    const foundUrl = await URL.findOne({ short_url: req.params.url });
    if (foundUrl) {
      return res.redirect(foundUrl.original_url);
    } else {
      res.json({ error: "no url found" });
    }
  } catch (e) {
    console.log(e);
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
