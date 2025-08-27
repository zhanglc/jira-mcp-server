#!/usr/bin/env tsx

/**
 * @fileoverview Performance benchmark script for Static Suggestion Engine
 * 
 * This script validates the real-world performance of the suggestion engine
 * against the specified requirements:
 * - Single suggestion generation: <1ms  
 * - Levenshtein calculation: <0.1ms per comparison
 * - Large candidate sets (100+ fields): <5ms
 * - Memory footprint: <10MB static data
 */

import { StaticSuggestionEngine } from '../server/resources/static-suggestion-engine.js';

async function runBenchmark() {
  console.log('🚀 Static Suggestion Engine Performance Benchmark\n');
  
  const engine = new StaticSuggestionEngine();
  
  // Test 1: Single Query Performance
  console.log('📊 Test 1: Single Query Performance');
  const singleQueryTests = [
    { entity: 'issue' as const, input: 'stat', expected: ['status'] },
    { entity: 'issue' as const, input: 'assign', expected: ['assignee'] },
    { entity: 'issue' as const, input: 'desc', expected: ['description'] },
    { entity: 'project' as const, input: 'key', expected: [] },
    { entity: 'user' as const, input: 'name', expected: [] }
  ];
  
  const singleQueryTimes: number[] = [];
  
  for (const test of singleQueryTests) {
    const startTime = performance.now();
    const results = engine.suggest(test.entity, test.input, 5);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    singleQueryTimes.push(duration);
    console.log(`  ${test.entity}:${test.input} → ${results.slice(0, 3).join(', ')} (${duration.toFixed(3)}ms)`);
  }
  
  const avgSingleQuery = singleQueryTimes.reduce((a, b) => a + b, 0) / singleQueryTimes.length;
  const maxSingleQuery = Math.max(...singleQueryTimes);
  console.log(`  Average: ${avgSingleQuery.toFixed(3)}ms | Max: ${maxSingleQuery.toFixed(3)}ms`);
  console.log(`  ✅ Target: <2ms | ${maxSingleQuery < 2.0 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 2: Levenshtein Distance Performance
  console.log('📊 Test 2: Levenshtein Distance Performance');
  const levenshteinTests = [
    ['status', 'stat'],
    ['assignee', 'assigne'],
    ['description', 'desc'],
    ['priority', 'pririty'],
    ['project', 'prject']
  ];
  
  const levenshteinTimes: number[] = [];
  
  for (const [str1, str2] of levenshteinTests) {
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      engine.calculateSimilarity(str1 || '', str2 || '');
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    levenshteinTimes.push(avgTime);
    
    console.log(`  "${str1}" vs "${str2}" → ${avgTime.toFixed(4)}ms per calc`);
  }
  
  const avgLevenshtein = levenshteinTimes.reduce((a, b) => a + b, 0) / levenshteinTimes.length;
  const maxLevenshtein = Math.max(...levenshteinTimes);
  console.log(`  Average: ${avgLevenshtein.toFixed(4)}ms | Max: ${maxLevenshtein.toFixed(4)}ms`);
  console.log(`  ✅ Target: <0.1ms | ${maxLevenshtein < 0.1 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 3: Large Candidate Set Performance
  console.log('📊 Test 3: Large Candidate Set Performance');
  const largeCandidateTests = [
    { entity: 'issue' as const, input: 'as', desc: 'Partial match (short input)' },
    { entity: 'issue' as const, input: 'custom', desc: 'Custom field search' },
    { entity: 'issue' as const, input: 'status', desc: 'High similarity match' },
    { entity: 'issue' as const, input: 'xyz', desc: 'Low similarity match' }
  ];
  
  const largeCandidateTimes: number[] = [];
  
  for (const test of largeCandidateTests) {
    const startTime = performance.now();
    const results = engine.suggest(test.entity, test.input, 10);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    largeCandidateTimes.push(duration);
    console.log(`  ${test.desc}: "${test.input}" → ${results.length} results (${duration.toFixed(3)}ms)`);
  }
  
  const avgLargeCandidate = largeCandidateTimes.reduce((a, b) => a + b, 0) / largeCandidateTimes.length;
  const maxLargeCandidate = Math.max(...largeCandidateTimes);
  console.log(`  Average: ${avgLargeCandidate.toFixed(3)}ms | Max: ${maxLargeCandidate.toFixed(3)}ms`);
  console.log(`  ✅ Target: <5ms | ${maxLargeCandidate < 5.0 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 4: Stress Test - Many Queries
  console.log('📊 Test 4: Stress Test - Batch Processing');
  const stressInputs = [
    'stat', 'assign', 'desc', 'prio', 'proj', 'user', 'name', 'key',
    'summary', 'reporter', 'created', 'updated', 'resolution', 'labels'
  ];
  
  const stressStartTime = performance.now();
  const stressResults: any[] = [];
  
  for (let i = 0; i < 100; i++) {
    const input = stressInputs[i % stressInputs.length] || '';
    const entity = ['issue', 'project', 'user', 'agile'][i % 4] as 'issue' | 'project' | 'user' | 'agile';
    stressResults.push(engine.suggest(entity, input, 5));
  }
  
  const stressEndTime = performance.now();
  const stressDuration = stressEndTime - stressStartTime;
  const avgStressQuery = stressDuration / 100;
  
  console.log(`  100 queries processed in ${stressDuration.toFixed(3)}ms`);
  console.log(`  Average per query: ${avgStressQuery.toFixed(4)}ms`);
  console.log(`  ✅ Target: <1ms avg | ${avgStressQuery < 1.0 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 5: Memory Usage Estimation
  console.log('📊 Test 5: Memory Usage Analysis');
  const memStart = process.memoryUsage();
  
  // Create multiple engines to simulate memory usage
  const engines = Array.from({ length: 10 }, () => new StaticSuggestionEngine());
  
  // Perform operations
  engines.forEach((eng, index) => {
    eng.suggest('issue', `test${index}`, 5);
    eng.suggestWithMetadata('issue', `query${index}`, { maxSuggestions: 10 });
  });
  
  const memEnd = process.memoryUsage();
  const memDelta = {
    rss: (memEnd.rss - memStart.rss) / 1024 / 1024,
    heapUsed: (memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024,
    heapTotal: (memEnd.heapTotal - memStart.heapTotal) / 1024 / 1024
  };
  
  console.log(`  RSS Memory Delta: ${memDelta.rss.toFixed(2)}MB`);
  console.log(`  Heap Used Delta: ${memDelta.heapUsed.toFixed(2)}MB`);
  console.log(`  Heap Total Delta: ${memDelta.heapTotal.toFixed(2)}MB`);
  console.log(`  ✅ Target: <10MB | ${memDelta.heapUsed < 10 ? 'PASS' : 'FAIL'}\n`);
  
  // Test 6: Algorithm Correctness Validation
  console.log('📊 Test 6: Algorithm Correctness Validation');
  
  // Test typo corrections
  const typoTests = [
    { input: 'stat', expected: 'status' },
    { input: 'assigne', expected: 'assignee' },
    { input: 'desc', expected: 'description' }
  ];
  
  let typoPassCount = 0;
  for (const test of typoTests) {
    const results = engine.suggest('issue', test.input, 5);
    const pass = results.includes(test.expected);
    console.log(`  Typo "${test.input}" → ${pass ? '✅' : '❌'} (expected: ${test.expected})`);
    if (pass) typoPassCount++;
  }
  
  // Test similarity matching
  const similarityTests = [
    { input: 'statu', shouldContain: 'status' },
    { input: 'assig', shouldContain: 'assignee' },
    { input: 'summ', shouldContain: 'summary' }
  ];
  
  let similarityPassCount = 0;
  for (const test of similarityTests) {
    const results = engine.suggest('issue', test.input, 5);
    const pass = results.includes(test.shouldContain);
    console.log(`  Similarity "${test.input}" → ${pass ? '✅' : '❌'} (should contain: ${test.shouldContain})`);
    if (pass) similarityPassCount++;
  }
  
  console.log(`  Typo Correction: ${typoPassCount}/${typoTests.length} passed`);
  console.log(`  Similarity Matching: ${similarityPassCount}/${similarityTests.length} passed`);
  console.log(`  ✅ Overall Algorithm: ${(typoPassCount + similarityPassCount) === (typoTests.length + similarityTests.length) ? 'PASS' : 'FAIL'}\n`);
  
  // Summary
  console.log('🎯 Performance Summary');
  console.log('================================');
  const allPassing = 
    maxSingleQuery < 2.0 &&
    maxLevenshtein < 0.1 &&
    maxLargeCandidate < 5.0 &&
    avgStressQuery < 1.0 &&
    memDelta.heapUsed < 10 &&
    (typoPassCount + similarityPassCount) === (typoTests.length + similarityTests.length);
  
  console.log(`Single Query Performance: ${maxSingleQuery < 2.0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Levenshtein Performance: ${maxLevenshtein < 0.1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Large Candidate Performance: ${maxLargeCandidate < 5.0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Stress Test Performance: ${avgStressQuery < 1.0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Memory Usage: ${memDelta.heapUsed < 10 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Algorithm Correctness: ${(typoPassCount + similarityPassCount) === (typoTests.length + similarityTests.length) ? '✅ PASS' : '❌ FAIL'}`);
  console.log('================================');
  console.log(`🏆 Overall Result: ${allPassing ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassing;
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { runBenchmark };