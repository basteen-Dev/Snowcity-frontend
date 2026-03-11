const fs = require('fs');

let output = '';
function log(msg) {
  output += msg + '\n';
}

function printScore(file) {
  if (!fs.existsSync(file)) {
    log(`${file} not found.`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const score = data.categories.performance.score * 100;
  
  log(`\n=== Report: ${file} ===`);
  log(`Score: ${score}`);
  
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index'
  ];
  
  metrics.forEach(m => {
    const audit = data.audits[m];
    log(`${audit.title}: ${audit.displayValue}`);
  });
  
  log('\nTop 5 Opportunities:');
  const opportunities = Object.values(data.audits)
    .filter(a => a.details && a.details.type === 'opportunity' && a.score !== 1)
    .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
    .slice(0, 5);
    
  opportunities.forEach(o => {
    log(`- ${o.title}: ~${Math.round(o.details.overallSavingsMs)}ms savings`);
  });
}

printScore('lh-desktop.json');
printScore('lh-mobile.json');

fs.writeFileSync('scores.utf8.txt', output, 'utf8');
console.log('Done writing scores.utf8.txt');
