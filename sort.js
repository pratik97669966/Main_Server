const fs = require('fs');
const path = require('path');

// Load the JSON file
const images = require('./photourl.json');

// Define source and destination folders (fixing Windows path issue)
const sourceFolder = path.join('C:', 'Users', 'prati', 'Downloads', 'gallary');
const destinationFolder = path.join('C:', 'Users', 'prati', 'Downloads', 'sorted');

// Ensure the destination folder exists
if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true }); // Ensure full path creation
}

// Iterate through the JSON and copy files
Object.values(images).forEach((fileName) => {
    const sourceFile = path.join(sourceFolder, fileName);
    const destinationFile = path.join(destinationFolder, fileName);

    // Check if the file exists in the source folder
    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destinationFile);
        console.log(`Copied: ${fileName}`);
    } else {
        console.warn(`File not found: ${fileName}`);
    }
});

console.log('Sorting complete.');
