const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');


// Generate a random encryption key for this build
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
        production: true,
        gcodeReturner: {
            localApi: "http://localhost:8000/api/",
            prodApi: "https://signatureeu.pythonanywhere.com/api/",
            endpoints: {
                convert: "convert/",
                ssim: "evaluate/ssim/",
                smoothness: "evaluate/smoothness/",
                execErr: "evaluate/execution-error/",
                signedSubmit: "signed/submit/",
                signedRetrieve: "signed/retrieve/"
            },
            signingKey: "",
            encryptedSigningKey: "${combinedData.toString('hex')}",
            keyDerivationSalt: "${encryptionKey.toString('hex')}",
            iv: "${iv.toString('hex')}"
        }
    };
`;

// Create environment file
function createEnvFile() {
    fs.writeFileSync(envTsPath, envConfig);
    console.log('Environment file created with signing key');
}

// Cleanup function
function cleanup() {
    const cleanupConfig = `
    export const data = {
        production: true,
        gcodeReturner: {
            localApi: "http://localhost:8000/api/",
            prodApi: "https://signatureeu.pythonanywhere.com/api/",
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
        console.log('Environment file cleaned up');
    }
}

// Main process
createEnvFile();

exec('ng build', (error, stdout, stderr) => {
    if (error) {
        console.error(`Build error: ${error}`);
        cleanup();
        process.exit(1);
    }
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    cleanup();
    console.log('Build completed successfully!');
});