import { Step, StepType } from "../types"

/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */


export function parseXml(response: string): Step[] {
    // Extract the XML content between <boltArtifact> tags
    const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
    
    if (!xmlMatch) {
      return [];
    }
  
    const xmlContent = xmlMatch[1];
    const steps: Step[] = [];
    let stepId = 1;
  
    // Extract artifact title
    const titleMatch = response.match(/title="([^"]*)"/);
    const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';
  
    // Add initial artifact step
    steps.push({
      id: stepId++,
      title: artifactTitle,
      description: '',
      type: StepType.CreateFolder,
      status: 'pending'
    });
  
    // Regular expression to find boltAction elements
    const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;
    
    let match;
    while ((match = actionRegex.exec(xmlContent)) !== null) {
      const [, type, filePath, content] = match;

      // Clean the content by removing Markdown code fence indicators
      const cleanContent = content.replace(/```[a-zA-Z]*\n/g, '')  // Remove opening fence with language
                                 .replace(/```\n?/g, '')           // Remove closing fence
                                 .trim();
  
      if (type === 'file') {
        // File creation step
        steps.push({
          id: stepId++,
          title: `Create ${filePath || 'file'}`,
          description: '',
          type: StepType.CreateFile,
          status: 'pending',
          code: cleanContent,
          path: filePath
        });
      } else if (type === 'shell') {
        // Shell command step
        steps.push({
          id: stepId++,
          title: 'Run command',
          description: '',
          type: StepType.RunScript,
          status: 'pending',
          code: cleanContent
        });
      }
    }
  
    return steps;
  }