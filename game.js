// ===== 게임 상수 정의 =====
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30; // 픽셀

// ===== 테트리스 블록 정의 (테트로미노) =====
const TETROMINOES = {
    I: {
        shape: [
            [1, 1, 1, 1]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#f0a000'
    }
};

// ===== 게임 상태 =====
let gameBoard = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
let currentPiece = null;
let currentPieceX = 0;
let currentPieceY = 0;
let nextPiece = null;
let holdPiece = null;
let canHold = true; // 블록을 한 번만 보관할 수 있도록 제어
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let dropTime = 0;
let lastTime = 0;
let dropInterval = 1000; // 밀리초

// ===== Canvas 요소 =====
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdPiece');
const holdCtx = holdCanvas.getContext('2d');

// ===== DOM 요소 =====
const scoreElement = document.getElementById('currentScore');
const levelElement = document.getElementById('currentLevel');
const linesElement = document.getElementById('linesCleared');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const nicknameInput = document.getElementById('nickname');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const cancelBtn = document.getElementById('cancelBtn');

// ===== 유틸리티 함수 =====
function getRandomPiece() {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        shape: TETROMINOES[randomPiece].shape.map(row => [...row]),
        color: TETROMINOES[randomPiece].color
    };
}

function rotatePiece(piece) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            rotated[j][rows - 1 - i] = piece.shape[i][j];
        }
    }
    
    return {
        shape: rotated,
        color: piece.color
    };
}

function isValidMove(piece, x, y) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                // 보드 경계 체크
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return false;
                }
                
                // 기존 블록과 충돌 체크
                if (newY >= 0 && gameBoard[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece(piece, x, y) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const boardY = y + row;
                const boardX = x + col;
                if (boardY >= 0) {
                    gameBoard[boardY][boardX] = piece.color;
                }
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (gameBoard[row].every(cell => cell !== 0)) {
            gameBoard.splice(row, 1);
            gameBoard.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            row++; // 같은 줄을 다시 체크
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        // 점수 계산: 라인당 100 * 레벨
        score += linesCleared * 100 * level;
        // 레벨 증가 (10줄마다)
        level = Math.floor(lines / 10) + 1;
        // 드롭 속도 증가
        dropInterval = Math.max(100, 1000 - (level - 1) * 50);
        
        updateUI();
    }
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // 블록 테두리
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // 하이라이트 효과
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 3, BLOCK_SIZE / 3);
}

function drawGhostBlock(ctx, x, y, color) {
    // 반투명 배경
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // 테두리만 더 진하게
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // 투명도 원래대로
    ctx.globalAlpha = 1.0;
}

function getGhostY() {
    if (!currentPiece) return currentPieceY;
    
    let ghostY = currentPieceY;
    while (isValidMove(currentPiece, currentPieceX, ghostY + 1)) {
        ghostY++;
    }
    return ghostY;
}

function drawBoard() {
    // 보드 초기화
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 그리드 그리기
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // 보드의 블록 그리기
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (gameBoard[row][col]) {
                drawBlock(ctx, col, row, gameBoard[row][col]);
            }
        }
    }
    
    // Ghost piece (블록이 내려갈 위치 미리보기)
    if (currentPiece && !gamePaused) {
        const ghostY = getGhostY();
        if (ghostY > currentPieceY) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const x = currentPieceX + col;
                        const y = ghostY + row;
                        if (y >= 0) {
                            drawGhostBlock(ctx, x, y, currentPiece.color);
                        }
                    }
                }
            }
        }
    }
    
    // 현재 블록 그리기
    if (currentPiece && !gamePaused) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const x = currentPieceX + col;
                    const y = currentPieceY + row;
                    if (y >= 0) {
                        drawBlock(ctx, x, y, currentPiece.color);
                    }
                }
            }
        }
    }
}

function drawHoldPiece() {
    holdCtx.fillStyle = '#0a0a0a';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    if (holdPiece) {
        const blockSize = 25;
        const offsetX = (holdCanvas.width - holdPiece.shape[0].length * blockSize) / 2;
        const offsetY = (holdCanvas.height - holdPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < holdPiece.shape.length; row++) {
            for (let col = 0; col < holdPiece.shape[row].length; col++) {
                if (holdPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    holdCtx.fillStyle = holdPiece.color;
                    holdCtx.fillRect(x, y, blockSize, blockSize);
                    holdCtx.strokeStyle = '#000';
                    holdCtx.lineWidth = 2;
                    holdCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
}

function drawNextPiece() {
    nextCtx.fillStyle = '#0a0a0a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const blockSize = 25;
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(x, y, blockSize, blockSize);
                    nextCtx.strokeStyle = '#000';
                    nextCtx.lineWidth = 2;
                    nextCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
}

function holdCurrentPiece() {
    if (!gameRunning || gamePaused || !currentPiece || !canHold) return;
    
    // 보관할 블록이 없으면 현재 블록을 보관하고 다음 블록을 가져옴
    if (!holdPiece) {
        holdPiece = {
            shape: currentPiece.shape.map(row => [...row]),
            color: currentPiece.color
        };
        currentPiece = nextPiece || getRandomPiece();
        nextPiece = getRandomPiece();
    } else {
        // 보관할 블록이 있으면 교체
        const temp = {
            shape: holdPiece.shape.map(row => [...row]),
            color: holdPiece.color
        };
        holdPiece = {
            shape: currentPiece.shape.map(row => [...row]),
            color: currentPiece.color
        };
        currentPiece = temp;
    }
    
    // 블록 위치 초기화
    currentPieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentPieceY = 0;
    
    // 게임 오버 체크
    if (!isValidMove(currentPiece, currentPieceX, currentPieceY)) {
        gameOver();
        return;
    }
    
    canHold = false; // 한 번에 한 번만 보관 가능
    drawHoldPiece();
    drawNextPiece();
}

function spawnPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    currentPieceX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentPieceY = 0;
    canHold = true; // 새로운 블록이 나오면 다시 보관 가능
    
    // 게임 오버 체크
    if (!isValidMove(currentPiece, currentPieceX, currentPieceY)) {
        gameOver();
        return;
    }
    
    drawNextPiece();
    drawHoldPiece();
}

function dropPiece() {
    if (!gameRunning || gamePaused || !currentPiece) return;
    
    if (isValidMove(currentPiece, currentPieceX, currentPieceY + 1)) {
        currentPieceY++;
    } else {
        // 블록을 고정
        placePiece(currentPiece, currentPieceX, currentPieceY);
        clearLines();
        spawnPiece();
    }
}

function movePiece(dx) {
    if (!gameRunning || gamePaused || !currentPiece) return;
    
    if (isValidMove(currentPiece, currentPieceX + dx, currentPieceY)) {
        currentPieceX += dx;
    }
}

function rotateCurrentPiece() {
    if (!gameRunning || gamePaused || !currentPiece) return;
    
    const rotated = rotatePiece(currentPiece);
    if (isValidMove(rotated, currentPieceX, currentPieceY)) {
        currentPiece = rotated;
    }
}

function hardDrop() {
    if (!gameRunning || gamePaused || !currentPiece) return;
    
    while (isValidMove(currentPiece, currentPieceX, currentPieceY + 1)) {
        currentPieceY++;
        score += 2; // 하드 드롭 보너스
    }
    placePiece(currentPiece, currentPieceX, currentPieceY);
    clearLines();
    spawnPiece();
    updateUI();
}

function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

function resetGame() {
    gameBoard = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    currentPiece = null;
    nextPiece = null;
    holdPiece = null;
    canHold = true;
    updateUI();
    drawHoldPiece();
    spawnPiece();
}

function gameOver() {
    gameRunning = false;
    pauseBtn.disabled = true;
    startBtn.disabled = false;
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
    nicknameInput.focus();
}

function startGame() {
    if (gameRunning) return;
    
    resetGame();
    gameRunning = true;
    gamePaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    dropTime = 0;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '재개' : '일시정지';
    
    if (!gamePaused) {
        lastTime = performance.now();
        gameLoop();
    }
}

function gameLoop(time = 0) {
    if (!gameRunning) return;
    
    if (gamePaused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropTime += deltaTime;
    
    if (dropTime > dropInterval) {
        dropPiece();
        dropTime = 0;
    }
    
    drawBoard();
    requestAnimationFrame(gameLoop);
}

// ===== 키보드 입력 처리 =====
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            dropPiece();
            score += 1; // 빠른 낙하 보너스
            updateUI();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotateCurrentPiece();
            break;
        case ' ': // Space
            e.preventDefault();
            pauseGame();
            break;
        case 'c':
        case 'C':
            e.preventDefault();
            holdCurrentPiece();
            break;
        case 's':
        case 'S':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                return;
            }
            hardDrop();
            break;
    }
});

// ===== 버튼 이벤트 =====
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);

cancelBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    nicknameInput.value = '';
});

saveScoreBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    
    if (!nickname) {
        alert('닉네임을 입력해주세요!');
        return;
    }
    
    try {
        // 점수 저장
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname: nickname,
                score: score
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 랭킹 업데이트
            await loadRanking();
            gameOverModal.classList.add('hidden');
            nicknameInput.value = '';
            alert('점수가 저장되었습니다! 🎉');
        } else {
            alert('점수 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error saving score:', error);
        alert('점수 저장 중 오류가 발생했습니다.');
    }
});

// Enter 키로 점수 저장
nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveScoreBtn.click();
    }
});

// ===== API 연동: 랭킹 로드 =====
async function loadRanking() {
    try {
        const response = await fetch('/api/scores');
        const scores = await response.json();
        
        const rankingList = document.getElementById('rankingList');
        
        if (scores.length === 0) {
            rankingList.innerHTML = '<p>아직 랭킹이 없습니다.</p>';
            return;
        }
        
        rankingList.innerHTML = scores.map((item, index) => {
            const rankClass = index === 0 ? 'rank-top' : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            return `
                <div class="ranking-item ${rankClass}">
                    <div class="rank-number">${medal} ${index + 1}</div>
                    <div class="rank-info">
                        <div class="rank-nickname">${escapeHtml(item.nickname)}</div>
                        <div class="rank-date">${item.date}</div>
                    </div>
                    <div class="rank-score">${item.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading ranking:', error);
        document.getElementById('rankingList').innerHTML = '<p>랭킹을 불러올 수 없습니다.</p>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 초기화 =====
drawBoard();
drawHoldPiece();
loadRanking();
