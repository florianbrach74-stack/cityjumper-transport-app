#!/bin/bash

echo "📊 SESSION STATISTIK - 26. November 2025"
echo "========================================"
echo ""

# Git Commits heute
echo "📝 GIT COMMITS:"
git log --since="2025-11-26 00:00" --until="2025-11-26 23:59" --oneline | wc -l | xargs echo "   Commits heute:"
echo ""

# Geänderte Dateien
echo "📁 GEÄNDERTE DATEIEN:"
git diff --stat $(git log --since="2025-11-26 00:00" --format=%H | tail -1) HEAD | tail -1
echo ""

# Detaillierte Datei-Liste
echo "📄 BEARBEITETE DATEIEN (Top 20):"
git log --since="2025-11-26 00:00" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20
echo ""

# Code-Statistik
echo "💻 CODE-ÄNDERUNGEN:"
git diff --shortstat $(git log --since="2025-11-26 00:00" --format=%H | tail -1) HEAD
echo ""

# Neue Dateien
echo "🆕 NEUE DATEIEN:"
git log --since="2025-11-26 00:00" --diff-filter=A --name-only --pretty=format: | sort | uniq | wc -l | xargs echo "   Anzahl:"
echo ""

# Sprachen-Verteilung
echo "🌐 SPRACHEN-VERTEILUNG:"
find client/src server -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.sql" -o -name "*.md" \) 2>/dev/null | wc -l | xargs echo "   JavaScript/React/SQL/MD Dateien:"
echo ""

# Zeilen pro Sprache
echo "📏 ZEILEN CODE (geschätzt):"
find client/src -name "*.jsx" -o -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print "   Frontend: " $1 " Zeilen"}'
find server -name "*.js" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print "   Backend: " $1 " Zeilen"}'
find . -name "*.sql" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print "   SQL: " $1 " Zeilen"}'
echo ""

# Test-Dateien
echo "🧪 TEST-DATEIEN:"
find . -name "test-*.js" -o -name "*-test.js" 2>/dev/null | wc -l | xargs echo "   Anzahl:"
echo ""

# Migrations
echo "🗄️ DATENBANK-MIGRATIONEN:"
find migrations -name "*.sql" 2>/dev/null | wc -l | xargs echo "   Anzahl:"
echo ""

# Dokumentation
echo "📚 DOKUMENTATION:"
find . -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | xargs echo "   Markdown-Dateien:"
echo ""

