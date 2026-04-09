module.exports = [
"[project]/lib/constants/socket-events.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CLIENT_EVENTS",
    ()=>CLIENT_EVENTS,
    "SERVER_EVENTS",
    ()=>SERVER_EVENTS
]);
const SERVER_EVENTS = {
    REGISTERED: 'registered',
    QUIZ_READY: 'quiz-ready',
    NEW_QUESTION: 'new-question',
    UPDATE_LEADERBOARD: 'update-leaderboard',
    PLAYER_QUIZ_ENDED: 'player-quiz-ended',
    ALL_PLAYERS_FINISHED: 'all-players-finished',
    QUIZ_RESTARTED: 'quiz-restarted',
    QUIZ_ALREADY_STARTED: 'quiz-already-started',
    FINAL_LEADERBOARD: 'final-leaderboard',
    PLAYERS_COUNT: 'players-count',
    QUIZ_CREATED: 'quiz-created',
    QUIZZES_LIST: 'quizzes-list',
    QUESTION_ADDED: 'question-added',
    QUESTION_UPDATED: 'question-updated',
    QUIZ_UPDATED: 'quiz-updated',
    QUIZ_QUESTIONS: 'quiz-questions',
    ERROR: 'error'
};
const CLIENT_EVENTS = {
    REGISTER: 'register',
    SUBMIT_ANSWER: 'submit-answer',
    TIME_UP: 'time-up',
    GET_NEXT_QUESTION: 'get-next-question',
    GET_FINAL_LEADERBOARD: 'get-final-leaderboard',
    ADMIN_LOGIN: 'admin-login',
    GET_QUIZZES: 'get-quizzes',
    CREATE_QUIZ: 'create-quiz',
    ADD_QUESTION: 'add-question',
    UPDATE_QUESTION: 'update-question',
    DELETE_QUESTION: 'delete-question',
    DELETE_QUIZ: 'delete-quiz',
    SELECT_QUIZ: 'select-quiz',
    START_QUIZ: 'start-quiz',
    RESTART_QUIZ: 'restart-quiz',
    GET_QUIZ_QUESTIONS: 'get-quiz-questions'
};
}),
"[project]/lib/hooks/useQuizSocket.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useQuizSocket",
    ()=>useQuizSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$SocketProvider$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/providers/SocketProvider.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/constants/socket-events.js [app-ssr] (ecmascript)");
'use client';
;
;
;
function useQuizSocket() {
    const { socket, connected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$providers$2f$SocketProvider$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SocketContext"]);
    const [player, setPlayer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [question, setQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [leaderboard, setLeaderboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle'); // idle | waiting | playing | ended
    const [playersCount, setPlayersCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [quizInfo, setQuizInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Регистрация игрока
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((name)=>{
        if (!socket) return Promise.resolve({
            error: 'Нет подключения'
        });
        return new Promise((resolve)=>{
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].REGISTER, name, (response)=>{
                if (response.playerId && !response.error) {
                    setPlayer({
                        id: response.playerId,
                        name: response.name
                    });
                    sessionStorage.setItem('quiz_player_session', JSON.stringify({
                        playerId: response.playerId,
                        name: response.name
                    }));
                }
                resolve(response);
            });
        });
    }, [
        socket
    ]);
    // Слушатель: registered
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            if (data.playerId && !data.error) {
                setPlayer({
                    id: data.playerId,
                    name: data.name
                });
            }
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].REGISTERED, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].REGISTERED, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: quiz-ready
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setGameState('waiting');
            setQuizInfo(data);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_READY, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_READY, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: new-question
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setQuestion(data);
            setGameState('playing');
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].NEW_QUESTION, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].NEW_QUESTION, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: update-leaderboard
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setLeaderboard(data);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].UPDATE_LEADERBOARD, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].UPDATE_LEADERBOARD, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: players-count
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setPlayersCount(data.count);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYERS_COUNT, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYERS_COUNT, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: player-quiz-ended
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setGameState('ended');
            setQuestion(null);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYER_QUIZ_ENDED, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYER_QUIZ_ENDED, handler);
        };
    }, [
        socket
    ]);
    // Слушатель: all-players-finished
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setGameState('ended');
            setQuestion(null);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].ALL_PLAYERS_FINISHED, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].ALL_PLAYERS_FINISHED, handler);
        };
    }, [
        socket
    ]);
    // Отправка ответа
    const submitAnswer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((answerData)=>{
        if (!socket) return;
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].SUBMIT_ANSWER, answerData);
    }, [
        socket
    ]);
    // Время вышло
    const timeUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!socket) return;
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].TIME_UP);
    }, [
        socket
    ]);
    // Запрос финального leaderboard
    const getFinalLeaderboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!socket) return Promise.resolve([]);
        return new Promise((resolve)=>{
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_FINAL_LEADERBOARD);
            socket.once(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].FINAL_LEADERBOARD, (data)=>{
                setLeaderboard(data);
                setGameState('ended');
                resolve(data);
            });
        });
    }, [
        socket
    ]);
    // quiz-restarted
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = (data)=>{
            setGameState('waiting');
            setQuestion(null);
            setQuizInfo(data);
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_RESTARTED, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_RESTARTED, handler);
        };
    }, [
        socket
    ]);
    // quiz-already-started
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!socket) return;
        const handler = ()=>{
            setGameState('already-started');
        };
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_ALREADY_STARTED, handler);
        return ()=>{
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_ALREADY_STARTED, handler);
        };
    }, [
        socket
    ]);
    return {
        socket,
        connected,
        player,
        question,
        leaderboard,
        gameState,
        playersCount,
        quizInfo,
        register,
        submitAnswer,
        timeUp,
        getFinalLeaderboard
    };
}
}),
"[project]/components/shared/Card.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
function Card({ children, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `bg-bg-card rounded-xl p-4 md:p-6 border border-accent/30 shadow-lg ${className}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/shared/Card.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/shared/Input.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
function Input({ value, onChange, placeholder = '', type = 'text', className = '', ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        value: value,
        onChange: onChange,
        placeholder: placeholder,
        className: `
        w-full h-11 px-4 py-3
        bg-bg-card border-2 border-accent/30 rounded-lg
        text-text-primary text-base
        placeholder:text-text-secondary
        focus:outline-none focus:border-accent
        transition-colors duration-200
        ${className}
      `,
        ...props
    }, void 0, false, {
        fileName: "[project]/components/shared/Input.jsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/shared/Button.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
'use client';
;
;
const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white',
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    warning: 'bg-warning text-bg-primary',
    ghost: 'bg-transparent hover:bg-accent/20 text-text-primary border border-accent/30'
};
const sizes = {
    sm: 'px-3 py-2 text-sm h-11',
    md: 'px-5 py-3 text-base h-11',
    lg: 'px-8 py-4 text-lg h-12'
};
function Button({ variant = 'primary', size = 'md', children, disabled = false, onClick, className = '', type = 'button', ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
        type: type,
        onClick: onClick,
        disabled: disabled,
        whileTap: !disabled ? {
            scale: 0.97
        } : {},
        className: `
        inline-flex items-center justify-center gap-2 font-semibold rounded-lg
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `,
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/shared/Button.jsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/admin/AdminLogin.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminLogin",
    ()=>AdminLogin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Card.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Input.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Button.jsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function AdminLogin({ socket, onSuccess }) {
    const [login, setLogin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleLogin = (e)=>{
        e.preventDefault();
        setLoading(true);
        setError('');
        socket.emit('admin-login', {
            login,
            password
        }, (res)=>{
            setLoading(false);
            if (res.success) {
                onSuccess();
            } else {
                setError(res.error || 'Неверный логин или пароль');
            }
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                y: 20
            },
            animate: {
                opacity: 1,
                y: 0
            },
            transition: {
                duration: 0.4
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                className: "w-full max-w-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent",
                        children: "QUIZZ Админ"
                    }, void 0, false, {
                        fileName: "[project]/components/admin/AdminLogin.jsx",
                        lineNumber: 33,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleLogin,
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm text-text-secondary mb-1",
                                        htmlFor: "admin-login",
                                        children: "Логин"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminLogin.jsx",
                                        lineNumber: 38,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        id: "admin-login",
                                        value: login,
                                        onChange: (e)=>setLogin(e.target.value),
                                        placeholder: "Введите логин",
                                        autoComplete: "username"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminLogin.jsx",
                                        lineNumber: 39,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/admin/AdminLogin.jsx",
                                lineNumber: 37,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm text-text-secondary mb-1",
                                        htmlFor: "admin-pass",
                                        children: "Пароль"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminLogin.jsx",
                                        lineNumber: 42,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "password",
                                        id: "admin-pass",
                                        value: password,
                                        onChange: (e)=>setPassword(e.target.value),
                                        placeholder: "Введите пароль",
                                        autoComplete: "current-password"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminLogin.jsx",
                                        lineNumber: 43,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/admin/AdminLogin.jsx",
                                lineNumber: 41,
                                columnNumber: 13
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-danger text-sm text-center",
                                role: "alert",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/components/admin/AdminLogin.jsx",
                                lineNumber: 45,
                                columnNumber: 23
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                type: "submit",
                                variant: "primary",
                                size: "md",
                                className: "w-full",
                                disabled: loading,
                                children: loading ? 'Вход...' : 'Войти'
                            }, void 0, false, {
                                fileName: "[project]/components/admin/AdminLogin.jsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/AdminLogin.jsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/admin/AdminLogin.jsx",
                lineNumber: 32,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/admin/AdminLogin.jsx",
            lineNumber: 31,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/admin/AdminLogin.jsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/admin/QuestionEditor.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuestionEditor",
    ()=>QuestionEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Card.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Button.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Input.jsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const QUESTION_TYPES = [
    {
        value: 'multiple_choice',
        label: 'Множественный выбор'
    },
    {
        value: 'true_false',
        label: 'Правда / Ложь'
    },
    {
        value: 'fill_blank',
        label: 'Заполнить пробел'
    },
    {
        value: 'open_ended',
        label: 'Развёрнутый ответ'
    },
    {
        value: 'ordering',
        label: 'Сортировка'
    },
    {
        value: 'matching',
        label: 'Сопоставление'
    }
];
function QuestionEditor({ question, onSave, onCancel }) {
    const [text, setText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.text || '');
    const [type, setType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.type || 'multiple_choice');
    const [timeLimit, setTimeLimit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.timeLimit || 30);
    const [answerType, setAnswerType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.answerType || 'single');
    const [image, setImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.image || null);
    const [imagePreview, setImagePreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.image || null);
    // Options & correct
    const [options, setOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.options || [
        '',
        ''
    ]);
    const [correct, setCorrect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.correct || []);
    // Ordering
    const [orderAnswer, setOrderAnswer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.orderAnswer || []);
    // Text answer (fill_blank, open_ended)
    const [textAnswer, setTextAnswer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(question?.options?.[0] || '');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (question?.orderAnswer) setOrderAnswer(question.orderAnswer);
    }, [
        question
    ]);
    const handleImageUpload = (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = ()=>{
            const base64 = reader.result;
            setImage(base64);
            setImagePreview(base64);
        };
        reader.readAsDataURL(file);
    };
    const handleOptionChange = (index, value)=>{
        const newOptions = [
            ...options
        ];
        newOptions[index] = value;
        setOptions(newOptions);
    };
    const addOption = ()=>setOptions([
            ...options,
            ''
        ]);
    const removeOption = (index)=>{
        if (options.length <= 2) return;
        const newOptions = options.filter((_, i)=>i !== index);
        const newCorrect = correct.filter((c)=>c !== index).map((c)=>c > index ? c - 1 : c);
        setOptions(newOptions);
        setCorrect(newCorrect);
    };
    const toggleCorrect = (index)=>{
        if (answerType === 'single') {
            setCorrect(correct.includes(index) ? [] : [
                index
            ]);
        } else {
            setCorrect(correct.includes(index) ? correct.filter((c)=>c !== index) : [
                ...correct,
                index
            ]);
        }
    };
    const handleOrderItemMove = (index, direction)=>{
        const newOrder = [
            ...orderAnswer
        ];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        [newOrder[index], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[index]
        ];
        setOrderAnswer(newOrder);
    };
    const handleSave = ()=>{
        if (!text.trim()) return;
        const questionData = {
            text: text.trim(),
            type,
            timeLimit: Math.max(5, Math.min(300, Number(timeLimit) || 30)),
            image
        };
        switch(type){
            case 'multiple_choice':
            case 'true_false':
                questionData.options = options;
                questionData.correct = correct;
                questionData.answerType = type === 'multiple_choice' ? answerType : 'single';
                break;
            case 'fill_blank':
            case 'open_ended':
                questionData.options = [
                    textAnswer
                ];
                questionData.correct = [
                    0
                ];
                break;
            case 'ordering':
                questionData.options = orderAnswer.length > 0 ? orderAnswer : options;
                questionData.correct = orderAnswer.length > 0 ? orderAnswer : options;
                questionData.orderAnswer = orderAnswer.length > 0 ? orderAnswer : options;
                break;
            case 'matching':
                questionData.options = options;
                questionData.correct = correct;
                break;
        }
        onSave(questionData);
    };
    const renderTypeSpecificFields = ()=>{
        switch(type){
            case 'multiple_choice':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "text-sm text-text-secondary",
                                    children: "Тип ответа:"
                                }, void 0, false, {
                                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                                    lineNumber: 127,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                setAnswerType('single');
                                                setCorrect([]);
                                            },
                                            className: `px-3 py-2 rounded text-sm min-h-[44px] ${answerType === 'single' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'}`,
                                            children: "Один ответ"
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                                            lineNumber: 129,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>{
                                                setAnswerType('multiple');
                                            },
                                            className: `px-3 py-2 rounded text-sm min-h-[44px] ${answerType === 'multiple' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'}`,
                                            children: "Несколько"
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                                            lineNumber: 132,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, this),
                        options.map((opt, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: correct.includes(i),
                                        onChange: ()=>toggleCorrect(i),
                                        className: "w-5 h-5 accent-accent flex-shrink-0"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 139,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        value: opt,
                                        onChange: (e)=>handleOptionChange(i, e.target.value),
                                        placeholder: `Вариант ${i + 1}`
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 145,
                                        columnNumber: 17
                                    }, this),
                                    options.length > 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>removeOption(i),
                                        className: "text-danger p-2 min-w-[44px] min-h-[44px] flex items-center justify-center",
                                        children: "✕"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 147,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 138,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            onClick: addOption,
                            variant: "ghost",
                            size: "sm",
                            type: "button",
                            children: "+ Вариант"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 151,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-text-secondary",
                            children: "Отметьте правильные варианты ☑"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 152,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                    lineNumber: 125,
                    columnNumber: 11
                }, this);
            case 'true_false':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-text-secondary",
                            children: "Выберите правильный ответ:"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 159,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setCorrect([
                                            0
                                        ]),
                                    className: `flex-1 py-3 rounded-lg font-medium min-h-[44px] ${correct.includes(0) ? 'bg-success text-white' : 'bg-bg-primary text-text-secondary border-2 border-accent/30'}`,
                                    children: "✅ Правда"
                                }, void 0, false, {
                                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                                    lineNumber: 161,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setCorrect([
                                            1
                                        ]),
                                    className: `flex-1 py-3 rounded-lg font-medium min-h-[44px] ${correct.includes(1) ? 'bg-danger text-white' : 'bg-bg-primary text-text-secondary border-2 border-accent/30'}`,
                                    children: "❌ Ложь"
                                }, void 0, false, {
                                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                                    lineNumber: 164,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 160,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                    lineNumber: 158,
                    columnNumber: 11
                }, this);
            case 'fill_blank':
            case 'open_ended':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-sm text-text-secondary",
                            children: type === 'fill_blank' ? 'Правильный ответ:' : 'Ожидаемый ответ:'
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 175,
                            columnNumber: 13
                        }, this),
                        type === 'open_ended' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            value: textAnswer,
                            onChange: (e)=>setTextAnswer(e.target.value),
                            placeholder: "Введите ожидаемый ответ...",
                            className: "w-full min-h-[120px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 179,
                            columnNumber: 15
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                            value: textAnswer,
                            onChange: (e)=>setTextAnswer(e.target.value),
                            placeholder: "Правильный ответ"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 181,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                    lineNumber: 174,
                    columnNumber: 11
                }, this);
            case 'ordering':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-text-secondary",
                            children: "Элементы в ПРАВИЛЬНОМ порядке (сверху — первый):"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 189,
                            columnNumber: 13
                        }, this),
                        orderAnswer.length > 0 ? orderAnswer.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-accent font-bold w-6 text-center",
                                        children: i + 1
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 193,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        value: item,
                                        onChange: (e)=>{
                                            const n = [
                                                ...orderAnswer
                                            ];
                                            n[i] = e.target.value;
                                            setOrderAnswer(n);
                                        },
                                        placeholder: `Элемент ${i + 1}`
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 194,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>handleOrderItemMove(i, 'up'),
                                                className: "min-h-[22px] px-2 text-xs text-text-secondary hover:text-text-primary",
                                                children: "▲"
                                            }, void 0, false, {
                                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                                lineNumber: 196,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>handleOrderItemMove(i, 'down'),
                                                className: "min-h-[22px] px-2 text-xs text-text-secondary hover:text-text-primary",
                                                children: "▼"
                                            }, void 0, false, {
                                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                                lineNumber: 197,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 195,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 192,
                                columnNumber: 17
                            }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                options.map((opt, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-accent font-bold w-6 text-center",
                                                children: i + 1
                                            }, void 0, false, {
                                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                                lineNumber: 205,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                value: opt,
                                                onChange: (e)=>handleOptionChange(i, e.target.value),
                                                placeholder: `Элемент ${i + 1}`
                                            }, void 0, false, {
                                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                                lineNumber: 206,
                                                columnNumber: 21
                                            }, this),
                                            options.length > 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>removeOption(i),
                                                className: "text-danger p-2 min-w-[44px]",
                                                children: "✕"
                                            }, void 0, false, {
                                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                                lineNumber: 208,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 204,
                                        columnNumber: 19
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: addOption,
                                    variant: "ghost",
                                    size: "sm",
                                    type: "button",
                                    children: "+ Элемент"
                                }, void 0, false, {
                                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                                    lineNumber: 212,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 202,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                    lineNumber: 188,
                    columnNumber: 11
                }, this);
            case 'matching':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-text-secondary",
                            children: "Пары для сопоставления:"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 221,
                            columnNumber: 13
                        }, this),
                        options.map((opt, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2 items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        value: opt,
                                        onChange: (e)=>handleOptionChange(i, e.target.value),
                                        placeholder: `Вопрос ${Math.floor(i / 2) + 1}`,
                                        className: "flex-1"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 224,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-text-secondary",
                                        children: "↔"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 225,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        value: options[i + 1] || '',
                                        onChange: (e)=>handleOptionChange(i + 1, e.target.value),
                                        placeholder: `Ответ ${Math.floor(i / 2) + 1}`,
                                        className: "flex-1"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 226,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 223,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            onClick: ()=>setOptions([
                                    ...options,
                                    '',
                                    ''
                                ]),
                            variant: "ghost",
                            size: "sm",
                            type: "button",
                            children: "+ Пара"
                        }, void 0, false, {
                            fileName: "[project]/components/admin/QuestionEditor.jsx",
                            lineNumber: 229,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/QuestionEditor.jsx",
                    lineNumber: 220,
                    columnNumber: 11
                }, this);
            default:
                return null;
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold mb-4",
                children: question ? 'Редактировать вопрос' : 'Новый вопрос'
            }, void 0, false, {
                fileName: "[project]/components/admin/QuestionEditor.jsx",
                lineNumber: 240,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm text-text-secondary mb-1",
                                children: "Тип вопроса"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 246,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: type,
                                onChange: (e)=>{
                                    setType(e.target.value);
                                    setCorrect([]);
                                    setOptions(e.target.value === 'true_false' ? [
                                        'Правда',
                                        'Ложь'
                                    ] : [
                                        '',
                                        ''
                                    ]);
                                },
                                className: "w-full min-h-[44px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary focus:outline-none focus:border-accent",
                                children: QUESTION_TYPES.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: t.value,
                                        children: t.label
                                    }, t.value, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 249,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm text-text-secondary mb-1",
                                children: "Текст вопроса"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 256,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: text,
                                onChange: (e)=>setText(e.target.value),
                                placeholder: "Введите вопрос...",
                                className: "w-full min-h-[80px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors resize-none"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 257,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                        lineNumber: 255,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm text-text-secondary mb-1",
                                children: "Время на ответ (секунды)"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 262,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                type: "number",
                                value: timeLimit,
                                onChange: (e)=>setTimeLimit(e.target.value),
                                min: 5,
                                max: 300
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 263,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                        lineNumber: 261,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm text-text-secondary mb-1",
                                children: "Изображение (необязательно)"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 268,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                accept: "image/*",
                                onChange: handleImageUpload,
                                className: "w-full text-text-secondary"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 269,
                                columnNumber: 11
                            }, this),
                            imagePreview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: imagePreview,
                                        alt: "Preview",
                                        className: "max-h-40 rounded-lg"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 272,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setImage(null);
                                            setImagePreview(null);
                                        },
                                        className: "text-danger text-sm mt-1",
                                        children: "Удалить изображение"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                                        lineNumber: 273,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 271,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                        lineNumber: 267,
                        columnNumber: 9
                    }, this),
                    renderTypeSpecificFields(),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2 pt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: handleSave,
                                variant: "success",
                                size: "md",
                                className: "flex-1",
                                type: "button",
                                children: "Сохранить"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 283,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: onCancel,
                                variant: "ghost",
                                size: "md",
                                className: "flex-1",
                                type: "button",
                                children: "Отмена"
                            }, void 0, false, {
                                fileName: "[project]/components/admin/QuestionEditor.jsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/admin/QuestionEditor.jsx",
                        lineNumber: 282,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/admin/QuestionEditor.jsx",
                lineNumber: 243,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/admin/QuestionEditor.jsx",
        lineNumber: 239,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/admin/LiveLeaderboard.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiveLeaderboard",
    ()=>LiveLeaderboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useQuizSocket.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Card.jsx [app-ssr] (ecmascript)");
'use client';
;
;
;
function LiveLeaderboard() {
    const { leaderboard } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuizSocket"])();
    if (!leaderboard || leaderboard.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
            className: "text-center text-text-secondary py-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-4xl mb-3",
                    children: "📊"
                }, void 0, false, {
                    fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                    lineNumber: 12,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Пока нет данных. Запустите викторину!"
                }, void 0, false, {
                    fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                    lineNumber: 13,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/admin/LiveLeaderboard.jsx",
            lineNumber: 11,
            columnNumber: 7
        }, this);
    }
    const medals = [
        '🥇',
        '🥈',
        '🥉'
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold mb-4",
                children: "📊 Рейтинг в реальном времени"
            }, void 0, false, {
                fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                children: leaderboard.map((player, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex items-center gap-3 p-3 rounded-lg transition-colors ${i === 0 ? 'bg-accent/20 border border-accent/50' : 'bg-bg-primary/50'}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl w-10 text-center flex-shrink-0",
                                children: i < 3 ? medals[i] : `#${i + 1}`
                            }, void 0, false, {
                                fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                                lineNumber: 26,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-medium truncate",
                                        children: player.name
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                                        lineNumber: 28,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-text-secondary",
                                        children: [
                                            player.answered,
                                            "/",
                                            player.totalQuestions,
                                            " отвечено • ",
                                            player.percentage,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                                        lineNumber: 29,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                                lineNumber: 27,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-accent font-bold text-lg",
                                children: player.score
                            }, void 0, false, {
                                fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                                lineNumber: 33,
                                columnNumber: 13
                            }, this)
                        ]
                    }, player.name, true, {
                        fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/admin/LiveLeaderboard.jsx",
                lineNumber: 23,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/admin/LiveLeaderboard.jsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/admin/AdminDashboard.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdminDashboard",
    ()=>AdminDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Card.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Button.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/Input.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$QuestionEditor$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin/QuestionEditor.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$LiveLeaderboard$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin/LiveLeaderboard.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/constants/socket-events.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
function AdminDashboard({ socket }) {
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('quizzes');
    const [quizzes, setQuizzes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedQuiz, setSelectedQuiz] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showEditor, setShowEditor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editingQuestion, setEditingQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [quizName, setQuizName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    // Статус игры: 'none' | 'selected' | 'running'
    const [gameStatus, setGameStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('none');
    const [gameMessage, setGameMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [playersOnline, setPlayersOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    // Загрузка списка викторин
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_QUIZZES);
        const handleQuizzesList = (data)=>setQuizzes(data);
        // Виктория выбрана — готова к запуску
        const handleQuizReady = (data)=>{
            setGameStatus('selected');
            setSelectedQuiz(data.quizId);
            setGameMessage(`✓ «${data.name}» выбрана (${data.questionsCount} вопросов). Ожидание игроков...`);
        };
        // Игра перезапущена
        const handleQuizRestarted = (data)=>{
            setGameStatus('selected');
            setGameMessage(`🔄 «${data.name}» перезапущена!`);
            setTimeout(()=>setGameMessage(''), 3000);
        };
        const handleQuizCreated = ()=>socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_QUIZZES);
        const handleQuestionAdded = ()=>socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_QUIZZES);
        const handleQuestionUpdated = ()=>socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_QUIZZES);
        // Получение вопросов конкретной викторины
        const handleQuizQuestions = (data)=>{
            setQuizzes((prev)=>prev.map((q)=>q.id === data.quizId ? {
                        ...q,
                        questions: data.questions
                    } : q));
        };
        // Все игроки завершили — показываем уведомление
        const handleAllFinished = (data)=>{
            setGameStatus('none');
            setGameMessage(`🏁 Все игроки завершили! Всего вопросов: ${data.totalQuestions}`);
        };
        // Количество игроков онлайн
        const handlePlayersCount = (data)=>setPlayersOnline(data.count);
        socket.on('quizzes-list', handleQuizzesList);
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_READY, handleQuizReady);
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_RESTARTED, handleQuizRestarted);
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].ALL_PLAYERS_FINISHED, handleAllFinished);
        socket.on(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYERS_COUNT, handlePlayersCount);
        socket.on('quiz-created', handleQuizCreated);
        socket.on('question-added', handleQuestionAdded);
        socket.on('question-updated', handleQuestionUpdated);
        socket.on('quiz-questions', handleQuizQuestions);
        return ()=>{
            socket.off('quizzes-list', handleQuizzesList);
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_READY, handleQuizReady);
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].QUIZ_RESTARTED, handleQuizRestarted);
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].ALL_PLAYERS_FINISHED, handleAllFinished);
            socket.off(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERVER_EVENTS"].PLAYERS_COUNT, handlePlayersCount);
            socket.off('quiz-created', handleQuizCreated);
            socket.off('question-added', handleQuestionAdded);
            socket.off('question-updated', handleQuestionUpdated);
            socket.off('quiz-questions', handleQuizQuestions);
        };
    }, [
        socket
    ]);
    const handleCreateQuiz = ()=>{
        const name = quizName.trim() || `Викторина ${quizzes.length + 1}`;
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].CREATE_QUIZ, {
            name
        });
        setQuizName('');
    };
    const handleSelectQuiz = (quiz)=>{
        setSelectedQuiz(quiz.id);
        setGameStatus('none');
        setGameMessage('');
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].SELECT_QUIZ, quiz.id);
        // Загружаем вопросы через небольшую задержку чтобы сервер успел обработать
        setTimeout(()=>socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_QUIZ_QUESTIONS, quiz.id), 200);
    };
    const handleStartQuiz = ()=>{
        if (!selectedQuiz) {
            setGameMessage('⚠️ Сначала выберите викторину!');
            return;
        }
        const quiz = quizzes.find((q)=>q.id === selectedQuiz);
        if (!quiz || !quiz.questions?.length) {
            setGameMessage('⚠️ Добавьте хотя бы один вопрос!');
            return;
        }
        console.log('🚀 Запуск викторины:', quiz.name);
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].START_QUIZ);
        setGameStatus('running');
        setGameMessage(`🎮 «${quiz.name}» запущена! Игроки получают вопросы...`);
    };
    const handleRestartQuiz = ()=>{
        if (!selectedQuiz) return;
        const quiz = quizzes.find((q)=>q.id === selectedQuiz);
        console.log('🔄 Перезапуск викторины:', quiz?.name);
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].RESTART_QUIZ);
        setGameStatus('selected');
        setGameMessage('🔄 Викторина перезапущена!');
        setTimeout(()=>setGameMessage(''), 3000);
    };
    const handleDeleteQuiz = (quizId)=>{
        if (confirm('Удалить викторину?')) {
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].DELETE_QUIZ, quizId);
            if (selectedQuiz === quizId) {
                setSelectedQuiz(null);
                setGameStatus('none');
                setGameMessage('');
            }
        }
    };
    const handleAddQuestion = ()=>{
        setEditingQuestion(null);
        setShowEditor(true);
    };
    const handleEditQuestion = (question, index)=>{
        setEditingQuestion({
            ...question,
            index
        });
        setShowEditor(true);
    };
    const handleDeleteQuestion = (questionIndex)=>{
        if (selectedQuiz && confirm('Удалить вопрос?')) {
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].DELETE_QUESTION, {
                quizId: selectedQuiz,
                questionIndex
            });
        }
    };
    const handleSaveQuestion = (questionData)=>{
        if (!selectedQuiz) return;
        if (editingQuestion !== null) {
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].UPDATE_QUESTION, {
                quizId: selectedQuiz,
                questionIndex: editingQuestion.index,
                ...questionData
            });
        } else {
            socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].ADD_QUESTION, {
                quizId: selectedQuiz,
                ...questionData
            });
        }
        setShowEditor(false);
        setEditingQuestion(null);
    };
    const handleDownloadCSV = ()=>{
        socket.emit(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$constants$2f$socket$2d$events$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLIENT_EVENTS"].GET_FINAL_LEADERBOARD);
        socket.once('final-leaderboard', (data)=>{
            if (!data || data.length === 0) {
                setGameMessage('Нет данных для экспорта');
                return;
            }
            const headers = 'Место,Имя,Скор,Отвечено,Процент\n';
            const rows = data.map((p, i)=>`${i + 1},"${p.name}",${p.score},${p.answered}/${p.totalQuestions},${p.percentage}%`).join('\n');
            const blob = new Blob([
                headers + rows
            ], {
                type: 'text/csv;charset=utf-8;'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-results-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    };
    const selectedQuizData = quizzes.find((q)=>q.id === selectedQuiz);
    const tabs = [
        {
            id: 'quizzes',
            label: 'Викторины'
        },
        {
            id: 'leaderboard',
            label: 'Рейтинг'
        },
        {
            id: 'control',
            label: 'Управление'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-bg-primary",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-bg-secondary border-b border-accent/30 sticky top-0 z-30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto px-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1 overflow-x-auto",
                        children: tabs.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveTab(tab.id),
                                className: `px-4 py-3 min-h-[44px] text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`,
                                children: [
                                    tab.label,
                                    tab.id === 'control' && playersOnline > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-1 text-xs bg-success text-bg-primary px-1.5 py-0.5 rounded-full",
                                        children: playersOnline
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 221,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, tab.id, true, {
                                fileName: "[project]/components/admin/AdminDashboard.jsx",
                                lineNumber: 210,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                        lineNumber: 208,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                    lineNumber: 207,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/admin/AdminDashboard.jsx",
                lineNumber: 206,
                columnNumber: 7
            }, this),
            gameMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-accent/20 border-b border-accent/30 px-4 py-2 text-center text-sm text-text-primary",
                children: gameMessage
            }, void 0, false, {
                fileName: "[project]/components/admin/AdminDashboard.jsx",
                lineNumber: 231,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-6xl mx-auto p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                    mode: "wait",
                    children: [
                        activeTab === 'quizzes' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-semibold mb-3",
                                            children: "Создать викторину"
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 243,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-2 flex-col sm:flex-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Input$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                    value: quizName,
                                                    onChange: (e)=>setQuizName(e.target.value),
                                                    placeholder: "Название викторины",
                                                    className: "flex-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 245,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                    onClick: handleCreateQuiz,
                                                    variant: "primary",
                                                    size: "md",
                                                    children: "Создать"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 246,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 244,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                    lineNumber: 242,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-semibold mb-3",
                                            children: [
                                                "Мои викторины (",
                                                quizzes.length,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 252,
                                            columnNumber: 17
                                        }, this),
                                        quizzes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-text-secondary text-center py-4",
                                            children: "Пока нет викторин. Создайте первую!"
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 254,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: quizzes.map((quiz)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `flex items-center gap-3 p-3 rounded-lg transition-colors flex-wrap ${selectedQuiz === quiz.id ? 'bg-accent/20 border border-accent/50' : 'bg-bg-primary/30 hover:bg-bg-primary/50'}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>handleSelectQuiz(quiz),
                                                            className: "flex-1 text-left min-h-[44px]",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-medium",
                                                                    children: quiz.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 260,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-text-secondary",
                                                                    children: [
                                                                        quiz.questionsCount,
                                                                        " вопросов"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 261,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                            lineNumber: 259,
                                                            columnNumber: 25
                                                        }, this),
                                                        selectedQuiz === quiz.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-success text-sm font-medium flex-shrink-0",
                                                            children: "✓ Выбрана"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                            lineNumber: 264,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                            onClick: ()=>handleDeleteQuiz(quiz.id),
                                                            variant: "danger",
                                                            size: "sm",
                                                            children: "Удалить"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                            lineNumber: 266,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, quiz.id, true, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 258,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 256,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                    lineNumber: 251,
                                    columnNumber: 15
                                }, this),
                                selectedQuizData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center mb-3 flex-wrap gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "text-lg font-semibold",
                                                    children: [
                                                        "Вопросы: ",
                                                        selectedQuizData.name
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 277,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                    onClick: handleAddQuestion,
                                                    variant: "primary",
                                                    size: "sm",
                                                    children: "+ Добавить вопрос"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 278,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 276,
                                            columnNumber: 19
                                        }, this),
                                        !selectedQuizData.questions || selectedQuizData.questions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-text-secondary text-center py-4",
                                            children: "Нет вопросов. Добавьте первый!"
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 281,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: selectedQuizData.questions.map((q, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3 p-3 rounded-lg bg-bg-primary/30",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex-1 min-w-0",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-text-secondary",
                                                                    children: [
                                                                        "#",
                                                                        i + 1,
                                                                        " [",
                                                                        q.type,
                                                                        "]"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 287,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-medium truncate",
                                                                    children: q.text
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 288,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                            lineNumber: 286,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex gap-1 flex-shrink-0",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                                    onClick: ()=>handleEditQuestion(q, i),
                                                                    variant: "ghost",
                                                                    size: "sm",
                                                                    children: "✏️"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 291,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                                    onClick: ()=>handleDeleteQuestion(i),
                                                                    variant: "danger",
                                                                    size: "sm",
                                                                    children: "🗑️"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                                    lineNumber: 292,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                            lineNumber: 290,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, i, true, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 285,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 283,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                    lineNumber: 275,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                    children: showEditor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: {
                                            opacity: 0,
                                            y: 20
                                        },
                                        animate: {
                                            opacity: 1,
                                            y: 0
                                        },
                                        exit: {
                                            opacity: 0,
                                            y: -20
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$QuestionEditor$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QuestionEditor"], {
                                            question: editingQuestion,
                                            onSave: handleSaveQuestion,
                                            onCancel: ()=>{
                                                setShowEditor(false);
                                                setEditingQuestion(null);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 305,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 304,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                    lineNumber: 302,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, "quizzes", true, {
                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                            lineNumber: 240,
                            columnNumber: 13
                        }, this),
                        activeTab === 'leaderboard' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$LiveLeaderboard$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LiveLeaderboard"], {}, void 0, false, {
                                fileName: "[project]/components/admin/AdminDashboard.jsx",
                                lineNumber: 319,
                                columnNumber: 15
                            }, this)
                        }, "leaderboard", false, {
                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                            lineNumber: 318,
                            columnNumber: 13
                        }, this),
                        activeTab === 'control' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Card$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-lg font-semibold mb-4",
                                        children: "🎮 Управление игрой"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 327,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-4 p-3 rounded-lg bg-bg-primary/50",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `w-3 h-3 rounded-full flex-shrink-0 ${gameStatus === 'running' ? 'bg-success animate-pulse' : gameStatus === 'selected' ? 'bg-warning' : 'bg-text-secondary'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 332,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm",
                                                    children: gameStatus === 'running' ? '🟢 Игра идёт' : gameStatus === 'selected' ? '🟡 Готова к запуску' : '⚪ Не запущена'
                                                }, void 0, false, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 336,
                                                    columnNumber: 21
                                                }, this),
                                                playersOnline > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-text-secondary ml-auto",
                                                    children: [
                                                        "👥 Игроков онлайн: ",
                                                        playersOnline
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                    lineNumber: 341,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                                            lineNumber: 331,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 330,
                                        columnNumber: 17
                                    }, this),
                                    selectedQuizData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-text-secondary",
                                                children: [
                                                    "Выбрана: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: "text-text-primary",
                                                        children: selectedQuizData.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                        lineNumber: 349,
                                                        columnNumber: 32
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                        lineNumber: 350,
                                                        columnNumber: 23
                                                    }, this),
                                                    "Вопросов: ",
                                                    selectedQuizData.questions?.length || 0
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                lineNumber: 348,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        onClick: handleStartQuiz,
                                                        variant: "success",
                                                        size: "md",
                                                        disabled: gameStatus === 'running',
                                                        children: gameStatus === 'running' ? '🟢 Игра идёт' : '▶ Начать игру'
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                        lineNumber: 353,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        onClick: handleRestartQuiz,
                                                        variant: "warning",
                                                        size: "md",
                                                        disabled: gameStatus === 'none',
                                                        children: "🔄 Перезапустить"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                        lineNumber: 361,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$Button$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                                        onClick: handleDownloadCSV,
                                                        variant: "ghost",
                                                        size: "md",
                                                        children: "📥 Скачать CSV"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                        lineNumber: 369,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/admin/AdminDashboard.jsx",
                                                lineNumber: 352,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 347,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-text-secondary text-center py-4",
                                        children: "Сначала выберите викторину во вкладке «Викторины»"
                                    }, void 0, false, {
                                        fileName: "[project]/components/admin/AdminDashboard.jsx",
                                        lineNumber: 375,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/admin/AdminDashboard.jsx",
                                lineNumber: 326,
                                columnNumber: 15
                            }, this)
                        }, "control", false, {
                            fileName: "[project]/components/admin/AdminDashboard.jsx",
                            lineNumber: 325,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/admin/AdminDashboard.jsx",
                    lineNumber: 237,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/admin/AdminDashboard.jsx",
                lineNumber: 236,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/admin/AdminDashboard.jsx",
        lineNumber: 204,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/shared/ConnectionStatus.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConnectionStatus",
    ()=>ConnectionStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useQuizSocket.js [app-ssr] (ecmascript)");
'use client';
;
;
function ConnectionStatus() {
    const { connected, connectionError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuizSocket"])();
    if (connected && !connectionError) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warning text-bg-primary px-4 py-2 rounded-full text-sm font-medium animate-pulse shadow-lg",
        children: connectionError ? '⚠️ Ошибка подключения' : '🔄 Переподключение...'
    }, void 0, false, {
        fileName: "[project]/components/shared/ConnectionStatus.jsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/admin/page.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useQuizSocket.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$AdminLogin$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin/AdminLogin.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$AdminDashboard$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/admin/AdminDashboard.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$ConnectionStatus$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shared/ConnectionStatus.jsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function AdminPage() {
    const { socket } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useQuizSocket$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuizSocket"])();
    const [isAuthenticated, setIsAuthenticated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    if (!socket) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-bg-primary flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-text-secondary text-lg",
                children: "Подключение..."
            }, void 0, false, {
                fileName: "[project]/app/admin/page.js",
                lineNumber: 16,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/admin/page.js",
            lineNumber: 15,
            columnNumber: 7
        }, this);
    }
    if (!isAuthenticated) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-bg-primary",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$ConnectionStatus$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConnectionStatus"], {}, void 0, false, {
                    fileName: "[project]/app/admin/page.js",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$AdminLogin$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdminLogin"], {
                    socket: socket,
                    onSuccess: ()=>setIsAuthenticated(true)
                }, void 0, false, {
                    fileName: "[project]/app/admin/page.js",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/admin/page.js",
            lineNumber: 23,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-bg-primary",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shared$2f$ConnectionStatus$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConnectionStatus"], {}, void 0, false, {
                fileName: "[project]/app/admin/page.js",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$admin$2f$AdminDashboard$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdminDashboard"], {
                socket: socket
            }, void 0, false, {
                fileName: "[project]/app/admin/page.js",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/admin/page.js",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_0rq.pb7._.js.map