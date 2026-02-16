require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.use(express.json()); // Enable JSON body parsing

// Serve homepage (Sign In)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/signInPage.html");
});

app.post("/signIn", (req, res) => {
  const { email, password } = req.body;
  console.log(`Sign in attempt: ${email}`);
  // Mock authentication - always success for now
  res.json({ success: true, message: "User signed in successfully" });
});

app.post("/ask", upload.single("file"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const filePath = req.file.path;

    // Read the content of the uploaded .txt file
    const fileText = fs.readFileSync(filePath, "utf8");

    // Combine the user prompt with the file content
    const fullPrompt = `${prompt}\n\nMeeting Notes / Transcript:\n${fileText}`;

    // Hugging Face Inference API call (via OpenAI-compatible router)
    const hfResponse = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [{ role: "user", content: fullPrompt }],
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    // Send Hugging Face summary to frontend
    res.send(hfResponse.data.choices[0].message.content);

    // Delete the uploaded file
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(err);
    if (err.response && err.response.data) {
      res.status(500).send(`Hugging Face API Error: ${JSON.stringify(err.response.data)}`);
    } else {
      res.status(500).send("Something went wrong");
    }
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
