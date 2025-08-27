#!/usr/bin/env tsx

/**
 * @fileoverview Demo script for Static Suggestion Engine
 * 
 * This script demonstrates the capabilities of the lightweight suggestion engine:
 * - Typo correction
 * - Similarity-based matching
 * - Multi-factor ranking
 * - Performance characteristics
 */

import { StaticSuggestionEngine } from '../server/resources/static-suggestion-engine.js';

function printHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 ${title}`);
  console.log('='.repeat(60));
}

function printSection(title: string) {
  console.log(`\n📋 ${title}`);
  console.log('-'.repeat(40));
}

async function runDemo() {
  console.log('🚀 Static Suggestion Engine Demo');
  console.log('Built for high-performance MCP field suggestions');
  
  const engine = new StaticSuggestionEngine();
  
  printHeader('1. Typo Correction Demonstration');
  
  // Common typos that should be corrected instantly
  const typoTests = [
    { input: 'stat', entity: 'issue' as const, desc: 'Common status abbreviation' },
    { input: 'assigne', entity: 'issue' as const, desc: 'Missing final "e"' },
    { input: 'desc', entity: 'issue' as const, desc: 'Description abbreviation' },
    { input: 'sumary', entity: 'issue' as const, desc: 'Missing "m" in summary' },
    { input: 'priorty', entity: 'issue' as const, desc: 'Transposed letters' },
    { input: 'reporte', entity: 'issue' as const, desc: 'Missing "r"' }
  ];
  
  for (const test of typoTests) {
    const startTime = performance.now();
    const results = engine.suggest(test.entity, test.input, 3);
    const endTime = performance.now();
    
    console.log(`"${test.input}" → [${results.join(', ')}] (${(endTime - startTime).toFixed(3)}ms)`);
    console.log(`  📝 ${test.desc}`);
  }
  
  printHeader('2. Similarity-Based Matching');
  
  // Partial matches and similarity scenarios
  const similarityTests = [
    { input: 'statu', entity: 'issue' as const, desc: 'Partial word, high similarity' },
    { input: 'as', entity: 'issue' as const, desc: 'Very short input, prefix matching' },
    { input: 'proj', entity: 'project' as const, desc: 'Project field prefix' },
    { input: 'custom', entity: 'issue' as const, desc: 'Custom field search' },
    { input: 'sprint', entity: 'agile' as const, desc: 'Agile-specific field' },
    { input: 'user', entity: 'user' as const, desc: 'User entity field search' }
  ];
  
  for (const test of similarityTests) {
    const startTime = performance.now();
    const results = engine.suggest(test.entity, test.input, 5);
    const endTime = performance.now();
    
    console.log(`${test.entity}:"${test.input}" → [${results.join(', ')}] (${(endTime - startTime).toFixed(3)}ms)`);
    console.log(`  📝 ${test.desc}`);
  }
  
  printHeader('3. Detailed Scoring Analysis');
  
  printSection('Metadata for "status" query');
  const statusResults = engine.suggestWithMetadata('issue', 'status', { maxSuggestions: 5 });
  statusResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.field}`);
    console.log(`   Score: ${result.score.toFixed(3)}`);
    console.log(`   Similarity: ${result.metadata.similarity.toFixed(3)}`);
    console.log(`   Frequency: ${result.metadata.frequency}`);
    console.log(`   Availability: ${result.metadata.availability.toFixed(3)}`);
    console.log(`   Typo Correction: ${result.metadata.isTypoCorrection ? 'Yes' : 'No'}`);
    console.log(`   Contextual Boost: ${result.metadata.contextualBoost.toFixed(3)}`);
  });
  
  printSection('Metadata for partial match "assign"');
  const assignResults = engine.suggestWithMetadata('issue', 'assign', { maxSuggestions: 3 });
  assignResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.field}`);
    console.log(`   Score: ${result.score.toFixed(3)}`);
    console.log(`   Similarity: ${result.metadata.similarity.toFixed(3)}`);
    console.log(`   Frequency: ${result.metadata.frequency}`);
    console.log(`   Availability: ${result.metadata.availability.toFixed(3)}`);
  });
  
  printHeader('4. Cross-Entity Comparison');
  
  const crossEntityInput = 'name';
  console.log(`Searching for "${crossEntityInput}" across all entity types:\n`);
  
  const entityTypes = ['issue', 'project', 'user', 'agile'] as const;
  for (const entityType of entityTypes) {
    const results = engine.suggest(entityType, crossEntityInput, 3);
    console.log(`${entityType.padEnd(8)}: [${results.join(', ')}]`);
  }
  
  printHeader('5. Performance Characteristics');
  
  // Batch performance test
  printSection('Batch Query Performance');
  const batchInputs = ['stat', 'assign', 'desc', 'prio', 'proj', 'user', 'custom', 'time'];
  const batchStartTime = performance.now();
  
  const batchResults = batchInputs.map(input => ({
    input,
    results: engine.suggest('issue', input, 3)
  }));
  
  const batchEndTime = performance.now();
  const batchDuration = batchEndTime - batchStartTime;
  
  console.log(`Processed ${batchInputs.length} queries in ${batchDuration.toFixed(3)}ms`);
  console.log(`Average per query: ${(batchDuration / batchInputs.length).toFixed(4)}ms`);
  
  batchResults.forEach(({ input, results }) => {
    console.log(`  "${input}" → [${results.join(', ')}]`);
  });
  
  // Edge case testing
  printSection('Edge Case Handling');
  const edgeCases = [
    { input: '', desc: 'Empty string' },
    { input: '   ', desc: 'Whitespace only' },
    { input: 'xyz123', desc: 'No similarity' },
    { input: 'status!@#', desc: 'Special characters' },
    { input: 'a'.repeat(100), desc: 'Very long input' }
  ];
  
  for (const testCase of edgeCases) {
    const results = engine.suggest('issue', testCase.input, 3);
    console.log(`"${testCase.input.substring(0, 20)}${testCase.input.length > 20 ? '...' : ''}" → [${results.join(', ')}]`);
    console.log(`  📝 ${testCase.desc} (${results.length} results)`);
  }
  
  printHeader('6. Algorithm Validation');
  
  printSection('Levenshtein Distance Accuracy');
  const distanceTests = [
    ['status', 'status'], // Identical
    ['status', 'stat'],   // Suffix removal
    ['assignee', 'assigne'], // Single character difference
    ['description', 'desc'], // Significant truncation
    ['priority', 'pririty'], // Character transposition
  ];
  
  for (const [str1, str2] of distanceTests) {
    const similarity = engine.calculateSimilarity(str1 || '', str2 || '');
    console.log(`"${str1}" vs "${str2}" → similarity: ${similarity.toFixed(3)}`);
  }
  
  printSection('Ranking Algorithm Verification');
  const rankingTest = engine.suggestWithMetadata('issue', 'st', { maxSuggestions: 5 });
  console.log('Top suggestions for "st" (should be ranked by relevance):');
  
  rankingTest.forEach((result, index) => {
    const factors = [
      `sim:${result.metadata.similarity.toFixed(2)}`,
      `freq:${result.metadata.frequency}`,
      `avail:${result.metadata.availability.toFixed(2)}`,
      `boost:${result.metadata.contextualBoost.toFixed(2)}`
    ].join(' | ');
    
    console.log(`${index + 1}. ${result.field} (score: ${result.score.toFixed(3)})`);
    console.log(`   Factors: ${factors}`);
  });
  
  printHeader('7. Real-World Usage Examples');
  
  const realWorldScenarios = [
    {
      scenario: 'User typing field name incrementally',
      queries: ['s', 'st', 'sta', 'stat', 'statu', 'status']
    },
    {
      scenario: 'Common misspellings in search',
      queries: ['assigne', 'priorit', 'summery', 'descritpion']
    },
    {
      scenario: 'Abbreviated field names',
      queries: ['desc', 'prio', 'proj', 'comp', 'ver']
    }
  ];
  
  for (const scenario of realWorldScenarios) {
    printSection(scenario.scenario);
    
    for (const query of scenario.queries) {
      const results = engine.suggest('issue', query, 3);
      console.log(`"${query}" → [${results.join(', ')}]`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo completed successfully!');
  console.log('💡 The Static Suggestion Engine provides:');
  console.log('   • Sub-millisecond response times');
  console.log('   • Intelligent typo correction');
  console.log('   • Multi-factor relevance ranking');
  console.log('   • Stateless operation for MCP');
  console.log('   • Comprehensive field coverage');
  console.log('='.repeat(60));
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

export { runDemo };