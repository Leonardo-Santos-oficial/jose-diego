const fs = require('fs');
const path = 'D:\\leo\\Projetos\\Projeto_José_Diego_dos_Santos\\web\\test-results\\lighthouse-report.html';

try {
  const content = fs.readFileSync(path, 'utf8');
  const match = content.match(/window\.__LIGHTHOUSE_JSON__\s*=\s*({.*?});/s);
  
  if (!match) {
    console.log("Could not find Lighthouse JSON in the file.");
    process.exit(1);
  }

  const data = JSON.parse(match[1]);

  if (data.runtimeError) {
    console.log(`Runtime Error: ${data.runtimeError.message}`);
  }

  const categories = data.categories || {};
  const audits = data.audits || {};

  console.log("\n--- Scores ---");
  for (const [catId, catData] of Object.entries(categories)) {
    const score = catData.score;
    console.log(`${catData.title}: ${score !== null ? Math.round(score * 100) : 'N/A'}`);
  }

  console.log("\n--- Failed Audits (Score < 1) ---");
  for (const [catId, catData] of Object.entries(categories)) {
    console.log(`\nCategory: ${catData.title}`);
    for (const auditRef of catData.auditRefs || []) {
      const auditId = auditRef.id;
      const audit = audits[auditId];
      
      if (audit && audit.score !== null && audit.score < 1) {
        if (['informative', 'manual', 'notApplicable'].includes(audit.scoreDisplayMode)) {
          continue;
        }
        console.log(`- ${audit.title} (Score: ${audit.score})`);
        if (audit.displayValue) {
          console.log(`  Value: ${audit.displayValue}`);
        }
      }
    }
  }

} catch (e) {
  console.error(`Error parsing report: ${e.message}`);
}
