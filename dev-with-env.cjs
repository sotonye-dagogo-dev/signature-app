const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Generate a random encryption key for this dev session
const encryptionKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const envTsPath = path.join(__dirname, 'src/environment/environment.ts');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const signingKey = envContent.match(/BACKEND_SIGNING_KEY=(.+)/)[1];

// Encrypt the signing key
const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
let encrypted = cipher.update(signingKey, 'utf8', 'hex');
encrypted += cipher.final('hex');

// Combine IV and encrypted data (IV first, then ciphertext)
const combinedData = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);

const envConfig = `
    export const data = {
        production: false,
        gcodeReturner: {
            localApi: "http://localhost:8000/api/",
            prodApi: "https://signatureeu.pythonanywhere.com/api/",
            localEvalApi: "http://localhost:8001/api/",
            prodEvalApi: "https://signatureeueval.pythonanywhere.com/api/",
            endpoints: {
                convert: "convert/",
                ssim: "evaluate/ssim/",
                smoothness: "evaluate/smoothness/",
                execErr: "evaluate/execution-error/",
                signedSubmit: "signed/submit/",
                signedRetrieve: "signed/retrieve/"
            },
            signingKey: "${signingKey}",
            encryptedSigningKey: "${combinedData.toString('hex')}",
            keyDerivationSalt: "${encryptionKey.toString('hex')}",
            iv: "${iv.toString('hex')}"
        }
    };
`;

// Create environment file
function createEnvFile() {
    fs.writeFileSync(envTsPath, envConfig);
    console.log('Development environment file created with signing key');
}

// Cleanup function
function cleanup() {
    const cleanupConfig = `
    export const data = {
        production: false,
        gcodeReturner: {
            localApi: "http://localhost:8000/api/",
            prodApi: "https://signatureeu.pythonanywhere.com/api/",
            localEvalApi: "http://localhost:8001/api/",
            prodEvalApi: "https://signatureeueval.pythonanywhere.com/api/",
            endpoints: {
                convert: "convert/",
                ssim: "evaluate/ssim/",
                smoothness: "evaluate/smoothness/",
                execErr: "evaluate/execution-error/",
                signedSubmit: "signed/submit/",
                signedRetrieve: "signed/retrieve/"
            },
            signingKey: "",
            encryptedSigningKey: "",
            keyDerivationSalt: "",
            iv: ""
        }
    };
`;
    if (fs.existsSync(envTsPath)) {
        fs.writeFileSync(envTsPath, cleanupConfig);
        console.log('Development environment file cleaned up');
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down development server...');
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down development server...');
    cleanup();
    process.exit(0);
});

// Main process
createEnvFile();

console.log('Starting development server...');
const devServer = spawn('ng', ['serve' ], {
    stdio: 'inherit',
    shell: true
});

devServer.on('error', (error) => {
    console.error(`Dev server error: ${error}`);
    cleanup();
    process.exit(1);
});

devServer.on('close', (code) => {
    console.log(`Dev server exited with code ${code}`);
    cleanup();
    process.exit(code);
});