/**
 * Static Field Analysis Generator
 * 
 * Build-time analysis script that connects to Jira and generates static suggestion data
 * for all 4 entity types: issues, projects, users, agile
 * 
 * Usage: npx tsx src/scripts/generate-static-analysis.ts
 */

import * as fs from 'fs/promises';
import { JiraClientWrapper } from '../client/jira-client-wrapper.js';
import { config } from '../utils/config.js';
import type { StaticSuggestionData } from '../types/static-suggestions.js';

export interface StaticAnalysisResult extends StaticSuggestionData {}

/**
 * Generate static analysis for all entity types
 */
export async function generateStaticAnalysis(): Promise<void> {
  const client = new JiraClientWrapper(config);
  
  try {
    console.log('Starting static analysis generation...');
    
    // Ensure output directory exists
    await fs.mkdir('src/server/resources/static-suggestions', { recursive: true });
    
    // Analyze all 4 entity types
    const analysisResults = await Promise.all([
      analyzeIssueFields(client),
      analyzeProjectFields(client),
      analyzeUserFields(client),
      analyzeAgileFields(client)
    ]);
    
    // Generate static suggestion files
    for (const result of analysisResults) {
      await generateSuggestionFile(result);
    }
    
    console.log('Static analysis generation completed successfully');
  } catch (error) {
    console.error('Error generating static analysis:', error);
    throw error;
  }
}

/**
 * Analyze issue fields through JQL sampling
 */
export async function analyzeIssueFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const searchResult = await client.searchIssues('ORDER BY created DESC', {
    maxResults: 50,
    fields: ['*all']
  });
  
  const sampleIssues = searchResult.issues;
  
  const fieldUsage = analyzeFieldUsage(sampleIssues, 'issue');
  const typoPatterns = generateTypoCorrections('issue');
  
  return {
    entityType: 'issue',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 10),
    customFieldPatterns: extractCustomFieldPatterns(sampleIssues),
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze project fields through REST API sampling
 */
export async function analyzeProjectFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const projects = await client.getAllProjects();
  const sampleProjects = projects.slice(0, 20); // Sample subset
  
  const fieldUsage = analyzeFieldUsage(sampleProjects, 'project');
  const typoPatterns = generateTypoCorrections('project');
  
  return {
    entityType: 'project',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 8),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze user fields through user search sampling
 */
export async function analyzeUserFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const users = await client.searchUsers('', 30);
  
  const fieldUsage = analyzeFieldUsage(users, 'user');
  const typoPatterns = generateTypoCorrections('user');
  
  return {
    entityType: 'user',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 6),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Analyze agile fields through board and sprint sampling
 */
export async function analyzeAgileFields(client: JiraClientWrapper): Promise<StaticAnalysisResult> {
  const boards = await client.getAgileBoards();
  const limitedBoards = boards.slice(0, 10); // Limit to 10 boards
  let sprints: any[] = [];
  
  // Get sprints from first few boards only
  for (const board of limitedBoards.slice(0, 3)) {
    try {
      const boardSprints = await client.getSprintsFromBoard(board.id);
      sprints.push(...boardSprints.slice(0, 5)); // Limit to 5 sprints per board
    } catch (error) {
      console.warn(`Warning: Could not fetch sprints for board ${board.id}:`, error);
    }
  }
  
  const combinedData = [...limitedBoards, ...sprints];
  const fieldUsage = analyzeFieldUsage(combinedData, 'agile');
  const typoPatterns = generateTypoCorrections('agile');
  
  return {
    entityType: 'agile',
    typoCorrections: typoPatterns,
    usageStatistics: fieldUsage,
    contextualSuggestions: getTopUsedFields(fieldUsage, 8),
    customFieldPatterns: {},
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Generate typo corrections for common field name mistakes
 */
export function generateTypoCorrections(entityType: string): Record<string, string> {
  const corrections: Record<string, Record<string, string>> = {
    issue: {
      'stat': 'status',
      'statu': 'status',
      'statuc': 'status',
      'assigne': 'assignee',
      'asignee': 'assignee',
      'sumary': 'summary',
      'summry': 'summary',
      'discription': 'description',
      'descripion': 'description',
      'priorty': 'priority',
      'priorit': 'priority',
      'reporte': 'reporter',
      'reportr': 'reporter',
      'projec': 'project',
      'issutyp': 'issuetype',
      'creatd': 'created',
      'updated': 'updated'
    },
    project: {
      'nam': 'name',
      'nme': 'name',
      'discription': 'description',
      'descripion': 'description',
      'ley': 'key',
      'kye': 'key',
      'leed': 'lead',
      'led': 'lead',
      'categry': 'projectCategory',
      'catgory': 'projectCategory',
      'archvd': 'archived',
      'archved': 'archived',
      'deletd': 'deleted',
      'delet': 'deleted'
    },
    user: {
      'displayNam': 'displayName',
      'displyName': 'displayName',
      'emailAdress': 'emailAddress',
      'emailAdres': 'emailAddress',
      'acountId': 'accountId',
      'accountd': 'accountId',
      'activ': 'active',
      'actve': 'active',
      'timeZon': 'timeZone',
      'timZone': 'timeZone',
      'local': 'locale',
      'locle': 'locale'
    },
    agile: {
      'nam': 'name',
      'nme': 'name',
      'stat': 'state',
      'stae': 'state',
      'typ': 'type',
      'tpe': 'type',
      'startDat': 'startDate',
      'startDte': 'startDate',
      'endDat': 'endDate',
      'endDte': 'endDate',
      'gol': 'goal',
      'goa': 'goal',
      'boardI': 'originBoardId',
      'boardd': 'originBoardId'
    }
  };

  return corrections[entityType] || {};
}

/**
 * Analyze field usage patterns in sampled data
 */
export function analyzeFieldUsage(
  entities: any[], 
  entityType: string
): Record<string, { frequency: 'high' | 'medium' | 'low'; availability: number }> {
  if (entities.length === 0) {
    return {};
  }

  const fieldCounts: Record<string, number> = {};
  const totalEntities = entities.length;

  // Count field presence across entities
  for (const entity of entities) {
    const fields = entityType === 'issue' ? entity.fields || entity : entity;
    
    for (const [fieldKey, fieldValue] of Object.entries(fields)) {
      if (fieldValue !== null && fieldValue !== undefined) {
        fieldCounts[fieldKey] = (fieldCounts[fieldKey] || 0) + 1;
      }
    }
  }

  // Calculate availability and frequency
  const result: Record<string, { frequency: 'high' | 'medium' | 'low'; availability: number }> = {};
  
  for (const [fieldKey, count] of Object.entries(fieldCounts)) {
    const availability = count / totalEntities;
    let frequency: 'high' | 'medium' | 'low';
    
    if (availability >= 0.8) {
      frequency = 'high';
    } else if (availability >= 0.3) {
      frequency = 'medium';
    } else {
      frequency = 'low';
    }

    result[fieldKey] = { frequency, availability };
  }

  return result;
}

/**
 * Get top used fields sorted by availability
 */
export function getTopUsedFields(
  usage: Record<string, { frequency: 'high' | 'medium' | 'low'; availability: number }>,
  limit: number
): string[] {
  return Object.entries(usage)
    .sort(([, a], [, b]) => b.availability - a.availability)
    .slice(0, limit)
    .map(([fieldKey]) => fieldKey);
}

/**
 * Extract custom field patterns from issue data
 */
export function extractCustomFieldPatterns(issues: any[]): Record<string, string[]> {
  const patterns: Record<string, Set<string>> = {};

  for (const issue of issues) {
    const fields = issue.fields || issue;
    
    for (const [fieldKey, fieldValue] of Object.entries(fields)) {
      if (fieldKey.startsWith('customfield_') && fieldValue !== null && fieldValue !== undefined) {
        if (!patterns[fieldKey]) {
          patterns[fieldKey] = new Set();
        }

        const valueType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;
        patterns[fieldKey].add(valueType);
      }
    }
  }

  // Convert Sets to Arrays
  const result: Record<string, string[]> = {};
  for (const [fieldKey, typeSet] of Object.entries(patterns)) {
    result[fieldKey] = Array.from(typeSet);
  }

  return result;
}

/**
 * Generate suggestion file for an entity type
 */
export async function generateSuggestionFile(result: StaticAnalysisResult): Promise<void> {
  const constantName = `${result.entityType.toUpperCase()}_STATIC_SUGGESTIONS`;
  
  // Ensure directory exists
  await fs.mkdir('src/server/resources/static-suggestions', { recursive: true });
  
  const content = `// Auto-generated static suggestions for ${result.entityType} fields
// Generated on: ${result.lastAnalyzed}
// DO NOT EDIT MANUALLY - This file is generated by scripts/generate-static-analysis.ts

import type { StaticSuggestionData } from '../types/static-suggestions.js';

export const ${constantName}: StaticSuggestionData = ${JSON.stringify(result, null, 2)};
`;
  
  const filePath = `src/server/resources/static-suggestions/${result.entityType}-suggestions.ts`;
  await fs.writeFile(filePath, content);
  console.log(`Generated ${filePath}`);
}

// CLI interface - only run if this file is executed directly
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('generate-static-analysis.ts') ||
  process.argv[1].endsWith('generate-static-analysis.js')
);

if (isMainModule) {
  generateStaticAnalysis().catch((error) => {
    console.error('Failed to generate static analysis:', error);
    process.exit(1);
  });
}