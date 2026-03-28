#!/usr/bin/env node

/**
 * Cogit CLI - Report Generator
 * Consolidates all test results into a single JSON report
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const OUTPUT_FILE = path.join(REPORTS_DIR, 'phase3-exhaustive.json');

function readJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      results.push({ file, ...content });
    } catch (e) {
      // Skip invalid files
    }
  }
  return results;
}

function generateReport() {
  console.log('📊 Generating consolidated report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    phase: 'Clean Architecture Phase 3',
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      successRate: 0,
    },
    categories: {
      unit: { passed: 0, failed: 0, tests: [] },
      regression: { passed: 0, failed: 0, tests: [] },
      stress: { passed: 0, failed: 0, tests: [] },
    },
    details: [],
  };
  
  // Read all reports
  const reports = readJsonFiles(REPORTS_DIR);
  
  // Process each report
  for (const r of reports) {
    // Skip old reports
    if (r.file.includes('comprehensive')) continue;
    
    // Stress tests
    if (r.file.includes('stress')) {
      report.categories.stress.passed += r.passed || 0;
      report.categories.stress.failed += r.failed || 0;
      report.summary.total += (r.passed || 0) + (r.failed || 0);
      report.summary.passed += r.passed || 0;
      report.summary.failed += r.failed || 0;
      if (r.results) {
        report.categories.stress.tests = r.results;
      }
      report.details.push({
        file: r.file,
        timestamp: r.timestamp,
        passed: r.passed,
        failed: r.failed,
        type: 'stress',
      });
      continue;
    }
    
    // Regression tests (test-all-fases)
    if (r.fases) {
      let totalPassed = 0;
      let totalFailed = 0;
      
      for (const fase of Object.keys(r.fases)) {
        totalPassed += r.fases[fase].passed || 0;
        totalFailed += r.fases[fase].failed || 0;
        
        if (r.fases[fase].tests) {
          report.categories.regression.tests.push(
            ...r.fases[fase].tests.map(t => ({ ...t, fase }))
          );
        }
      }
      
      report.categories.regression.passed += totalPassed;
      report.categories.regression.failed += totalFailed;
      report.summary.total += totalPassed + totalFailed;
      report.summary.passed += totalPassed;
      report.summary.failed += totalFailed;
      
      report.details.push({
        file: r.file,
        timestamp: r.timestamp,
        passed: totalPassed,
        failed: totalFailed,
        type: 'regression',
      });
      continue;
    }
  }
  
  // Calculate success rate
  if (report.summary.total > 0) {
    report.summary.successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
  }
  
  // Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  
  console.log('✅ Report generated successfully!\n');
  console.log(`📄 Output: ${OUTPUT_FILE}\n`);
  console.log('📊 Summary:');
  console.log(`   Total: ${report.summary.total}`);
  console.log(`   Passed: ${report.summary.passed}`);
  console.log(`   Failed: ${report.summary.failed}`);
  console.log(`   Success Rate: ${report.summary.successRate}%\n`);
  
  // Print breakdown
  console.log('📦 By Category:');
  console.log(`   Unit Tests: ${report.categories.unit.passed} passed, ${report.categories.unit.failed} failed`);
  console.log(`   Regression: ${report.categories.regression.passed} passed, ${report.categories.regression.failed} failed`);
  console.log(`   Stress: ${report.categories.stress.passed} passed, ${report.categories.stress.failed} failed\n`);
  
  return report;
}

// Run
generateReport();
