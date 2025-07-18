
    export const data = {
        production: false,
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
