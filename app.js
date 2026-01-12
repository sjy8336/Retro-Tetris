const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.static('public'));

// 서버 메모리에 상주하는 랭킹 데이터
let highScores = [
    { id: 1, nickname: "TetrisKing", score: 5500, date: "2024-05-20" },
    { id: 2, nickname: "CS_Student", score: 3200, date: "2024-05-21" },
    { id: 3, nickname: "BlockMaster", score: 2800, date: "2024-05-22" },
    { id: 4, nickname: "LineEraser", score: 2400, date: "2024-05-23" },
    { id: 5, nickname: "GridWarrior", score: 2000, date: "2024-05-24" }
];

let nextId = 6;

// GET /api/scores: 전체 랭킹 데이터 반환 (TOP 10)
app.get('/api/scores', (req, res) => {
    // 점수순으로 정렬 (높은 순)
    const sortedScores = [...highScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    res.json(sortedScores);
});

// POST /api/scores: 새로운 점수 저장
app.post('/api/scores', (req, res) => {
    const { nickname, score } = req.body;
    
    // 유효성 검사
    if (!nickname || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ 
            error: 'Invalid data. nickname and score (number) are required.' 
        });
    }
    
    // 새 점수 추가
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    const newScore = {
        id: nextId++,
        nickname: nickname.trim(),
        score: Math.floor(score),
        date: today
    };
    
    highScores.push(newScore);
    
    // 점수순으로 정렬
    highScores.sort((a, b) => b.score - a.score);
    
    // TOP 10만 유지 (선택사항)
    if (highScores.length > 100) {
        highScores = highScores.slice(0, 100);
    }
    
    // 업데이트된 TOP 10 반환
    const topScores = highScores.slice(0, 10);
    res.json({ 
        success: true, 
        message: 'Score saved successfully',
        topScores 
    });
});

// DELETE /api/scores/:id: 특정 점수 기록 삭제 (관리자용)
app.delete('/api/scores/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = highScores.length;
    
    highScores = highScores.filter(score => score.id !== id);
    
    if (highScores.length < initialLength) {
        res.json({ 
            success: true, 
            message: 'Score deleted successfully',
            topScores: highScores.slice(0, 10)
        });
    } else {
        res.status(404).json({ error: 'Score not found' });
    }
});

// 루트 경로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🎮 Retro Tetris Connect 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
