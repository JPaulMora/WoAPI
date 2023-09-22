const { spawn } = require('child_process');

const logger = require('winston');

const WORDOPS_BIN = 'wotest';
const WP_BIN = 'wptest';

function createWordpress(domain) {
  return new Promise((resolve, reject) => {
    // Run WordOps to create the site
    const woProcess = spawn(WORDOPS_BIN, ['site', 'create', domain, '--wpfc', '-le', '--dns=dns_cf']);

    let adminPass = '';

    woProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line) => {
        if (line.includes('WordPress admin password')) {
          adminPass = line;
        }
      });
    });

    woProcess.stderr.on('data', (data) => {
      logger.error(data.toString());
    });

    woProcess.on('close', (code) => {
      if (code === 0) {
        resolve(adminPass);
      } else {
        reject(new Error(`WordOps process exited with code ${code}`));
      }
    });
  });
}

async function createAdminUser(domain) {
  try {
    // Run wp-cli to create an admin user
    const createAdminCmd = [WP_BIN, 'user', 'create', 'Nimble',
      'juanluis.e@nimble.gt', '--role=administrator', '--allow-root',
      `--path=/var/www/${domain}/htdocs`];
    const { stdout, stderr } = await runCommand(createAdminCmd);
    return stdout.trim();
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}

async function runCommand(command) {
    const childProcess = spawn(command[0], command.slice(1), {
      stdio:
        'pipe'
    });
    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
}

module.exports = { createWordpress, createAdminUser };

