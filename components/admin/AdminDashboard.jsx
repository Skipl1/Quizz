'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { QuestionEditor } from './QuestionEditor';
import { LiveLeaderboard } from './LiveLeaderboard';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/lib/constants/socket-events';

export function AdminDashboard({ socket }) {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizName, setQuizName] = useState('');
  
  // Статус игры: 'none' | 'selected' | 'running'
  const [gameStatus, setGameStatus] = useState('none');
  const [gameMessage, setGameMessage] = useState('');
  const [playersOnline, setPlayersOnline] = useState(0);

  // Загрузка списка викторин
  useEffect(() => {
    socket.emit(CLIENT_EVENTS.GET_QUIZZES);

    const handleQuizzesList = (data) => setQuizzes(data);
    
    // Виктория выбрана — готова к запуску
    const handleQuizReady = (data) => {
      setGameStatus('selected');
      setSelectedQuiz(data.quizId);
      setGameMessage(`✓ «${data.name}» выбрана (${data.questionsCount} вопросов). Ожидание игроков...`);
    };

    // Игра перезапущена
    const handleQuizRestarted = (data) => {
      setGameStatus('selected');
      setGameMessage(`🔄 «${data.name}» перезапущена!`);
      setTimeout(() => setGameMessage(''), 3000);
    };

    const handleQuizCreated = () => socket.emit(CLIENT_EVENTS.GET_QUIZZES);
    const handleQuestionAdded = () => socket.emit(CLIENT_EVENTS.GET_QUIZZES);
    const handleQuestionUpdated = () => socket.emit(CLIENT_EVENTS.GET_QUIZZES);

    // Получение вопросов конкретной викторины
    const handleQuizQuestions = (data) => {
      setQuizzes((prev) =>
        prev.map((q) => (q.id === data.quizId ? { ...q, questions: data.questions } : q))
      );
    };

    // Все игроки завершили — показываем уведомление
    const handleAllFinished = (data) => {
      setGameStatus('none');
      setGameMessage(`🏁 Все игроки завершили! Всего вопросов: ${data.totalQuestions}`);
    };

    // Количество игроков онлайн
    const handlePlayersCount = (data) => setPlayersOnline(data.count);

    socket.on('quizzes-list', handleQuizzesList);
    socket.on(SERVER_EVENTS.QUIZ_READY, handleQuizReady);
    socket.on(SERVER_EVENTS.QUIZ_RESTARTED, handleQuizRestarted);
    socket.on(SERVER_EVENTS.ALL_PLAYERS_FINISHED, handleAllFinished);
    socket.on(SERVER_EVENTS.PLAYERS_COUNT, handlePlayersCount);
    socket.on('quiz-created', handleQuizCreated);
    socket.on('question-added', handleQuestionAdded);
    socket.on('question-updated', handleQuestionUpdated);
    socket.on('quiz-questions', handleQuizQuestions);

    return () => {
      socket.off('quizzes-list', handleQuizzesList);
      socket.off(SERVER_EVENTS.QUIZ_READY, handleQuizReady);
      socket.off(SERVER_EVENTS.QUIZ_RESTARTED, handleQuizRestarted);
      socket.off(SERVER_EVENTS.ALL_PLAYERS_FINISHED, handleAllFinished);
      socket.off(SERVER_EVENTS.PLAYERS_COUNT, handlePlayersCount);
      socket.off('quiz-created', handleQuizCreated);
      socket.off('question-added', handleQuestionAdded);
      socket.off('question-updated', handleQuestionUpdated);
      socket.off('quiz-questions', handleQuizQuestions);
    };
  }, [socket]);

  const handleCreateQuiz = () => {
    const name = quizName.trim() || `Викторина ${quizzes.length + 1}`;
    socket.emit(CLIENT_EVENTS.CREATE_QUIZ, { name });
    setQuizName('');
  };

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz.id);
    setGameStatus('none');
    setGameMessage('');
    socket.emit(CLIENT_EVENTS.SELECT_QUIZ, quiz.id);
    // Загружаем вопросы через небольшую задержку чтобы сервер успел обработать
    setTimeout(() => socket.emit(CLIENT_EVENTS.GET_QUIZ_QUESTIONS, quiz.id), 200);
  };

  const handleStartQuiz = () => {
    if (!selectedQuiz) {
      setGameMessage('⚠️ Сначала выберите викторину!');
      return;
    }
    const quiz = quizzes.find((q) => q.id === selectedQuiz);
    if (!quiz || !quiz.questions?.length) {
      setGameMessage('⚠️ Добавьте хотя бы один вопрос!');
      return;
    }
    console.log('🚀 Запуск викторины:', quiz.name);
    socket.emit(CLIENT_EVENTS.START_QUIZ);
    setGameStatus('running');
    setGameMessage(`🎮 «${quiz.name}» запущена! Игроки получают вопросы...`);
  };

  const handleRestartQuiz = () => {
    if (!selectedQuiz) return;
    const quiz = quizzes.find((q) => q.id === selectedQuiz);
    console.log('🔄 Перезапуск викторины:', quiz?.name);
    socket.emit(CLIENT_EVENTS.RESTART_QUIZ);
    setGameStatus('selected');
    setGameMessage('🔄 Викторина перезапущена!');
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleDeleteQuiz = (quizId) => {
    if (confirm('Удалить викторину?')) {
      socket.emit(CLIENT_EVENTS.DELETE_QUIZ, quizId);
      if (selectedQuiz === quizId) {
        setSelectedQuiz(null);
        setGameStatus('none');
        setGameMessage('');
      }
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowEditor(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion({ ...question, index });
    setShowEditor(true);
  };

  const handleDeleteQuestion = (questionIndex) => {
    if (selectedQuiz && confirm('Удалить вопрос?')) {
      socket.emit(CLIENT_EVENTS.DELETE_QUESTION, { quizId: selectedQuiz, questionIndex });
    }
  };

  const handleSaveQuestion = (questionData) => {
    if (!selectedQuiz) return;
    if (editingQuestion !== null) {
      socket.emit(CLIENT_EVENTS.UPDATE_QUESTION, {
        quizId: selectedQuiz,
        questionIndex: editingQuestion.index,
        ...questionData,
      });
    } else {
      socket.emit(CLIENT_EVENTS.ADD_QUESTION, {
        quizId: selectedQuiz,
        ...questionData,
      });
    }
    setShowEditor(false);
    setEditingQuestion(null);
  };

  const handleDownloadCSV = () => {
    socket.emit(CLIENT_EVENTS.GET_FINAL_LEADERBOARD);
    socket.once('final-leaderboard', (data) => {
      if (!data || data.length === 0) {
        setGameMessage('Нет данных для экспорта');
        return;
      }
      const headers = 'Место,Имя,Скор,Отвечено,Процент\n';
      const rows = data.map((p, i) =>
        `${i + 1},"${p.name}",${p.score},${p.answered}/${p.totalQuestions},${p.percentage}%`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-results-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const selectedQuizData = quizzes.find((q) => q.id === selectedQuiz);

  const tabs = [
    { id: 'quizzes', label: 'Викторины' },
    { id: 'leaderboard', label: 'Рейтинг' },
    { id: 'control', label: 'Управление' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Tabs */}
      <div className="bg-bg-secondary border-b border-accent/30 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 min-h-[44px] text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                {tab.id === 'control' && playersOnline > 0 && (
                  <span className="ml-1 text-xs bg-success text-bg-primary px-1.5 py-0.5 rounded-full">{playersOnline}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      {gameMessage && (
        <div className="bg-accent/20 border-b border-accent/30 px-4 py-2 text-center text-sm text-text-primary">
          {gameMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {/* === ВИКТОРИНЫ === */}
          {activeTab === 'quizzes' && (
            <motion.div key="quizzes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Создание викторины */}
              <Card>
                <h2 className="text-lg font-semibold mb-3">Создать викторину</h2>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input value={quizName} onChange={(e) => setQuizName(e.target.value)} placeholder="Название викторины" className="flex-1" />
                  <Button onClick={handleCreateQuiz} variant="primary" size="md">Создать</Button>
                </div>
              </Card>

              {/* Список викторин */}
              <Card>
                <h2 className="text-lg font-semibold mb-3">Мои викторины ({quizzes.length})</h2>
                {quizzes.length === 0 ? (
                  <p className="text-text-secondary text-center py-4">Пока нет викторин. Создайте первую!</p>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors flex-wrap ${selectedQuiz === quiz.id ? 'bg-accent/20 border border-accent/50' : 'bg-bg-primary/30 hover:bg-bg-primary/50'}`}>
                        <button onClick={() => handleSelectQuiz(quiz)} className="flex-1 text-left min-h-[44px]">
                          <div className="font-medium">{quiz.name}</div>
                          <div className="text-sm text-text-secondary">{quiz.questionsCount} вопросов</div>
                        </button>
                        {selectedQuiz === quiz.id && (
                          <span className="text-success text-sm font-medium flex-shrink-0">✓ Выбрана</span>
                        )}
                        <Button onClick={() => handleDeleteQuiz(quiz.id)} variant="danger" size="sm">Удалить</Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Управление вопросами */}
              {selectedQuizData && (
                <Card>
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold">Вопросы: {selectedQuizData.name}</h2>
                    <Button onClick={handleAddQuestion} variant="primary" size="sm">+ Добавить вопрос</Button>
                  </div>
                  {(!selectedQuizData.questions || selectedQuizData.questions.length === 0) ? (
                    <p className="text-text-secondary text-center py-4">Нет вопросов. Добавьте первый!</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedQuizData.questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary/30">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-text-secondary">#{i + 1} [{q.type}]</div>
                            <div className="font-medium truncate">{q.text}</div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button onClick={() => handleEditQuestion(q, i)} variant="ghost" size="sm">✏️</Button>
                            <Button onClick={() => handleDeleteQuestion(i)} variant="danger" size="sm">🗑️</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Редактор вопроса */}
              <AnimatePresence>
                {showEditor && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <QuestionEditor
                      question={editingQuestion}
                      onSave={handleSaveQuestion}
                      onCancel={() => { setShowEditor(false); setEditingQuestion(null); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* === РЕЙТИНГ === */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveLeaderboard />
            </motion.div>
          )}

          {/* === УПРАВЛЕНИЕ === */}
          {activeTab === 'control' && (
            <motion.div key="control" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <h2 className="text-lg font-semibold mb-4">🎮 Управление игрой</h2>
                
                {/* Статус */}
                <div className="mb-4 p-3 rounded-lg bg-bg-primary/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      gameStatus === 'running' ? 'bg-success animate-pulse' : 
                      gameStatus === 'selected' ? 'bg-warning' : 'bg-text-secondary'
                    }`}></span>
                    <span className="text-sm">
                      {gameStatus === 'running' ? '🟢 Игра идёт' : 
                       gameStatus === 'selected' ? '🟡 Готова к запуску' : '⚪ Не запущена'}
                    </span>
                    {playersOnline > 0 && (
                      <span className="text-sm text-text-secondary ml-auto">👥 Игроков онлайн: {playersOnline}</span>
                    )}
                  </div>
                </div>

                {selectedQuizData ? (
                  <div className="space-y-3">
                    <div className="text-text-secondary">
                      Выбрана: <strong className="text-text-primary">{selectedQuizData.name}</strong>
                      <br />Вопросов: {selectedQuizData.questions?.length || 0}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={handleStartQuiz} 
                        variant="success" 
                        size="md" 
                        disabled={gameStatus === 'running'}
                      >
                        {gameStatus === 'running' ? '🟢 Игра идёт' : '▶ Начать игру'}
                      </Button>
                      <Button 
                        onClick={handleRestartQuiz} 
                        variant="warning" 
                        size="md" 
                        disabled={gameStatus === 'none'}
                      >
                        🔄 Перезапустить
                      </Button>
                      <Button onClick={handleDownloadCSV} variant="ghost" size="md">
                        📥 Скачать CSV
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-4">Сначала выберите викторину во вкладке «Викторины»</p>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
