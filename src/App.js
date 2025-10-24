import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import "./index.css"; // index.css a src mappában legyen

const difficulties = ["easy", "medium", "hard"];
const QUESTION_TIME = 15;

function App() {
  // allapotok
  const [categories, setCategories] = useState([]); // kategoria lista API
  const [category, setCategory] = useState(null); // kivalasztott kategoria
  const [difficulty, setDifficulty] = useState(difficulties[0]); // kivalasztott nehezseg

  const [questions, setQuestions] = useState([]); // lekert kerdesek
  const [current, setCurrent] = useState(0); // aktualis kerdes index
  const [score, setScore] = useState(0); // pontszam
  const [finished, setFinished] = useState(false); // jatek vege
  const [loading, setLoading] = useState(false); // betoltes
  const [started, setStarted] = useState(false); // jatek inditas

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME); // hatralevo ido
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState([]);

  const [showConfetti, setShowConfetti] = useState(false);

  const [progressKey, setProgressKey] = useState(0);

  // kategoriak betoltese
  useEffect(() => {
    fetch("https://opentdb.com/api_category.php") 
      .then(res => res.json())
      .then(data => {
        setCategories(data.trivia_categories); // kat. mentese
        if (data.trivia_categories.length > 0)
          setCategory(data.trivia_categories[0].id); 
      })
      .catch(console.error);
  }, []);

  // toplista betoltese localStorage-bol
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("highScores")) || [];
    setHighScores(saved);
  }, []);

  // kerdesek lekerese
  const fetchQuestions = () => {
    setLoading(true);
    fetch(
      `https://opentdb.com/api.php?amount=5&category=${category}&difficulty=${difficulty}&type=multiple`
    )
      .then(res => res.json())
      .then(data => {
        // kerdesek formazasa random sorrend valaszoknak
        const formatted = data.results.map(item => {
          const answers = [...item.incorrect_answers];
          const randomIndex = Math.floor(Math.random() * 4);
          answers.splice(randomIndex, 0, item.correct_answer); // helyes valasz beillesztese
          return {
            question: item.question,
            answers,
            correct: item.correct_answer,
          };
        });

        setQuestions(formatted);
        setLoading(false);
        setTimeLeft(QUESTION_TIME);
        setProgressKey(prev => prev + 1);
      });
  };

  // inditas
  const startQuiz = () => {
    setScore(0);
    setCurrent(0);
    setFinished(false);
    setStarted(true);
    setSelectedAnswer(null);
    fetchQuestions();
  };

  // ujrainditas
  const restartQuiz = () => {
    setStarted(false);
    setScore(0);
    setCurrent(0);
    setFinished(false);
    setQuestions([]);
    setSelectedAnswer(null);
    setTimeLeft(QUESTION_TIME);
    setPlayerName("");
    setProgressKey(prev => prev + 1);
    setShowConfetti(false); 
  };

  // valaszok kezelese
  const handleAnswer = (answer) => {
    if (!selectedAnswer) {
      setSelectedAnswer(answer); // helyesen hívjuk
      if (answer === questions[current].correct) { 
        setScore(score + 1); // pontszam noveles
        setShowConfetti(true); // konfetti
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  // kov kerdes
  const nextQuestion = () => {
    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);
      setProgressKey(prev => prev + 1);
      setShowConfetti(false); // uj kerdesnel kikapcsoljuk konfettit
    } else {
      setFinished(true);
    }
  };

  // idozito kezeles
  useEffect(() => {
    if (!started || selectedAnswer || finished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSelectedAnswer("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, selectedAnswer, finished, current]);

  // pontszam mentes
  const saveScore = () => {
    const newEntry = { name: playerName || "Anonymous", score };
    const updatedScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    localStorage.setItem("highScores", JSON.stringify(updatedScores)); // JSON.stringify javitva
    setHighScores(updatedScores);
  };

  // betoltes
  if (loading) return <h2 className="App">Loading questions...</h2>;

  // kezdokepernyo
  if (!started) {
    return (
      <div className="App">
        <h1>Trivia Battle</h1>
        <div className="form-group">
          <label>Category:</label>
          <select value={category || ""} onChange={(e) => setCategory(Number(e.target.value))}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={startQuiz}>Start Quiz</button>

        {/* toplista elso 5 */}
        {highScores.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>Top 5 Scores</h3>
            <ol>
              {highScores.map((entry, i) => <li key={i}>{entry.name}: {entry.score}</li>)}
            </ol>
          </div>
        )}
      </div>
    );
  }

  // jatek vege
  if (finished) {
    return (
      <div className="App">
        <h1>🎉 Quiz Finished!</h1>
        <p>Your score: {score} / {questions.length}</p>
        <div className="form-group">
          <label>Enter your name (optional):</label>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={saveScore}>Save</button>
          <button onClick={restartQuiz}>New Game</button>
        </div>
        {highScores.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h3>Top 5 Scores</h3>
            <ol>
              {highScores.map((entry, i) => <li key={i}>{entry.name}: {entry.score}</li>)}
            </ol>
          </div>
        )}
      </div>
    );
  }

  // aktualis kerdes
  const currentQ = questions[current];

  return (
    <div className="App">
      {showConfetti && (
        <Confetti
          numberOfPieces={300} // sűrűség
          gravity={0.3}
          initialVelocityX={{ min: -10, max: 10 }} // balrol es jobbról is indulhat
          recycle={false}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )} 
      <h2>Question {current + 1} / {questions.length}</h2>

      <div className="progress-container" key={progressKey}>
        <div className="progress-bar" style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}></div>
      </div>

      <p dangerouslySetInnerHTML={{ __html: currentQ.question }} />

      {currentQ.answers.map((answer, i) => {
        let bgColor = "#60a3eb"; // alap szin
        if (selectedAnswer) {
          if (answer === currentQ.correct) bgColor = "green"; // helyes valasz
          else if (answer === selectedAnswer && selectedAnswer !== "timeout") bgColor = "red"; // rossz valasz
        }
        return (
          <button
            key={i}
            onClick={() => handleAnswer(answer)}
            style={{ backgroundColor: bgColor }}
            dangerouslySetInnerHTML={{ __html: answer }}
            disabled={!!selectedAnswer} // ha valasztottunk nem lehet masat valasztani
          />
        );
      })}

      {selectedAnswer && <button onClick={nextQuestion} style={{ marginTop: 15 }}>Next</button>}
    </div>
  );
}

export default App;
