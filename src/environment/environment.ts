
    export const data = {
            production: true,
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
