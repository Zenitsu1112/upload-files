import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



// Define the upload route
app.post('/upload', (req, res) => {
    // Handle the file upload logic here
    res.send('File uploaded successfully!'); // Example response
});

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

  const filePath = req.file.path; // Local file path
  const fileName = req.file.originalname; // File name
  const repo = process.env.GITHUB_REPO; // GitHub repository

  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });

    // Upload to GitHub
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.split('/')[0],
      repo: repo.split('/')[1],
      path: fileName, // Destination path in the repo
      message: `Upload ${fileName}`, // Commit message
      content: Buffer.from(fileContent).toString('base64'), // File content in base64
    });

    // Optionally delete the local file after upload
    fs.unlinkSync(filePath);

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
