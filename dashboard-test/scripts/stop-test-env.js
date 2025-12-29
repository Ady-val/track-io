#!/usr/bin/env node
/**
 * Script para detener el entorno de testing
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🛑 Deteniendo entorno de testing...\n');

const dockerDir = join(__dirname, '../../docker');
const dockerComposeFile = join(dockerDir, 'docker-compose.test.yml');

if (!existsSync(dockerComposeFile)) {
  console.error('❌ Error: No se encuentra docker-compose.test.yml');
  process.exit(1);
}

try {
  execSync(`docker-compose -f "${dockerComposeFile}" down`, {
    cwd: dockerDir,
    stdio: 'inherit',
  });
  console.log('\n✅ Entorno detenido correctamente\n');
} catch (error) {
  console.error('\n❌ Error al detener el entorno');
  process.exit(1);
}
