# 실행과 환경 설정

[프로젝트 소개](../README.md) · [환경변수 예시](../.env.example)

## 준비

- Node.js 20 이상, npm. 검증 환경은 Node.js 22.22.2입니다.
- 실행 중인 [공통 인증 서버](https://github.com/ho72/unified-auth-server)와 사용할 공통 계정
- 실제 코딩 작업을 수행할 Codex·Claude CLI 실행 파일과 해당 서버 계정의 인증 환경
- 에이전트가 작업할 프로젝트 디렉터리와 작업방 저장 위치

이 서버는 에이전트 CLI를 실행하는 웹 인터페이스입니다. 계정 인증 파일은 서버 환경에서 별도로 관리하고 저장소에 포함하지 않습니다.

## 설치

```bash
git clone https://github.com/ho72/ai-coding-workspace.git
cd ai-coding-workspace
npm ci
cp .env.example .env
```

## 필수 설정

| 환경변수 | 역할 |
| --- | --- |
| `HOST`, `PORT` | 기본 `127.0.0.1:4050` |
| `PUBLIC_ORIGIN` | 브라우저에서 접근할 웹 주소 |
| `DEVAI_SESSION_SECRET` | 32자 이상의 독립적인 세션 서명 키 |
| `UNIPASS_PUBLIC_ORIGIN` | 브라우저에서 접근할 공통 인증 서버 주소 |
| `UNIPASS_INTERNAL_ORIGIN` | 서버가 `/auth/me`를 호출할 공통 인증 서버 주소 |
| `DEVAI_ALLOWED_UNIPASS_IDS` | 접근을 허용할 공통 계정 ID. 쉼표로 구분 |
| `DEVAI_ALLOWED_UNIPASS_HANDLES`, `DEVAI_ALLOWED_UNIPASS_EMAILS` | ID 대신 또는 함께 사용할 허용 사용자 조건 |
| `DEVAI_DATA_DIR` | 작업방·이벤트·첨부파일·결과물을 저장할 디렉터리 |
| `DEVAI_HOME_DIR` | 에이전트 프로세스가 사용할 홈 디렉터리 |
| `DEVAI_DEFAULT_CWD` | 새 작업방의 기본 프로젝트 경로 |
| `DEVAI_ALLOWED_CWD_ROOTS` | 접근을 허용할 실제 디렉터리. 쉼표로 구분 |
| `DEVAI_CODEX_BIN`, `DEVAI_CLAUDE_BIN` | 에이전트 실행 파일명 또는 경로 |

세션 키가 없거나 32자 미만이면 서버가 시작하지 않습니다. 허용 사용자 조건도 하나 이상 필요합니다. 경로는 실행 전에 존재하는 디렉터리를 지정합니다. `.env.example`의 `.`은 로컬 예시이며, 실제 서버에서는 프로젝트·데이터·에이전트 계정 환경에 맞춰 설정합니다.

공통 인증 서버의 `DEVI_ORIGIN`은 `PUBLIC_ORIGIN`과 일치시킵니다. 로그인 콜백은 `/auth/callback`입니다. 서버는 공통 계정의 프로필과 허용 목록을 확인한 뒤 자체 세션을 생성합니다.

## 실행과 상태 확인

```bash
npm start
```

- 웹: `http://localhost:4050`
- 상태 확인: `http://localhost:4050/healthz`
- 개발 중 자동 재시작: `npm run dev`

실제 작업에 앞서 서버 계정에서 지정한 에이전트 실행 파일을 사용할 수 있는지 확인합니다. 현재 코드가 사용하는 실행 형태는 다음과 같습니다.

- Codex: `app-server --stdio`
- Claude: `--print --output-format stream-json` 및 세션 관련 인자

실행 파일의 버전·인증·모델 설정은 자신의 서버 환경에 맞춰 준비해야 합니다. 추가 인자는 `DEVAI_CODEX_EXTRA_ARGS`, `DEVAI_CLAUDE_EXTRA_ARGS`에 JSON 배열로 지정합니다. 계정 토큰이나 인증 파일의 내용을 추가 인자에 넣지 않습니다.

## 저장과 작업 범위

작업방과 대화·첨부파일은 `DEVAI_DATA_DIR` 아래에 저장합니다. 작업방 보관·복원·휴지통과 파일 정리 조건은 서버의 작업방 상태 및 보관 기간 설정을 따릅니다.

- 첨부 제한: `DEVAI_MAX_ATTACHMENT_BYTES`, `DEVAI_MAX_ATTACHMENTS_PER_TURN`
- 저장 용량: 작업방별·전체 첨부 용량 설정
- 보관 기간: `DEVAI_TRASH_RETENTION_DAYS`, `DEVAI_ORPHAN_RETENTION_HOURS`
- 파일 변경 확인: 작업 경로가 Git 저장소일 때 Git 상태·diff 비교를 활용

인증된 허용 사용자는 서버의 작업 경로에서 코딩 에이전트를 실행합니다. 실행 범위는 실제 서버 계정·에이전트 권한과 연결되며, 사용자별로 격리된 개발 컨테이너를 자동 생성하는 구조로 소개하지 않습니다.

## 테스트와 배포 예시

```bash
npm test
node --check src/server.js
node --check public/app.js
```

기존 테스트는 헬퍼 함수 15개 검증 항목입니다. 실제 모델 호출이나 CLI 계정 인증을 대신 검증하지 않습니다.

[devai.service](../devai.service)는 systemd 예시입니다. 실행 사용자·작업 디렉터리·환경 파일 경로를 자신의 서버에 맞춰 설정해야 합니다. 해당 systemd 배포는 이번 로컬 검증에서 실행하지 않았습니다.
