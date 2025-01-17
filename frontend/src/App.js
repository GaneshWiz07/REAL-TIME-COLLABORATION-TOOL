// App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
    const [content, setContent] = useState('');
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    const [drawingHistory, setDrawingHistory] = useState([]);
    const [undoStack, setUndoStack] = useState([]);
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawingRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctxRef.current = ctx;
        resizeCanvas();
        // Set initial drawing styles
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        socket.on('updateContent', (updatedContent) => {
            setContent(updatedContent);
        });

        socket.on('updateStyleBold', (bold) => {
            setBold(bold);
        });

        socket.on('updateStyleItalic', (italic) => {
            setItalic(italic);
        });

        socket.on('updateStyleUnderline', (underline) => {
            setUnderline(underline);
        });

        socket.on('draw', (data) => {
            handleDraw(data);
        });

        socket.on('undo', () => {
            handleUndo();
        });

        socket.on('redo', () => {
            handleRedo();
        });

        socket.on('eraseAll', () => {
            handleEraseAll();
        });

        // Handle window resize
        window.addEventListener('resize', resizeCanvas);

        return () => {
            socket.off('updateContent');
            socket.off('updateStyleBold');
            socket.off('updateStyleItalic');
            socket.off('updateStyleUnderline');
            socket.off('draw');
            socket.off('undo');
            socket.off('redo');
            socket.off('eraseAll');
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.4; // Adjusted height for better responsiveness
    };

    const handleEdit = (event) => {
        const updatedContent = event.target.value;
        setContent(updatedContent);
        socket.emit('edit', updatedContent);
    };

    const handleBold = () => {
        const newBoldState = !bold;
        setBold(newBoldState);
        socket.emit('bold', newBoldState);
    };

    const handleItalic = () => {
        const newItalicState = !italic;
        setItalic(newItalicState);
        socket.emit('italic', newItalicState);
    };

    const handleUnderline = () => {
        const newUnderlineState = !underline;
        setUnderline(newUnderlineState);
        socket.emit('underline', newUnderlineState);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const startDrawing = ({ nativeEvent }) => {
        isDrawingRef.current = true;
        const { offsetX, offsetY } = nativeEvent;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
        socket.emit('draw', { type: 'begin', offsetX, offsetY });
    };

    const finishDrawing = () => {
        isDrawingRef.current = false;
        ctxRef.current.closePath();
        const history = [...drawingHistory, ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)];
        setDrawingHistory(history);
        setUndoStack([]);
        socket.emit('draw', { type: 'end' });
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawingRef.current) return;
        const { offsetX, offsetY } = nativeEvent;
        ctxRef.current.lineTo(offsetX, offsetY);
        ctxRef.current.stroke();
        socket.emit('draw', { type: 'draw', offsetX, offsetY });
    };

    const handleDraw = (data) => {
        const { type, offsetX, offsetY } = data;
        if (type === 'begin') {
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(offsetX, offsetY);
        } else if (type === 'draw') {
            ctxRef.current.lineTo(offsetX, offsetY);
            ctxRef.current.stroke();
        } else if (type === 'end') {
            ctxRef.current.closePath();
        }
    };

    const handleUndo = () => {
        if (drawingHistory.length === 0) return;
        const history = [...drawingHistory];
        const lastState = history.pop();
        setUndoStack([...undoStack, lastState]);
        setDrawingHistory(history);
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (history.length > 0) {
            ctxRef.current.putImageData(history[history.length - 1], 0, 0);
        }
    };

    const handleRedo = () => {
        if (undoStack.length === 0) return;
        const stack = [...undoStack];
        const nextState = stack.pop();
        setDrawingHistory([...drawingHistory, nextState]);
        setUndoStack(stack);
        ctxRef.current.putImageData(nextState, 0, 0);
    };

    const handleEraseAll = () => {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setDrawingHistory([]);
        setUndoStack([]);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-custom-gradient p-4">
                       
                        <h1><span id="title"><svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-credit-card-2-front" viewBox="0 0 16 16">
  <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
  <path d="M2 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5"/>
</svg>CoDraw</span>-Realtime Collaborative Editor</h1>
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    className={`px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-900 transition duration-300`}
                    onClick={handleBold}
                >
                    BOLD
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-900 transition duration-300`}
                    onClick={handleItalic}
                >
                    ITALIC
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-900 transition duration-300`}
                    onClick={handleUnderline}
                >
                    UNDERLINE
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 transition duration-300`}
                    onClick={handleDownload}
                >
                    DOWNLOAD
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-900 transition duration-300`}
                    onClick={handleUndo}
                >
                    UNDO
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-900 transition duration-300`}
                    onClick={handleRedo}
                >
                    REDO
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-900 transition duration-300`}
                    onClick={handleEraseAll}
                >
                    ERASE ALL
                </button>
            </div>
            <textarea
                value={content}
                onChange={handleEdit}
                rows={10}
                cols={50}
                className="w-full max-w-4xl p-4 mb-4  rounded-md bg-slate-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900 transition duration-300"
                style={{
                    fontWeight: bold ? 'bold' : 'normal',
                    fontStyle: italic ? 'italic' : 'normal',
                    textDecoration: underline ? 'underline' : 'none'
                }}
            />
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                className="border border-black mt-4 w-full max-w-4xl rounded-md bg-gray-200"
            />
        </div>
    );
}

export default App;