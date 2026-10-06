import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'reading-detective-learners-v1';

const caseQuestions = [
  {
    id: 'clue-1',
    prompt: 'Where did Karabo leave the bottle?',
    options: ['In the classroom', 'On a bench near the soccer field', 'In the office'],
    answer: 'On a bench near the soccer field',
    hint: 'Read this section again: "During break time, he placed the bottle on a bench near the soccer field."',
    successText: 'Excellent Detective! You found your first clue.'
  },
  {
    id: 'clue-2',
    prompt: 'Why did Karabo return to the bench?',
    options: ['To get his water bottle', 'To play football', 'To find Naledi'],
    answer: 'To get his water bottle',
    hint: 'Think carefully. What important item had Karabo left behind?',
    successText: 'Another clue solved.'
  },
  {
    id: 'clue-3',
    prompt: 'What clue helped solve the mystery?',
    options: ['Footprints', 'Football', 'Bell'],
    answer: 'Footprints',
    hint: 'Read this sentence: "He noticed footprints leading toward the school garden." What clue did Karabo follow?',
    successText: 'Outstanding detective work.'
  },
  {
    id: 'clue-4',
    prompt: 'Why did Naledi take the bottle?',
    options: ['She wanted to keep it', 'She believed it had been forgotten', 'She wanted a new bottle'],
    answer: 'She believed it had been forgotten',
    hint: 'What did Naledi actually say? Look for her words.',
    successText: 'You used evidence from the story.'
  },
  {
    id: 'clue-5',
    prompt: 'If Karabo never followed the footprints, what might happen?',
    options: ['The mystery would remain unsolved', 'The vegetables would disappear', 'School would close'],
    answer: 'The mystery would remain unsolved',
    hint: 'What helped Karabo find the bottle? Now imagine he never found that clue.',
    successText: 'You are thinking like a detective.'
  },
  {
    id: 'final-case',
    prompt: 'Was Naledi stealing?',
    options: ['Yes', 'No'],
    answer: 'No',
    hint: 'Look at the evidence. Did Naledi hide the bottle? Did she explain what happened?',
    successText: 'Case closed. You used the evidence before making a conclusion.'
  }
];

const getBadge = (score) => {
  if (score >= 51) return 'Reading Champion';
  if (score >= 41) return 'Master Detective';
  if (score >= 21) return 'Junior Detective';
  return 'Rookie Reader';
};

const createId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `learner-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultTeacherForm = { name: '', grade: 'Grade 4' };

function App() {
  const [learners, setLearners] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [teacherForm, setTeacherForm] = useState(defaultTeacherForm);
  const [activeView, setActiveView] = useState('dashboard');
  const [game, setGame] = useState({
    stage: 'landing',
    score: 0,
    questionIndex: 0,
    hintText: '',
    message: '',
    badge: 'Rookie Reader'
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learners));
    if (!selectedLearnerId && learners.length > 0) {
      setSelectedLearnerId(learners[0].id);
    }
  }, [learners, selectedLearnerId]);

  const selectedLearner = useMemo(
    () => learners.find((learner) => learner.id === selectedLearnerId) || null,
    [learners, selectedLearnerId]
  );

  const currentQuestion = caseQuestions[game.questionIndex] || null;

  const updateLearnerProgress = (learnerId, score) => {
    const badge = getBadge(score);

    setLearners((prevLearners) =>
      prevLearners.map((learner) => {
        if (learner.id !== learnerId) {
          return learner;
        }

        return {
          ...learner,
          totalScore: score,
          badge,
          lastPlayed: new Date().toLocaleDateString(),
          casesCompleted: learner.casesCompleted + 1,
          highestScore: Math.max(learner.highestScore, score),
          completedMission: true
        };
      })
    );
  };

  const handleRegisterLearner = (event) => {
    event.preventDefault();

    const cleanName = teacherForm.name.trim();
    if (!cleanName) return;

    const newLearner = {
      id: createId(),
      name: cleanName,
      grade: teacherForm.grade,
      totalScore: 0,
      badge: 'Rookie Reader',
      casesCompleted: 0,
      highestScore: 0,
      lastPlayed: 'Not yet',
      completedMission: false
    };

    setLearners((prevLearners) => [newLearner, ...prevLearners]);
    setSelectedLearnerId(newLearner.id);
    setTeacherForm(defaultTeacherForm);
  };

  const handleStartMission = () => {
    if (!selectedLearnerId) {
      setActiveView('dashboard');
      return;
    }

    setGame({
      stage: 'briefing',
      score: 0,
      questionIndex: 0,
      hintText: '',
      message: '',
      badge: 'Rookie Reader'
    });
    setActiveView('student');
  };

  const goToNextQuestion = () => {
    setGame((prev) => ({
      ...prev,
      stage: 'question',
      questionIndex: prev.questionIndex + 1,
      hintText: '',
      message: ''
    }));
  };

  const finishMission = (finalScore) => {
    const finalBadge = getBadge(finalScore);
    setGame((prev) => ({
      ...prev,
      stage: 'results',
      score: finalScore,
      badge: finalBadge,
      hintText: '',
      message: ''
    }));

    if (selectedLearnerId) {
      updateLearnerProgress(selectedLearnerId, finalScore);
    }
  };

  const handleAnswer = (answer) => {
    if (!currentQuestion) return;

    if (answer === currentQuestion.answer) {
      const updatedScore = game.score + 10;

      if (game.questionIndex === caseQuestions.length - 1) {
        finishMission(updatedScore);
        return;
      }

      setGame((prev) => ({
        ...prev,
        stage: 'correct',
        score: updatedScore,
        message: currentQuestion.successText,
        hintText: ''
      }));
      return;
    }

    setGame((prev) => ({
      ...prev,
      stage: 'wrong',
      hintText: currentQuestion.hint,
      message: 'Try again.'
    }));
  };

  const resetMission = () => {
    setGame({
      stage: 'landing',
      score: 0,
      questionIndex: 0,
      hintText: '',
      message: '',
      badge: 'Rookie Reader'
    });
    setActiveView('student');
  };

  const teacherSummary = useMemo(() => {
    const totalLearners = learners.length;
    const completed = learners.filter((learner) => learner.completedMission).length;
    const averageScore = totalLearners
      ? Math.round(
          learners.reduce((sum, learner) => sum + learner.highestScore, 0) / totalLearners
        )
      : 0;

    return { totalLearners, completed, averageScore };
  }, [learners]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🔍</span>
          <div>
            <h1>Reading Detective</h1>
            <p>Reading comprehension mission board</p>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          <button
            type="button"
            className={activeView === 'dashboard' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveView('dashboard')}
          >
            Teacher Dashboard
          </button>
          <button
            type="button"
            className={activeView === 'student' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveView('student')}
          >
            Student Mission
          </button>
        </nav>
      </header>

      <main className="main-content container">
        {activeView === 'dashboard' && (
          <div className="dashboard-grid">
            <section className="panel form-panel">
              <div className="section-header">
                <span className="section-tag">Register</span>
                <h2>Add learner</h2>
              </div>

              <form onSubmit={handleRegisterLearner} className="register-form">
                <div className="field-group">
                  <label htmlFor="learner-name">Learner name</label>
                  <input
                    id="learner-name"
                    type="text"
                    value={teacherForm.name}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="e.g. Lerato Mokoena"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="learner-grade">Grade</label>
                  <select
                    id="learner-grade"
                    value={teacherForm.grade}
                    onChange={(event) =>
                      setTeacherForm((prev) => ({ ...prev, grade: event.target.value }))
                    }
                  >
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                  </select>
                </div>

                <button type="submit" className="primary-button full-width">
                  Register learner
                </button>
              </form>
            </section>

            <section className="panel summary-panel">
              <div className="section-header">
                <span className="section-tag">Overview</span>
                <h2>Class progress</h2>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Learners</span>
                  <strong>{teacherSummary.totalLearners}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Completed</span>
                  <strong>{teacherSummary.completed}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Average</span>
                  <strong>{teacherSummary.averageScore} pts</strong>
                </div>
              </div>

              {selectedLearner && (
                <div className="selected-learner">
                  <p>Selected learner</p>
                  <h3>{selectedLearner.name}</h3>
                  <ul>
                    <li>Grade: {selectedLearner.grade}</li>
                    <li>Highest score: {selectedLearner.highestScore} / 60</li>
                    <li>Badge: {selectedLearner.badge}</li>
                    <li>Last played: {selectedLearner.lastPlayed}</li>
                  </ul>
                </div>
              )}
            </section>

            <section className="panel table-panel full-width">
              <div className="section-header">
                <span className="section-tag">Tracker</span>
                <h2>Learner progress</h2>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Grade</th>
                      <th>Score</th>
                      <th>Badge</th>
                      <th>Last played</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learners.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          No learners registered yet.
                        </td>
                      </tr>
                    ) : (
                      learners.map((learner) => (
                        <tr key={learner.id}>
                          <td>{learner.name}</td>
                          <td>{learner.grade}</td>
                          <td>{learner.highestScore} / 60</td>
                          <td>{learner.badge}</td>
                          <td>{learner.lastPlayed}</td>
                          <td>
                            <button
                              type="button"
                              className="small-button"
                              onClick={() => setSelectedLearnerId(learner.id)}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeView === 'student' && (
          <div className="student-view">
            <div className="student-panel panel">
              <div className="section-header">
                <span className="section-tag">Mission</span>
                <h2>Case file</h2>
              </div>

              {selectedLearner && (
                <div className="student-picker">
                  <label htmlFor="selected-learner">Learner</label>
                  <select
                    id="selected-learner"
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                  >
                    {learners.map((learner) => (
                      <option value={learner.id} key={learner.id}>
                        {learner.name} ({learner.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {game.stage === 'landing' && (
                <div className="story-screen">
                  <div className="case-banner">CASE FILE 001</div>
                  <h3>THE MISSING WATER BOTTLE</h3>
                  <div className="mystery-title">Reading Detective Mission</div>
                  <p>Someone’s new water bottle has disappeared.</p>
                  <p>Can you solve the mystery?</p>
                  <div className="score-badge">⭐ Maximum Score: 60</div>
                  <button type="button" className="primary-button" onClick={handleStartMission}>
                    Start Investigation
                  </button>
                </div>
              )}

              {game.stage === 'briefing' && (
                <div className="story-screen">
                  <div className="case-banner danger">Detective briefing</div>
                  <h3>Welcome Detective</h3>
                  <ul className="checklist">
                    <li>Read carefully</li>
                    <li>Search for clues</li>
                    <li>Solve the mystery</li>
                    <li>Earn stars</li>
                  </ul>
                  <p>Wrong answers will send you to the clue room.</p>
                  <button type="button" className="primary-button" onClick={() => setGame((prev) => ({ ...prev, stage: 'story' }))}>
                    Open Case File
                  </button>
                </div>
              )}

              {game.stage === 'story' && (
                <div className="story-screen story-text">
                  <div className="case-banner">Case file</div>
                  <h3>The Missing Water Bottle</h3>
                  <p>
                    On Monday morning, Karabo arrived at school carrying his new blue water bottle.
                  </p>
                  <p>
                    During break time, he placed the bottle on a bench near the soccer field and ran
                    off to play football with his friends.
                  </p>
                  <p>When the bell rang, Karabo returned to the bench.</p>
                  <p>The water bottle was gone.</p>
                  <p>Karabo looked around.</p>
                  <p>He noticed footprints leading toward the school garden.</p>
                  <p>Near the vegetable beds, he found his friend Naledi watering the plants.</p>
                  <p>Next to her stood the missing blue bottle.</p>
                  <p>Naledi smiled.</p>
                  <p>"I thought someone had forgotten it," she said.</p>
                  <p>"I used it to fetch water for the vegetables."</p>
                  <p>Karabo laughed.</p>
                  <p>The mystery was solved.</p>
                  <button type="button" className="primary-button" onClick={() => setGame((prev) => ({ ...prev, stage: 'question' }))}>
                    Search for Clues
                  </button>
                </div>
              )}

              {game.stage === 'question' && currentQuestion && (
                <div className="quiz-card">
                  <div className="question-top">
                    <span className="question-number">Clue {game.questionIndex + 1}</span>
                    <span className="score-pill">⭐ {game.score}</span>
                  </div>

                  <h3>{currentQuestion.prompt}</h3>

                  <div className="options-list">
                    {currentQuestion.options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        className="option-button"
                        onClick={() => handleAnswer(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {game.stage === 'wrong' && (
                <div className="result-card warning">
                  <div className="case-banner danger">Clue room</div>
                  <h3>Detective clue</h3>
                  <p>{game.hintText}</p>
                  <button type="button" className="primary-button" onClick={() => setGame((prev) => ({ ...prev, stage: 'question' }))}>
                    Try Again
                  </button>
                </div>
              )}

              {game.stage === 'correct' && (
                <div className="result-card success">
                  <div className="case-banner success-banner">Correct</div>
                  <div className="star-row">⭐⭐</div>
                  <h3>{game.message}</h3>
                  <p>+10 Points</p>
                  <button type="button" className="primary-button" onClick={goToNextQuestion}>
                    Next Clue
                  </button>
                </div>
              )}

              {game.stage === 'results' && (
                <div className="result-card final">
                  <div className="case-banner success-banner">Case closed</div>
                  <h3>🏆 Mystery Solved</h3>
                  <p>
                    {selectedLearner ? selectedLearner.name : 'Learner'} earned <strong>{game.score}</strong>{' '}
                    points and received the <strong>{game.badge}</strong> badge.
                  </p>
                  <p>Naledi was not stealing. She believed someone had forgotten the bottle.</p>
                  <p>Good detectives use evidence before reaching conclusions.</p>
                  <div className="badge-display">{game.badge}</div>
                  <button type="button" className="primary-button" onClick={resetMission}>
                    View Results
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
