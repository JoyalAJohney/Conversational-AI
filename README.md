
# Eliza - Conversation AI

A real-time voice AI enabling human-like conversations with memory and interruptions. This project integrates models for Speech-to-Text (STT), Groq-fast LLM, and Text-to-Speech (TTS), all communicating via WebSocket with ~1900ms latency.

If you find this helpful, consider giving it a ⭐!

![App Screenshot](https://raw.githubusercontent.com/JoyalAJohney/Conversational-AI/refs/heads/master/assets/eliza1.png)

**Note:** This is an initial version. Future plans include integrating a low-latency Speech-to-Speech model from OpenAI.



## Run Locally

Clone the project

```bash
  git clone https://github.com/JoyalAJohney/Conversational-AI.git
```

Go to the project directory

```bash
  cd Conversational-AI
```

Create .env file with API Keys

```bash
  GROQ_API_KEY=
  DEEPGRAM_API_KEY=
```

Run docker container

```bash
  docker-compose up --build
```

Go to http://localhost:8000 to see the magic!

## Demo

![Demo Video](https://github.com/JoyalAJohney/Conversational-AI/blob/master/assets/finalCut.mp4)

