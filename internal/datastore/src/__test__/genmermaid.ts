import { LetterSchema, SupplierSchema } from '../types';
import { generateMermaidDiagram } from 'zod-mermaid';
import * as fs from 'node:fs';

const out = fs.openSync('src/types.md', 'w');

const mermaid = generateMermaidDiagram([LetterSchema, SupplierSchema]);
fs.writeSync(out, `
# Letter schema

\`\`\`mermaid
${mermaid}
\`\`\``);

fs.closeSync(out);
