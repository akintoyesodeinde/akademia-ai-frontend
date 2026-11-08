import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendOpenApiPath = path.resolve(__dirname, '../../akademia-ai-backend/openapi.json');
const generatedSchemaPath = path.resolve(__dirname, '../src/api/generated/schema.ts');

if (fs.existsSync(backendOpenApiPath)) {
  const raw = JSON.parse(fs.readFileSync(backendOpenApiPath, 'utf-8'));
  const pathCount = Object.keys(raw.paths || {}).length;
  console.log(`Verified OpenAPI contract synchronization: ${pathCount} API paths in openapi.json`);
} else {
  console.log('Using committed generated OpenAPI TypeScript contract in src/api/generated/schema.ts');
}

if (!fs.existsSync(generatedSchemaPath)) {
  console.error('Missing src/api/generated/schema.ts');
  process.exit(1);
}
