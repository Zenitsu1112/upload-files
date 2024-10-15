import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// Initialize Octokit with the GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Serve static files from the public directory
app.use(express.static('public'));

// Base route
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the GitHub File Uploader</h1>');
});

// Upload file route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileName = req.file.originalname; // File name
  const repo = process.env.GITHUB_REPO; // GitHub repository

  try {
    // Upload to GitHub directly from memory
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      path: fileName, // Destination path in the repo
      message: `Upload ${fileName}`, // Commit message
      content: Buffer.from(req.file.buffer).toString('base64'), // File content in base64
    });

    res.send(`File uploaded: ${fileName} to GitHub repository ${repo}`);
  } catch (error) {
    console.error('Error uploading file to GitHub:', error);
    res.status(500).send('Error uploading file to GitHub.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

