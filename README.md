# Reviewer

## Setup

### API Key

1. Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open the `.env` file and paste your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

3. The `.env` file is already added to `.gitignore`, so your API key will not be committed to the repository.

**Important:** The `.env` file contains secret data and should not be committed to Git.
