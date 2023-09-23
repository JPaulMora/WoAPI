const { spawn } = require('child_process');
const frappe = require('./frappe.js');
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

    // frappe module not included for security concerns
    frappe.updateSiteStatus(domain, nimble_pass=adminPass, stderr=res2.stderr)

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

async function createAdminUser(domain, email) {
  try {
    // Run wp-cli to create an admin user
    const createAdminArgs = ['user', 'create', 'Nimble',
      email, '--role=administrator', '--allow-root',
      `--path=/var/www/${domain}/htdocs`];
    const {stdout, stderr} = await runCommand(WP_BIN, createAdminArgs);
    if (stderr !== "") {
      logger.error(stderr);
    }
    return stdout.trim();
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const childProcess = spawn(command, args, {
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
      logger.info("Return code was: ${code}");
      resolve({ stdout, stderr });
    });
  });
}

module.exports = { createWordpress, createAdminUser };

