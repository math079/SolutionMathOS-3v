const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = path.resolve(__dirname, 'scratch_presentation.html');
const pdfPath = path.resolve(__dirname, 'Apresentacao_Executiva_SolutionMathOS.pdf');

console.log('HTML path:', htmlPath);
console.log('PDF path:', pdfPath);

const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log('Running cmd...');
execSync(cmd);

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log('SUCCESS! PDF generated:', stats.size, 'bytes');
} else {
  console.error('ERROR: PDF not found');
}
