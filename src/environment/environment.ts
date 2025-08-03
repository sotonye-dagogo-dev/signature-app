
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
            encryptedSigningKey: "4e7dfade0111b91c9e8f4db82cb48089c1bfa0bda7d8f75ac8f53a7e069ef0e8d49c8988b24639df68abc2d219210bb58e768b976669514e8c973e1aa5ddd84b",
            keyDerivationSalt: "b1096ea2c25404e4f2b1a30b20dfc5d8ab7e02f9dfbde021876fddb88bd7a46f",
            iv: "4e7dfade0111b91c9e8f4db82cb48089"
        }
    };
