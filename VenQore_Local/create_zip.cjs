const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const sourceDir = process.argv[2];
const outPath = process.argv[3];

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

output.on('end', function () {
    console.log('Data has been drained');
});

archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        throw err;
    }
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

archive.directory(sourceDir, false);

archive.finalize();
