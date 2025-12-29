#!/usr/bin/env node
/**
 * Script simplificado para iniciar el entorno de testing
 * Inicia PostgreSQL y Backend, el seed se ejecuta automáticamente en el backend
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando entorno de testing...\n');

const dockerDir = join(__dirname, '../../docker');
const dockerComposeFile = join(dockerDir, 'docker-compose.test.yml');

if (!existsSync(dockerComposeFile)) {
  console.error('❌ Error: No se encuentra docker-compose.test.yml');
  process.exit(1);
}

try {
  execSync('docker --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: Docker no está instalado o no está corriendo');
  process.exit(1);
}

console.log('📦 Iniciando contenedores...');
try {
  execSync(`docker-compose -f "${dockerComposeFile}" up -d --build`, {
    cwd: dockerDir,
    stdio: 'inherit',
  });
  
  console.log('\n✅ Entorno iniciado correctamente');
  console.log('   PostgreSQL: localhost:5433');
  console.log('   Backend: http://localhost:3001');
  console.log('   El usuario ADMIN se creará automáticamente en ~10 segundos\n');
} catch (error) {
  console.error('\n❌ Error al iniciar el entorno');
  process.exit(1);
}
