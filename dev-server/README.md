# Dev Server

Local development server for Reviewer project.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the `dev-server` folder with your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

The API key will be automatically loaded when you start the server and made available to the application via the `/api/dev-config` endpoint.

## Usage

```bash
npm start
```

or

```bash
node start.js
```

Server will be available at: http://localhost:3000

To change the port, use environment variable:
```bash
PORT=8080 npm start
```

## Stopping

Press `Ctrl+C` in the terminal where the server is running.
