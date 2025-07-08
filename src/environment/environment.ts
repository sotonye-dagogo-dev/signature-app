export const data = {
    production: false,
    gcodeReturner: {
        localApi: "http://localhost:8000/api/",
        prodApi: "https://<production-host>/api/",
        endpoints: {
            convert: "convert/",
            ssim: "evaluate/ssim/",
            smoothness: "evaluate/smoothness/",
            execErr: "evaluate/execution-error/",
            signedSubmit: "signed/submit/",
            signedRetrieve: "signed/retrieve/"
        },
        // Development signing key - matches the backend's FRONTEND_SIGNING_KEY
        signingKey: "dev-signing-key-change-in-production"
    }
}