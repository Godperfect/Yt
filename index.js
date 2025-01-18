const express = require('express');
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-search');

const app = express();
const port = 3000;

const YOUTUBE_API_KEY = 'AIzaSyClkCIjpL3vAg0VZj2jDhzIIsgmXc1SQUM';
const searchOptions = {
  maxResults: 1,
  key: YOUTUBE_API_KEY,
  type: 'video',
};

const formatResponse = (data) => ({
  success: true,
  author: 'Mr-perfect',
  data,
});

const formatError = (message) => ({
  success: false,
  author: 'Mr-perfect',
  error: message,
});

app.get('/perfect', async (req, res) => {
  const { v, a } = req.query;

  if (!v && !a) {
    return res
      .status(400)
      .json(formatError('Query parameter "v" (video) or "a" (audio) is required'));
  }

  const query = v || a; // Use the query parameter value for video or audio

  try {
    youtubeSearch(query, searchOptions, async (err, results) => {
      if (err || !results.length) {
        console.error(err);
        return res.status(500).json(formatError('Failed to search YouTube'));
      }

      const video = results[0]; // First search result
      const videoUrl = video.link;

      if (v) {
        // Provide video download URL
        const videoDownloadUrl = `${req.protocol}://${req.get(
          'host'
        )}/download/video=${encodeURIComponent(videoUrl)}`;
        return res.json(
          formatResponse({
            type: 'video',
            title: video.title,
            thumbnail: video.thumbnails.default.url,
            downloadUrl: videoDownloadUrl,
          })
        );
      } else if (a) {
        // Provide audio download URL
        const audioDownloadUrl = `${req.protocol}://${req.get(
          'host'
        )}/download/audio=${encodeURIComponent(videoUrl)}`;
        return res.json(
          formatResponse({
            type: 'audio',
            title: video.title,
            thumbnail: video.thumbnails.default.url,
            downloadUrl: audioDownloadUrl,
          })
        );
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(formatError('An unexpected error occurred'));
  }
});

// Existing download routes for video and audio
app.get('/download/audio=:url', async (req, res) => {
  const videoUrl = decodeURIComponent(req.params.url);
  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res
      .status(400)
      .json(formatError('A valid YouTube video URL is required'));
  }

  try {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="audio.mp3"'
    );
    ytdl(videoUrl, { filter: 'audioonly' }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json(formatError('Failed to download audio'));
  }
});

app.get('/download/video=:url', async (req, res) => {
  const videoUrl = decodeURIComponent(req.params.url);
  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res
      .status(400)
      .json(formatError('A valid YouTube video URL is required'));
  }

  try {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="video.mp4"'
    );
    ytdl(videoUrl, { format: 'mp4' }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json(formatError('Failed to download video'));
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});