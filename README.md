# 🏥 MediAI — AI-Powered Patient Registration & Clinical Analysis System

MediAI is a modern healthcare web application that enables intelligent patient registration, real-time symptom analysis, and automated medical report generation using LLM-powered AI. It transforms traditional hospital intake workflows into a structured, AI-driven clinical system.

---

## 🚀 Features

### 🧾 Multi-Step Patient Registration
- Personal → Medical → Symptoms → Appointment flow
- Structured data capture for AI accuracy
- Real-time validation and error handling
- Auto-calculated fields (Age, BMI)

### 🧠 AI Clinical Analysis (Groq LLM)
- Symptom-based diagnosis suggestions
- Risk stratification (Low / Medium / High)
- Context-aware medical reasoning
- Recovery plans, treatment guidance, and health scoring

### 🏥 Medical Intelligence System
- Structured inputs:
  - Symptoms (primary, secondary, duration, severity)
  - Vitals (height, weight → BMI)
  - Medical history (conditions, allergies, medications)
  - Lifestyle (smoking, alcohol, activity)
- Smart tagging system (chips input)
- Real-time risk indicators

### 📄 Automated Medical Report
- Detailed doctor-style report generation
- Sections include:
  - Patient Summary
  - Clinical Assessment
  - Risk Level
  - Treatment Plan
  - Recovery Plan
  - Warning Signs
  - Follow-up Advice
  - Health Score
- PDF download support
- QR-based token system for tracking

### 🎨 Modern UI/UX
- Built with React + Tailwind CSS
- Framer Motion animations
- Glassmorphism design
- Dark mode support
- Responsive (mobile-first)

---

## 🛠 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Framer Motion
- Axios

### Backend
- Node.js
- Express.js

### AI Integration
- Groq API (LLaMA 3.3 model)

### Utilities
- PDF generation (html2pdf / jsPDF)
- QR Code generation

---

## 🧠 AI Workflow

1. User fills structured patient data
2. Data is formatted into AI-friendly prompt
3. Request sent to Groq API
4. AI generates:
   - Diagnosis insights
   - Risk level
   - Recovery plan
5. Response parsed and displayed
6. Report exported as PDF

---

## 📂 Project Structure
MediAI/
│
├── client/ # React frontend
│ ├── components/
│ ├── pages/
│ ├── utils/
│ └── App.js
│
├── server/ # Node backend
│ ├── routes/
│ ├── controllers/
│ ├── services/
│ └── index.js
│
├── .env
├── package.json
└── README.md

---

## ⚙️ Installation

### 1. Clone Repository
git clone https://github.com/your-username/MediAI.git
cd MediAI

### 2. Install Dependencies

Frontend
cd client
npm install

Backend
cd server
npm install

---

## 🔑 Environment Variables

Create a .env file in /server:

PORT=5000
GROQ_API_KEY=your_groq_api_key_here

---

## ▶️ Running the App

Start Backend
cd server
npm run dev

Start Frontend
cd client
npm start

App will run on:
http://localhost:3000

---

## 🧪 Example AI Prompt

const prompt = `
Patient:
Age: 22
Symptoms: chest pain, headache
Duration: 3 days

Generate:
- Diagnosis
- Risk level
- Recovery plan
`;

---

## ⚠️ Important Notes

This system is for educational/demo purposes only  
Not a replacement for real medical diagnosis  
Always consult licensed healthcare professionals  

---

## 🔮 Future Enhancements

Voice-based symptom input  
AI chatbot assistant  
Doctor recommendation system  
Admin dashboard & analytics  
Multi-language support  
Real-time patient queue tracking  

---

## 📌 Key Highlights

AI-first healthcare workflow  
Structured data → better LLM output  
Real-time risk detection  
Scalable frontend architecture  
Production-ready UI/UX  

---

## ⭐ Contribute

Feel free to fork this repo and submit pull requests to improve MediAI.

---

## 📄 License

MIT License
