# 📁 backend/story_generator.py

import os
import io
import torch
from flask import Flask, request, jsonify
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ✅ Load model + processor (once)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "./caption_model"

processor = BlipProcessor.from_pretrained(MODEL_PATH)
model = BlipForConditionalGeneration.from_pretrained(MODEL_PATH).to(DEVICE)
model.eval()

# ✅ Mood prompts
MOOD_PROMPTS = {
    "neutral": "",
    "happy": "Write a cheerful story about this image:",
    "sad": "Describe this image with a touch of sadness:",
    "adventurous": "Imagine an adventurous tale based on this picture:",
    "mysterious": "Tell a mysterious story from this photo:"
}

@app.route("/generate_story", methods=["POST"])
def generate_story():
    if 'image' not in request.files:
        return jsonify({"error": "Missing image file"}), 400

    try:
        mood = request.form.get('mood', 'neutral')
        prompt = MOOD_PROMPTS.get(mood, "")

        image_file = request.files['image']
        image = Image.open(image_file.stream).convert("RGB")

        inputs = processor(image, prompt, return_tensors="pt").to(DEVICE)

        with torch.no_grad():
            output_ids = model.generate(**inputs, max_length=100)
            story = processor.decode(output_ids[0], skip_special_tokens=True)

        return jsonify({"story": story})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)
