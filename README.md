
# DocuMind RAG Architect

A sophisticated, closed-loop Retrieval-Augmented Generation (RAG) system built with React, TypeScript, and the Google Gemini 2.0 API. It analyzes PDF documents, chunks text semantically, and provides grounded answers with verifiable source citations.

## Features
- **Parallel-Scroll Architecture**: Independent scrolling for chat and knowledge nodes.
- **Strategic Analyst Persona**: Professional, human-centric AI dialogue.
- **Source Tracing**: Clickable citations that highlight the exact text node in the document.
- **Fully Responsive**: Optimized for both high-end desktop workflows and mobile review.

## Setup Instructions

1. **Clone the Repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/documind-rag-architect.git
   cd documind-rag-architect
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://ai.google.dev/).
   - Create a free API Key.

4. **Environment Configuration**
   - **For Local Development**: Run `export API_KEY=your_key_here` or create a `.env` file with `VITE_API_KEY=your_key_here`.
   - **For Production (Vercel/Netlify)**: Add an environment variable named `API_KEY` in your provider's dashboard.

5. **Run the App**
   ```bash
   npm run dev
   ```

## Technical Stack
- **Frontend**: React 19, Tailwind CSS, Lucide React
- **LLM**: Google Gemini 2.0 Flash
- **PDF Engine**: PDF.js (CDN)
- **Build Tool**: Vite
