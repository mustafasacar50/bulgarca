import fs from 'fs';

const bundlePath = 'c:/Users/Mustafa/Downloads/bulgarca/docs/BULGARCA_IMPORT_BUNDLE_009_FULL_COGNATE_PATTERN_MARKERS.json';
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

bundle.files.forEach(file => {
  const targetPath = 'c:/Users/Mustafa/Downloads/bulgarca/' + file.path;
  const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
  
  // Ensure directory exists
  const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Extracted: ${file.path}`);
});
