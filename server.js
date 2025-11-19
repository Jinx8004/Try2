const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// HLS output folder
const hlsFolder = path.join(__dirname, "public/hls");
fs.ensureDirSync(hlsFolder);
fs.emptyDirSync(hlsFolder);

// NEW 4K HLS SOURCE
const SOURCE_URL = "http://centra.ink/live/Centra_Live_iVIOT/zTsGiHyZ884M/3059303.m3u8";

function startFFmpeg() {
  const args = [
    "-analyzeduration", "50000000",
    "-probesize", "50000000",

    "-i", SOURCE_URL,

    // Copy HEVC 4K VIDEO exactly
    "-c:v", "copy",

    // Convert 5.1 → 2.0 AAC
    "-ac", "2",
    "-c:a", "aac",
    "-b:a", "128k",

    // HLS output
    "-f", "hls",
    "-hls_time", "2",
    "-hls_list_size", "10",
    "-hls_flags", "independent_segments",
    "-hls_segment_type", "mpegts",

    path.join(hlsFolder, "stream.m3u8")
  ];

  console.log("Starting FFmpeg relay...");
  const ffmpeg = spawn("ffmpeg", args);

  ffmpeg.stderr.on("data", data => {
    console.log(data.toString());
  });

  ffmpeg.on("close", () => {
    console.log("FFmpeg stopped. Restarting in 5 seconds...");
    setTimeout(startFFmpeg, 5000);
  });
}

startFFmpeg();

// Serve HLS
app.use("/hls", express.static(hlsFolder));

app.get("/", (req, res) => {
  res.send("4K HLS Relay Running → /hls/stream.m3u8");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
