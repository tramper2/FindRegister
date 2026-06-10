#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 FindRegister 배포 프로세스를 시작합니다..."

# Git 초기화 여부 확인 및 리모컨 추가
if [ ! -d .git ]; then
    git init
    echo "Initialized empty Git repository."
fi

# 원격 저장소가 설정되어 있지 않다면 추가
if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin git@github.com:tramper2/FindRegister.git
    echo "Added remote origin: git@github.com:tramper2/FindRegister.git"
fi

# main 브랜치로 전환 및 강제 생성
git checkout -B main

# 배포할 필수 소스 파일 추가
echo "📦 스테이징 영역에 파일들을 추가하는 중..."
git add index.html style.css app.js calculator.js package.json README.md Doc/ deploy.sh

# 커밋 생성 (변경사항이 없으면 넘어감)
echo "💾 커밋 작성 중..."
git commit -m "Deploy: Resistor Finder Web App release" || echo "⚠️ 변경사항이 없어 커밋 생략함"

# main 브랜치 원격 저장소에 푸시
echo "📤 원격 저장소의 main 브랜치에 푸시 중..."
git push -u origin main --force

# gh-pages 브랜치 로컬 생성 및 원격 저장소 강제 푸시
echo "🌎 gh-pages 브랜치 생성 및 웹사이트 푸시 중..."
git branch -D gh-pages >/dev/null 2>&1 || true
git checkout -b gh-pages
git push -u origin gh-pages --force

# 작업 편의를 위해 main 브랜치로 복귀
git checkout main

echo "✨ 배포가 완료되었습니다!"
echo "웹사이트 주소: https://tramper2.github.io/FindRegister/"
