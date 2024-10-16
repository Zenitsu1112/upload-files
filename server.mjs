import express from 'express';
import multer from 'multer';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const storage = multer.memoryStorage(); // Use memory storage for Multer
const upload = multer({ storage });

const PORT = process.env.PORT || 3000;

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
app.post('/upload', (req, res) => {
  console.log('Upload route accessed');
  res.send('Route is accessible');
});


  const fileName = req.file.originalname; // File name
  const fileContent = req.file.buffer; // File content from memory buffer
  const repo = process.env.GITHUB_REPO; // GitHub repository

  try {
    // Upload to GitHub
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      path: fileName, // Destination path in the repo
      message: `Upload ${fileName}`, // Commit message
      content: Buffer.from(fileContent).toString('base64'), // File content in base64
    });

    res.send(`File uploaded: ${fileName} to GitHub repository ${repo}`);
  } catch (error) {
    console.error('Error uploading file to GitHub:', error);
    res.status(500).send('Error uploading file to GitHub.');
  }
});

// List files in the GitHub repository
app.get('/files', async (req, res) => {
  try {
    const repo = process.env.GITHUB_REPO;
    const { data } = await octokit.rest.repos.getContent({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      path: '', // Get files in the root directory
    });

    const fileList = data.map(file => ({
      name: file.name,
      download_url: file.download_url,
    }));

    res.json(fileList);
  } catch (error) {
    console.error('Error fetching files from GitHub:', error);
    res.status(500).send('Error fetching files from GitHub.');
  }
});

// Download file from GitHub
app.get('/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  
  // Redirect to the GitHub download URL
  const downloadUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO}/main/${fileName}`;
  res.redirect(downloadUrl);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
