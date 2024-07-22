const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

const YOUTUBE_API_KEY = ''; // Replace with your YouTube API key

const ffmpegPath = 'C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe'; // Ensure this path is correct
ffmpeg.setFfmpegPath(ffmpegPath);

app.use(cors());
app.use(express.json());

// Route to search for YouTube videos
app.get('/search', async (req, res) => {
    const query = req.query.q;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await axios.get(url);
        res.json(response.data.items);
    } catch (error) {
        res.status(500).send('Error fetching search results');
    }
});

// Route to stream YouTube video as MP3
app.get('/stream', (req, res) => {
    const videoId = req.query.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    res.setHeader('Content-Type', 'audio/mpeg');

    const process = exec(videoUrl, {
        output: '-',
        format: 'bestaudio',
        audioFormat: 'mp3',
    });

    const ffmpegProcess = ffmpeg(process.stdout)
        .audioBitrate(128)
        .format('mp3')
        .on('error', (err) => {
            console.error('Error during conversion', err);
            res.status(500).send('Error during conversion');
        })
        .on('end', () => {
            console.log('Conversion finished');
        });

    ffmpegProcess.pipe(res, { end: true });

    process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
        if (code !== 0) {
            res.status(500).send('Error during conversion');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
