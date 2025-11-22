# 🎧 Pharmaceutical Data Science English Listening Tool

An interactive web application designed for pharmaceutical data science professionals to improve their technical English listening skills, with a focus on terminology used in companies like Shionogi.

## Features

- 📚 **5 Curated Lessons** covering MDM, SAS Viya, Snowflake, GxP, and Real-World Data
- 🎵 **British English Audio** with adjustable playback speed (0.75x - 2x)
- 📝 **Interactive Transcripts** for reading along
- 🔑 **Key Vocabulary Highlighting** for each lesson
- 📱 **Mobile-Friendly** responsive design
- 🌙 **Dark Mode Support** for comfortable viewing

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript
- No external dependencies - works completely offline after first load

## How to Use

1. Visit the live site: `https://YOUR_USERNAME.github.io/pharmads-english-listening/`
2. Select a lesson from the list
3. Click Play to start listening
4. Adjust playback speed as needed
5. Follow along with the transcript
6. Review key vocabulary terms

## Keyboard Shortcuts

- **Spacebar**: Play/Pause
- **Arrow Left**: Skip back 5 seconds
- **Arrow Right**: Skip forward 5 seconds
- **R**: Restart from beginning

## Adding New Lessons

1. Add lesson data to `content/scripts.json`
2. Generate audio file using Edge TTS:
   ```bash
   edge-tts --voice en-GB-SoniaNeural --text "Your text here" --write-media assets/audio/lessonX.mp3
   ```
3. Commit and push changes

## Development

To run locally:
1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server: `python -m http.server 8000`

## Audio Generation

Audio files are generated using [Edge TTS](https://github.com/rany2/edge-tts) with British English voices:
- Primary voice: `en-GB-SoniaNeural`
- Alternative: `en-GB-RyanNeural`

## License

Open source project for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit pull requests with:
- New lesson content
- UI improvements
- Bug fixes
- Additional features

## Acknowledgments

Built for the Shionogi Data Science Team to support global collaboration and technical English proficiency.