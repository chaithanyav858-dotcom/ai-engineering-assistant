# AI Study Buddy - Academic Companion for Engineering Students

AI Study Buddy is a full-stack, responsive web application designed to assist computer science and engineering students in learning, debugging, and revising core concepts. The application features a premium, dark glassmorphism dashboard UI with neon glow accents and is integrated with the **Google Gemini API** (using the fast `gemini-1.5-flash` model).

---

## 🌟 Key Features

- **Expert Assistant System**: Specializes in five foundational engineering subject domains:
  1. **Python Programming**: Syntax details, list comprehensions, OOP inheritance, and debugging.
  2. **Database Management Systems (DBMS)**: SQL queries, joins, normalizations (1NF to BCNF), and ACID transactions.
  3. **Operating Systems (OS)**: Process scheduling algorithms, memory paging, mutex vs semaphores, and deadlocks.
  4. **Computer Networks**: OSI & TCP/IP stack layers, TCP 3-way handshakes, routing tables, and DNS/Subnetting calculations.
  5. **Data Structures & Algorithms (DSA)**: Big O notation, linked lists, trees, graphs, sorting, and binary searches.
- **Smart System Prompts**: Configured with professional engineering tutoring styles (definitions, examples, dry-runs, and exam tips). Politely steers unrelated non-engineering queries back to study topics.
- **Rich Chat Experience**:
  - Code snippet formatting with automatic copy-to-clipboard actions.
  - Interactive clickable prompt suggestions mapping to subjects.
  - Smooth typing animations and pulsating orb AI indicators.
  - Dynamic viewport sizing down to 390px mobile layout.
- **Local Persistence**: Chat logs are saved automatically in your browser's local memory (`localStorage`) so your notes are restored on reload.
- **Safe Secure API**: Communicates via an Express Node.js proxy server. Your secret API keys are kept safe on the backend.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (with dynamic transitions, backdrop filters, keyframes), and Vanilla ES6 JavaScript.
- **Backend**: Node.js & Express API proxy server.
- **AI Core**: Google Gemini 1.5 Flash Model.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended. Tested on v24).

### 2. Installation
Navigate to the project subdirectory and install the Express dependencies:
```bash
cd ai-study-buddy
npm install
```

### 3. Add your Gemini API Key
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Copy the `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in your text editor and replace the placeholder with your Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   PORT=3000
   ```

### 4. Run the Development Server
Launch the local Express server:
```bash
npm start
```
The server will boot and serve the static files:
- **Local Address**: [http://localhost:3000](http://localhost:3000)

---

## 📁 File Structure

```txt
ai-study-buddy/
  ├── public/
  │   ├── index.html     # Semantic single-page HTML structure
  │   ├── styles.css     # Premium dark theme design, animations & styles
  │   └── script.js      # App controller logic, storage & markdown parser
  ├── .env.example       # Example env configuration
  ├── package.json       # Project dependencies & startup scripts
  ├── server.js          # Express proxy API with Gemini system instructions
  └── README.md          # Project documentation
```

---

## ☁️ Deployment

This project is structured for easy deployment on modern cloud platforms such as Render, Railway, or Heroku.

### Render Deployment Instructions:
1. Push your repository code to GitHub.
2. Log in to [Render](https://render.com/) and click **New > Web Service**.
3. Link your GitHub repository.
4. Set the following parameters:
   - **Environment**: `Node`
   - **Root Directory**: `ai-study-buddy`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Advanced** and add your environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: `(Your Google AI Studio API Key)`
6. Click **Deploy Web Service**.
