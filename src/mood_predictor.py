from flask import Flask, request, jsonify
import pickle
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load artifacts
MODEL_PATH = 'models/mood_model.h5'
TOKENIZER_PATH = 'models/tokenizer.pkl'
ENCODER_PATH = 'models/label_encoder.pkl'

try:
    model = load_model(MODEL_PATH)
    with open(TOKENIZER_PATH, 'rb') as f:
        tokenizer = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        label_encoder = pickle.load(f)
    logger.info("Model and artifacts loaded successfully")
except Exception as e:
    logger.error(f"Error loading model or artifacts: {str(e)}")
    raise

MAX_LEN = 100
LABEL_MAP = {
    0: "sadness 😢",
    1: "joy 😊", 
    2: "love ❤️",
    3: "anger 😠",
    4: "fear 😨",
    5: "surprise 😲"
}

def convert_numpy_types(obj):
    """Recursively convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(v) for v in obj]
    return obj

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing text input"}), 400

        text = data["text"].strip()
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400

        sequence = tokenizer.texts_to_sequences([text])
        if not sequence or not sequence[0]:
            return jsonify({"error": "Unable to tokenize text"}), 400

        padded = pad_sequences(sequence, maxlen=MAX_LEN)
        probs = model.predict(padded, verbose=0)[0]

        predicted_index = np.argmax(probs)
        predicted_label = label_encoder.inverse_transform([predicted_index])[0]

        response = {
            "emotion": LABEL_MAP.get(predicted_index, "unknown"),
            "confidence": probs[predicted_index],
            "probabilities": {
                LABEL_MAP.get(i, "unknown"): prob 
                for i, prob in enumerate(probs)
            }
        }

        # Convert numpy types to native Python types
        response = convert_numpy_types(response)

        return jsonify(response)

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)