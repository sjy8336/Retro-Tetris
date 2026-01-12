# 🎮 Retro Tetris Connect

웹 기술 스택만으로 구현하는 실시간 데이터 연동 테트리스 게임

## 📋 프로젝트 개요

클래식 테트리스 게임을 웹 기술(HTML5 Canvas, JavaScript, Node.js Express)로 구현한 프로젝트입니다. 프론트엔드와 백엔드 간의 실시간 데이터 연동을 통해 점수를 저장하고 랭킹 시스템을 제공합니다.

## 🎯 주요 기능

- **테트리스 게임 플레이**
  - 7가지 테트로미노 블록 (I, O, T, S, Z, J, L)
  - 블록 이동, 회전, 빠른 낙하, 하드 드롭
  - 라인 클리어 및 점수 시스템
  - 레벨 시스템 (10줄마다 레벨 증가)
  - 다음 블록 미리보기

- **랭킹 시스템**
  - TOP 10 랭킹 표시
  - 게임 종료 시 점수 저장
  - 실시간 랭킹 업데이트

- **데이터 연동**
  - RESTful API를 통한 프론트-백엔드 통신
  - 서버 메모리 기반 데이터 저장 (DB 없이)
  - 2차원 배열 데이터 구조 활용

## 🛠 기술 스택

- **Frontend**
  - HTML5 Canvas
  - CSS3 (Flexbox, 다크 모드 테마)
  - Vanilla JavaScript (ES6+)

- **Backend**
  - Node.js
  - Express.js

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
npm start
```

또는

```bash
node app.js
```

### 3. 브라우저에서 접속

```
http://localhost:3000
```

## 🎮 조작법

- **← →** : 블록 좌우 이동
- **↑** : 블록 회전
- **↓** : 빠른 낙하 (보너스 점수 +1)
- **Space** : 일시정지/재개
- **S** : 하드 드롭 (즉시 바닥에 떨어뜨림, 보너스 점수)

## 📡 API 엔드포인트

### GET /api/scores
전체 랭킹 데이터를 JSON으로 반환 (TOP 10)

**응답 예시:**
```json
[
  { "id": 1, "nickname": "TetrisKing", "score": 5500, "date": "2024-05-20" },
  { "id": 2, "nickname": "CS_Student", "score": 3200, "date": "2024-05-21" }
]
```

### POST /api/scores
새로운 점수를 저장

**요청 본문:**
```json
{
  "nickname": "Player1",
  "score": 1500
}
```

**응답:**
```json
{
  "success": true,
  "message": "Score saved successfully",
  "topScores": [...]
}
```

### DELETE /api/scores/:id
특정 점수 기록 삭제 (관리자용)

## 📊 데이터 구조

### 서버 메모리 데이터 (highScores 배열)
```javascript
{
  id: Number,        // 고유 ID
  nickname: String,  // 플레이어 닉네임
  score: Number,     // 점수
  date: String       // 날짜 (YYYY-MM-DD)
}
```

### 게임 보드 (gameBoard 배열)
```javascript
// 20행 10열의 2차원 배열
// 0: 빈 칸
// String: 블록 색상 코드
```

## 🏗 프로젝트 구조

```
retro-tetris-connect/
├── app.js              # Express 서버
├── package.json        # 프로젝트 설정 및 의존성
├── README.md          # 프로젝트 문서
└── public/            # 정적 파일
    ├── index.html     # 메인 HTML
    ├── style.css      # 스타일시트
    └── game.js        # 게임 로직 및 API 연동
```

## 🎓 학습 목표

- 2차원 배열 데이터 구조 이해
- Canvas API를 활용한 게임 렌더링
- RESTful API 설계 및 구현
- 프론트엔드와 백엔드 간 데이터 통신 (Fetch API)
- 게임 로직 알고리즘 구현
- MVC 아키텍처 패턴 이해

## 📝 라이선스

MIT
