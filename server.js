const express = require('express');
const fs = require('fs');
const path = require('path');
const process = require('process');
const app = express();
app.use(express.static(path.join(process.cwd(), "public")));
const port = 3000;
const frameDataDir = path.join('public', 'frame-data');
const imagesDir = path.join('public', 'images');

app.get('/frame-data', (req, res) => {
    console.log('GET /frame-data');
    fs.readdir(frameDataDir, (err, files) => {
        res.type('application/json');
        res.status(200);
        res.send(files);
        console.log('GET /frame-data returning', files);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});