# Deploying to GitHub Pages

This guide explains how to deploy your Vite React application to GitHub Pages, including support for subdirectory deployments.

## Prerequisites

- A GitHub repository for your project
- GitHub Actions enabled in your repository

## Configuration

### 1. Set the BASE_PATH Environment Variable

GitHub Pages typically deploys to a subdirectory (e.g., `https://username.github.io/repo-name/`). To configure this, set the `BASE_PATH` environment variable in your GitHub Actions workflow.

### 2. GitHub Actions Workflow Example

Create or update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Add GitHub Pages Specific Files

#### a. Create `.nojekyll` file

GitHub Pages uses Jekyll by default, which ignores files starting with underscores. Create a `.nojekyll` file in your `public/` directory (it will be copied to `dist/` during build):

```bash
touch public/.nojekyll
```

Or add this step to your build workflow:

```yaml
- name: Add .nojekyll file
  run: touch ./dist/.nojekyll
```

#### b. Create `404.html` for Client-Side Routing

For client-side routing to work on GitHub Pages, create a `public/404.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
    <script>
      // Store the path and redirect to index.html
      sessionStorage.setItem("redirectPath", window.location.pathname);
      window.location.replace(
        window.location.origin +
          window.location.pathname.split("/").slice(0, 2).join("/") +
          "/"
      );
    </script>
  </head>
  <body>
    Redirecting...
  </body>
</html>
```

#### c. Update `index.html` to Handle Redirects

Add this script to your `index.html` before other scripts:

```html
<script>
  // Check if we were redirected from a 404 page
  const redirectPath = sessionStorage.getItem("redirectPath");
  if (redirectPath) {
    sessionStorage.removeItem("redirectPath");
    window.history.replaceState(null, "", redirectPath);
  }
</script>
```

## Alternative Deployment Scenarios

### Deploy to Root Domain

If deploying to a root domain (e.g., `https://yourdomain.com/`), you don't need to set `BASE_PATH`:

```yaml
- name: Build
  run: npm run build
```

The default `BASE_PATH` is `/`, which works for root deployments.

### Deploy to Custom Subdirectory

For a custom subdirectory path:

```yaml
- name: Build
  env:
    BASE_PATH: /my-app/
  run: npm run build
```

### Local Development with Base Path

To test with a base path locally:

```bash
BASE_PATH=/my-app/ npm run dev
```

Or for production build:

```bash
BASE_PATH=/my-app/ npm run build
npm run preview
```

## Verifying Deployment

After deployment:

1. Go to your repository's Settings → Pages
2. Verify the source is set to "GitHub Actions"
3. Check the deployment URL (usually `https://username.github.io/repo-name/`)
4. Test navigation and routing to ensure all paths work correctly

## Troubleshooting

### Assets Not Loading

If CSS, JS, or other assets fail to load:

- Verify `BASE_PATH` matches your deployment path exactly
- Check that `.nojekyll` file exists in the deployed files
- Inspect the browser console for 404 errors

### Routing Not Working

If client-side routes return 404:

- Ensure `404.html` is present in the deployed files
- Verify the redirect script is in your `index.html`
- Check that the router's `basepath` configuration is correct

### GitHub Pages Not Updating

If changes don't appear:

- Check the Actions tab for deployment status
- Clear browser cache or try incognito mode
- Verify the correct branch is being deployed

## Additional Resources

- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
