# SignatureApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## CI/CD (Firebase Hosting)

GitHub Actions runs a build on pull requests to `main`, and builds + deploys on pushes to `main`.

The deploy step needs a Firebase credential. **Recommended: service-account key** (not deprecated). A
`FIREBASE_TOKEN` (legacy, deprecated) is also supported as a fallback and takes effect only when no
service-account secret is set.

### Recommended: `FIREBASE_SERVICE_ACCOUNT` secret (service-account key)

1. Create a service account in Google Cloud for the `signature-eu` project:
   - Google Cloud Console → project `signature-eu` → **IAM & Admin → Service accounts → Create service account**
   - Name: e.g. `github-ci-deploy`
2. Grant it the deploy roles:
   - **Firebase Hosting Admin** (required for hosting)
   - **Service Account User** (needed by the Firebase CLI to act as the default compute/service account)
   - If you later deploy Cloud Functions or use the SSR frameworks backend: **Cloud Functions Admin** / **Cloud Run Admin** as well.
3. Create and download a key:
   - Service account → **Keys → Add key → Create new key → JSON** → download `key.json`
4. Encode the key to base64 (avoids multi-line secret issues):
   - PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("key.json"))`
   - macOS/Linux: `base64 -i key.json -w0`
5. Add it to the repository:
   - GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: the base64 string from step 4
6. Re-run the workflow (or push again to `main`).

Notes:
- The workflow decodes the secret to a temp JSON file and sets `GOOGLE_APPLICATION_CREDENTIALS`, which
  firebase-tools uses for Application Default Credentials.
- A service account is scoped to your project and doesn't require a browser sign-in; keys never expire
  unless you rotate them. Rotate keys regularly or disable unused keys for least privilege.

### Legacy fallback: `FIREBASE_TOKEN` secret

Authenticating with `FIREBASE_TOKEN` is **deprecated** by firebase-tools and will be removed in a future
major version. Use it only as a stopgap. To set it up:

1. Install the Firebase CLI locally (or run via `npx`):
   ```
   npm i -g firebase-tools
   ```
2. Generate a CI token:
   ```
   npx firebase-tools login:ci
   ```
   Complete the browser sign-in; the command prints a token.
3. Add it to the repository:
   - GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `FIREBASE_TOKEN`
   - Value: the token from step 2
4. Re-run the workflow (or push again to `main`).

The token authenticates the Google account that owns the `signature-eu` Firebase project — that account
must have Owner/Editor access to the project, otherwise the deploy is rejected with a permission error
even though the token is valid.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
