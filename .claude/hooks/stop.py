#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
import random
import subprocess
import logging
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# Setup logging
def setup_logging():
    """Setup logging for TTS debugging."""
    log_dir = Path.cwd() / "logs"
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / "tts_debug.log"
    
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stderr)  # Also log to stderr for immediate visibility
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()


def get_completion_messages():
    """Return list of friendly completion messages."""
    return [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Job complete!",
        "Ready for next task!"
    ]


def get_tts_script_path():
    """
    Determine which TTS script to use based on available API keys.
    Priority order: ElevenLabs > OpenAI > pyttsx3
    """
    logger.info("Starting TTS script path determination")
    
    # Get current script directory and construct utils/tts path
    script_dir = Path(__file__).parent
    tts_dir = script_dir / "utils" / "tts"
    logger.debug(f"TTS directory: {tts_dir}")
    logger.debug(f"TTS directory exists: {tts_dir.exists()}")
    
    # Check for ElevenLabs API key (highest priority)
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')
    logger.debug(f"ElevenLabs API key present: {bool(elevenlabs_key)}")
    if elevenlabs_key:
        elevenlabs_script = tts_dir / "elevenlabs_tts.py"
        logger.debug(f"ElevenLabs script path: {elevenlabs_script}")
        logger.debug(f"ElevenLabs script exists: {elevenlabs_script.exists()}")
        if elevenlabs_script.exists():
            logger.info(f"Selected ElevenLabs TTS script: {elevenlabs_script}")
            return str(elevenlabs_script)
    
    # Check for OpenAI API key (second priority)
    openai_key = os.getenv('OPENAI_API_KEY')
    logger.debug(f"OpenAI API key present: {bool(openai_key)}")
    if openai_key:
        openai_script = tts_dir / "openai_tts.py"
        logger.debug(f"OpenAI script path: {openai_script}")
        logger.debug(f"OpenAI script exists: {openai_script.exists()}")
        if openai_script.exists():
            logger.info(f"Selected OpenAI TTS script: {openai_script}")
            return str(openai_script)
    
    # Fall back to pyttsx3 (no API key required)
    pyttsx3_script = tts_dir / "pyttsx3_tts.py"
    logger.debug(f"pyttsx3 script path: {pyttsx3_script}")
    logger.debug(f"pyttsx3 script exists: {pyttsx3_script.exists()}")
    if pyttsx3_script.exists():
        logger.info(f"Selected pyttsx3 TTS script: {pyttsx3_script}")
        return str(pyttsx3_script)
    
    logger.warning("No TTS scripts found or available")
    return None


def get_llm_completion_message():
    """
    Generate completion message using available LLM services.
    Priority order: OpenAI > Anthropic > fallback to random message
    
    Returns:
        str: Generated or fallback completion message
    """
    # Get current script directory and construct utils/llm path
    script_dir = Path(__file__).parent
    llm_dir = script_dir / "utils" / "llm"
    
    # Try OpenAI first (highest priority)
    if os.getenv('OPENAI_API_KEY'):
        oai_script = llm_dir / "oai.py"
        if oai_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(oai_script), "--completion"
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except (subprocess.TimeoutExpired, subprocess.SubprocessError):
                pass
    
    # Try Anthropic second
    if os.getenv('ANTHROPIC_API_KEY'):
        anth_script = llm_dir / "anth.py"
        if anth_script.exists():
            try:
                result = subprocess.run([
                    "uv", "run", str(anth_script), "--completion"
                ], 
                capture_output=True,
                text=True,
                timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    return result.stdout.strip()
            except (subprocess.TimeoutExpired, subprocess.SubprocessError):
                pass
    
    # Fallback to random predefined message
    messages = get_completion_messages()
    return random.choice(messages)

def announce_completion():
    """Announce completion using the best available TTS service."""
    logger.info("Starting TTS completion announcement")
    
    try:
        # Get TTS script path
        tts_script = get_tts_script_path()
        if not tts_script:
            logger.error("No TTS scripts available - cannot announce completion")
            return
        
        # Get completion message (LLM-generated or fallback)
        logger.info("Getting completion message")
        completion_message = get_llm_completion_message()
        logger.info(f"Completion message: '{completion_message}'")
        
        # Prepare TTS command
        tts_command = ["uv", "run", tts_script, completion_message]
        logger.info(f"Executing TTS command: {' '.join(tts_command)}")
        
        # Call the TTS script with the completion message
        result = subprocess.run(
            tts_command,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # Log the results
        logger.info(f"TTS command return code: {result.returncode}")
        if result.stdout:
            logger.info(f"TTS stdout: {result.stdout}")
        if result.stderr:
            logger.warning(f"TTS stderr: {result.stderr}")
            
        if result.returncode == 0:
            logger.info("TTS completion announcement successful")
        else:
            logger.error(f"TTS command failed with return code {result.returncode}")
        
    except subprocess.TimeoutExpired:
        logger.error("TTS command timed out after 10 seconds")
    except subprocess.SubprocessError as e:
        logger.error(f"TTS subprocess error: {e}")
    except FileNotFoundError as e:
        logger.error(f"TTS file not found error: {e}")
    except Exception as e:
        logger.error(f"Unexpected TTS error: {e}", exc_info=True)


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)

        # Ensure log directory exists
        log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "stop.json")

        # Read existing log data or initialize empty list
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        # Handle --chat switch
        if args.chat and 'transcript_path' in input_data:
            transcript_path = input_data['transcript_path']
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines
                    
                    # Write to logs/chat.json
                    chat_file = os.path.join(log_dir, 'chat.json')
                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                except Exception:
                    pass  # Fail silently

        # Announce completion via TTS
        announce_completion()

        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)


if __name__ == "__main__":
    main()
