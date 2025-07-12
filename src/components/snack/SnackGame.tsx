'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Constants for game board and speed
const BOARD_SIZE: number = 20; // 20x20 grid
const TILE_SIZE: number = 20; // Pixels per tile
const INITIAL_SPEED: number = 200; // Milliseconds per frame (lower is faster)

// Define types for snake segments and direction
type SnakeSegment = [number, number]; // [row, column]
type Direction = [number, number]; // [deltaRow, deltaColumn]

// Main App component (can be used as a page component in Next.js, e.g., pages/index.tsx)
const Home: React.FC = () => {
    // Game state
    const [snake, setSnake] = useState<SnakeSegment[]>([[10, 10]]); // Initial snake position (head at [10,10])
    const [food, setFood] = useState<SnakeSegment>([5, 5]); // Initial food position
    const [direction, setDirection] = useState<Direction>([0, 1]); // Initial direction: right [x, y]
    const [score, setScore] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
    const [isPaused, setIsPaused] = useState<boolean>(false); // New state for pause functionality

    // Ref for game loop interval
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

    // Function to generate random food position
    const generateFood = useCallback(() => {
        let newFood: SnakeSegment;
        do {
            newFood = [
                Math.floor(Math.random() * BOARD_SIZE),
                Math.floor(Math.random() * BOARD_SIZE)
            ];
        } while (snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])); // Ensure food doesn't spawn on snake
        setFood(newFood);
    }, [snake]);

    // Function to handle snake movement
    const moveSnake = useCallback(() => {
        const newSnake = [...snake];
        const head: SnakeSegment = [...newSnake[0]]; // Copy head to avoid direct mutation

        // Update head position based on direction
        head[0] += direction[0];
        head[1] += direction[1];

        newSnake.unshift(head); // Add new head

        // Check for collision with walls
        if (
            head[0] < 0 || head[0] >= BOARD_SIZE ||
            head[1] < 0 || head[1] >= BOARD_SIZE
        ) {
            setGameOver(true);
            return;
        }

        // Check for collision with self
        if (newSnake.slice(1).some(segment => segment[0] === head[0] && segment[1] === head[1])) {
            setGameOver(true);
            return;
        }

        // Check if snake ate food
        if (head[0] === food[0] && head[1] === food[1]) {
            setScore(prevScore => prevScore + 1);
            generateFood();
            // Optionally increase speed
            setSpeed(prevSpeed => Math.max(50, prevSpeed - 5)); // Minimum speed 50ms
        } else {
            newSnake.pop(); // Remove tail if no food eaten
        }

        setSnake(newSnake);
    }, [snake, direction, food, generateFood]);

    // Function to toggle pause state
    const togglePause = useCallback(() => {
        // Only allow toggling pause if the game has started and is not over
        if (gameStarted && !gameOver) {
            setIsPaused(prev => !prev);
        }
    }, [gameStarted, gameOver]);

    // Handle keyboard input for direction and pause
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Handle Spacebar for pause/resume
        if (e.key === ' ') {
            e.preventDefault(); // Prevent default spacebar behavior (e.g., scrolling)
            togglePause();
            return;
        }

        // Only allow direction changes if game is started and not paused or over
        if (!gameStarted || gameOver || isPaused) return;

        // Prevent snake from reversing directly into itself
        const [dr, dc] = direction; // current direction [delta_row, delta_col]
        switch (e.key) {
            case 'ArrowUp':
                // If current direction is not 'down' (dr === 1), allow changing to 'up'
                if (dr !== 1) setDirection([-1, 0]);
                break;
            case 'ArrowDown':
                // If current direction is not 'up' (dr === -1), allow changing to 'down'
                if (dr !== -1) setDirection([1, 0]);
                break;
            case 'ArrowLeft':
                // If current direction is not 'right' (dc === 1), allow changing to 'left'
                if (dc !== 1) setDirection([0, -1]);
                break;
            case 'ArrowRight':
                // If current direction is not 'left' (dc === -1), allow changing to 'right'
                if (dc !== -1) setDirection([0, 1]);
                break;
            default:
                break;
        }
    }, [direction, gameStarted, gameOver, isPaused, togglePause]); // Added togglePause to dependencies

    // Game loop effect
    useEffect(() => {
        if (gameStarted && !gameOver && !isPaused) { // Only run if not paused
            gameLoopRef.current = setInterval(moveSnake, speed);
            return () => {
                if (gameLoopRef.current) {
                    clearInterval(gameLoopRef.current);
                }
            };
        } else { // Clear interval if game is over or paused
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
        }
    }, [gameStarted, gameOver, isPaused, moveSnake, speed]); // Added isPaused to dependencies

    // Add and clean up keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Reset game state
    const resetGame = () => {
        setSnake([[10, 10]]);
        setFood([5, 5]);
        setDirection([0, 1]);
        setScore(0);
        setGameOver(false);
        setGameStarted(false);
        setIsPaused(false); // Reset pause state
        setSpeed(INITIAL_SPEED);
        if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
        }
    };

    const startGame = () => {
        resetGame(); // Ensure a clean start
        setGameStarted(true);
        generateFood(); // Generate food for the new game
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white font-inter flex flex-col items-center justify-center p-4">
            <h1 className="text-5xl font-extrabold mb-8 text-green-400 drop-shadow-lg animate-pulse">Snake Game</h1>

            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-8 border-4 border-gray-600 flex flex-col items-center">
                <div
                    className="relative border-2 border-green-500 bg-gray-900 overflow-hidden rounded-md" // Added overflow-hidden and rounded-md
                    style={{
                        width: BOARD_SIZE * TILE_SIZE,
                        height: BOARD_SIZE * TILE_SIZE,
                    }}
                >
                    {/* Render snake segments */}
                    {snake.map((segment, index) => (
                        <div
                            key={index}
                            className={`
                                absolute bg-green-500 rounded-sm transition-all duration-75 ease-linear
                                ${index === 0 ? 'bg-green-600 shadow-lg' : 'bg-green-500'}
                                ${gameStarted && !gameOver && !isPaused ? 'animate-snake-pulse' : ''}
                            `}
                            style={{
                                left: segment[1] * TILE_SIZE, // Column is X
                                top: segment[0] * TILE_SIZE,  // Row is Y
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                            }}
                        />
                    ))}
                    {/* Render food */}
                    <div
                        className={`absolute bg-red-500 rounded-r-2xl ${gameStarted && !gameOver && !isPaused ? 'animate-bounce-food' : ''}`} // Added animation class
                        style={{
                            left: food[1] * TILE_SIZE, // Column is X
                            top: food[0] * TILE_SIZE,  // Row is Y
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                        }}
                    />
                    {isPaused && gameStarted && !gameOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-4xl font-bold">
                            PAUSED
                        </div>
                    )}
                </div>

                <div className="mt-6 text-2xl font-bold text-yellow-300">
                    Score: {score}
                </div>

                {gameOver && (
                    <div className="mt-4 text-3xl font-bold text-red-500 animate-fade-in-out">
                        Game Over!
                    </div>
                )}

                <div className="mt-8 flex gap-4">
                    {!gameStarted || gameOver ? (
                        <button
                            onClick={startGame}
                            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transform transition-transform duration-200 hover:scale-105 animate-button-pop"
                        >
                            {gameOver ? 'Play Again' : 'Start Game'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={togglePause}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transform transition-transform duration-200 hover:scale-105"
                            >
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button
                                onClick={resetGame}
                                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transform transition-transform duration-200 hover:scale-105"
                            >
                                Reset Game
                            </button>
                        </>
                    )}
                </div>
                <p className="mt-4 text-gray-400 text-lg">Use Arrow Keys to move the snake. Press Spacebar to Pause/Resume.</p>
            </div>

            {/* Custom Tailwind CSS Animations */}
            <style jsx>{`
                @keyframes snake-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.95); opacity: 0.8; }
                }
                .animate-snake-pulse {
                    animation: snake-pulse 0.5s infinite alternate;
                }

                @keyframes bounce-food {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-food {
                    animation: bounce-food 0.6s infinite alternate;
                }

                @keyframes fade-in-out {
                    0% { opacity: 0; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0; transform: scale(0.8); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 1.5s ease-out infinite;
                }

                @keyframes button-pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .animate-button-pop {
                    animation: button-pop 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default Home; // Export as Home for Next.js page component
