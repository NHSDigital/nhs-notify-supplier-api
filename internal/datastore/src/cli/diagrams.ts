import {LetterSchema, MISchema, SupplierSchema} from '../types';
import { generateMermaidDiagram } from 'zod-mermaid';
import * as fs from 'node:fs';

const out = fs.openSync('src/types.md', 'w');

fs.writeSync(out, `# Data Store Schemas

This document contains the mermaid diagrams for the data store schemas used in the application.

The schemas are generated from Zod definitions and provide a visual representation of the data structure.
`);

for (const [name, schema] of Object.entries({ Letter: [LetterSchema], MI: [MISchema], Supplier: [SupplierSchema] })) {
  const mermaid = generateMermaidDiagram(schema);
  fs.writeSync(out, `
## ${name} schema

\`\`\`mermaid
${mermaid}
\`\`\`
`);
}

fs.closeSync(out);
