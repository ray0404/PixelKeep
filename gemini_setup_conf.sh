#!/bin/bash

# --- User Configuration ---
# API Key - WARNING: Storing keys in plain text has security risks.
# Ensure this file/directory is not committed to public source control (e.g., using .gitignore).
GEMINI_API_KEY="AIzaSyC0gd9YRwnPadbjU-1SZneG026pAAJXfIw"
PREVIEW_FEATURES="true"

# --- File Paths ---
PROJECT_DIR="./.gemini"
SETTINGS_FILE="${PROJECT_DIR}/settings.json"
ENV_FILE="${PROJECT_DIR}/.env"

# --- 1. Setup Project Directory ---
echo "--- Setting up .gemini directory ---"
mkdir -p "${PROJECT_DIR}"
echo "Directory created: ${PROJECT_DIR}"

# --- 2. Configure API Key in .env file ---
# The Gemini CLI automatically reads the GEMINI_API_KEY from ./.gemini/.env
echo "--- Configuring API Key in .env file ---"
cat << EOF > "$ENV_FILE"
# This file is automatically loaded by the Gemini CLI for project-specific environment variables.
# WARNING: Ensure this file is ignored by your version control (e.g., in .gitignore).
GEMINI_API_KEY="${GEMINI_API_KEY}"
EOF
echo "API Key set in: $ENV_FILE"

# --- 3. Configure Settings in settings.json ---
echo "--- Configuring settings.json ---"

# 3a. Create the settings.json file if it doesn't exist
if [ ! -f "$SETTINGS_FILE" ]; then
    echo "Creating new settings file: $SETTINGS_FILE"
    echo "{}" > "$SETTINGS_FILE"
fi

# 3b. Use jq to set the 'previewFeatures' under the 'general' category
# The jq command ensures the structure is correct, creating the 'general' object if needed.
echo "Setting previewFeatures to '$PREVIEW_FEATURES'..."

jq --indent 4 \
    --arg value "$PREVIEW_FEATURES" \
    '.general |= (. + {previewFeatures: ($value | test("true"))})' \
    "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && \
mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

echo "Settings saved successfully to $SETTINGS_FILE."
echo "--- Configuration Complete ---"
echo "You can now run 'gemini' and the settings will be loaded."

