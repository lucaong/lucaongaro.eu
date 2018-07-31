#!/usr/bin/env bash
set -e

if output=$(git status --porcelain) && [ -z "$output" ]; then
  exit 0
else 
  echo "Working directory is not clean, commimt or stash changes before proceeding."
  exit 1
fi
