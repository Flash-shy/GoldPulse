#!/usr/bin/env bash
# GoldPulse — 按目录统计源码行数（后端 / Web / 移动端 / 共享包）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# 对 find 结果逐文件累加行数（避免 xargs 在部分环境下的限制）
sum_lines() {
  local total=0
  local n
  while IFS= read -r -d '' f; do
    n=$(wc -l <"$f" | tr -d ' ')
    total=$((total + n))
  done < <(find "$@" -print0 2>/dev/null)
  echo "$total"
}

be_lines=$(sum_lines backend -type f \( -name "*.py" -o -name "*.toml" \) \
  ! -path "*/.venv/*" ! -path "*/__pycache__/*")

we_lines=$(sum_lines apps/web -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*")

mo_lines=$(sum_lines apps/mobile -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.expo/*")

sh_lines=$(sum_lines packages/shared -type f -name "*.ts" \
  ! -path "*/node_modules/*")

total=$((be_lines + we_lines + mo_lines + sh_lines))

echo "GoldPulse 代码行数统计（不含 node_modules / .venv / .next 等）"
echo "────────────────────────────────────────"
printf "后端 (backend)\t%s\n" "$be_lines"
printf "Web (apps/web)\t%s\n" "$we_lines"
printf "移动端 (apps/mobile)\t%s\n" "$mo_lines"
printf "共享包 (packages/shared)\t%s\n" "$sh_lines"
echo "────────────────────────────────────────"
printf "合计\t%s\n" "$total"
echo ""

if command -v cloc >/dev/null 2>&1; then
  echo "可选：cloc 按语言细分："
  echo "  cloc backend apps/web apps/mobile packages/shared --exclude-dir=node_modules,.venv,.next,.expo,dist,build"
fi
