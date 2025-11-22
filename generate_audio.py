"""
Audio Generation Script for PharmaDS English Listening Tool
Uses Edge TTS to generate British English audio for all lessons
"""

import edge_tts
import asyncio
import json
import os

# Configuration
VOICE = "en-GB-SoniaNeural"  # British English female voice
# Alternative voices:
# "en-GB-RyanNeural" - British English male voice
# "en-GB-LibbyNeural" - British English young female voice

async def generate_audio(text, output_file, voice=VOICE):
    """Generate audio file from text using Edge TTS"""
    print(f"Generating audio: {output_file}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)
    print(f"✓ Saved: {output_file}")

async def main():
    """Generate audio files for all lessons in scripts.json"""
    
    # Create audio directory if it doesn't exist
    os.makedirs("assets/audio", exist_ok=True)
    
    # Load lessons from JSON
    with open('content/scripts.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"\n=== Generating Audio for {len(data['lessons'])} Lessons ===\n")
    
    # Generate audio for each lesson
    for lesson in data['lessons']:
        output_path = f"assets/audio/lesson{lesson['id']}.mp3"
        print(f"Lesson {lesson['id']}: {lesson['title']}")
        await generate_audio(lesson['text'], output_path, VOICE)
        print()
    
    print("=== All audio files generated successfully! ===\n")

if __name__ == "__main__":
    # Check if edge-tts is installed
    try:
        import edge_tts
        asyncio.run(main())
    except ImportError:
        print("Error: edge-tts is not installed.")
        print("Please install it with: pip install edge-tts")
        print("Then run this script again.")