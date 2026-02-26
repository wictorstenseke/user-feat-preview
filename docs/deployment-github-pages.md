# Deploying to GitHub Pages

This guide explains how to deploy your Vite React application to GitHub Pages, including support for subdirectory deployments.

## Prerequisites

- A GitHub repository for your project
- GitHub Actions enabled in your repository

## Configuration

### 1. Set the BASE_PATH Environment Variable

GitHub Pages typically deploys to a subdirectory (e.g., `https://username.github.io/repo-name/`). To configure this, set the `BASE_PATH` environment variable in your GitHub Actions workflow.
