from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
import cv2
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})

MODEL_PATH = os.path.join('models', 'age_progression_model.pth')
os.makedirs('uploads', exist_ok=True)

# --- Model Definition ---
class AgeProgressionModel(nn.Module):
    def __init__(self):
        super(AgeProgressionModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(128 * 32 * 32, 512)
        self.fc2 = nn.Linear(512, 68 * 2)

    def forward(self, x):
        x = torch.relu(self.pool(self.conv1(x)))
        x = torch.relu(self.pool(self.conv2(x)))
        x = torch.relu(self.pool(self.conv3(x)))
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# --- Load model ---
model = AgeProgressionModel()
model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
model.eval()

# --- Transform ---
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- Aging Effect Function ---
def apply_aging_effects(image_pil: Image.Image) -> Image.Image:
    img_cv = np.array(image_pil)
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
    h, w = img_cv.shape[:2]

    # === Simulate greying hair ===
    hair_overlay = img_cv.copy()
    cv2.rectangle(hair_overlay, (0, 0), (w, h // 4), (200, 200, 200), -1)
    img_cv = cv2.addWeighted(img_cv, 1.0, hair_overlay, 0.25, 0)

    # === Draw wrinkles (face area) ===
    wrinkle_color = (45, 45, 45)
    for y in range(h // 3, h // 2, 8):
        start = (int(w * 0.35), y)
        end = (int(w * 0.65), y)
        cv2.line(img_cv, start, end, wrinkle_color, 1)

    for x in range(int(w * 0.4), int(w * 0.6), 10):
        start = (x, int(h * 0.48))
        end = (x, int(h * 0.52))
        cv2.line(img_cv, start, end, wrinkle_color, 1)

    # === Reduce color saturation (skin dullness) ===
    img_hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
    img_hsv[..., 1] = (img_hsv[..., 1] * 0.6).astype(np.uint8)
    img_cv = cv2.cvtColor(img_hsv, cv2.COLOR_HSV2BGR)

    # Return back as PIL
    img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img_rgb)

# --- Predict Route ---
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join('uploads', filename)
    file.save(file_path)

    try:
        original_image = Image.open(file_path).convert('RGB')
        input_tensor = transform(original_image).unsqueeze(0)
        with torch.no_grad():
            _ = model(input_tensor)

        aged_image = apply_aging_effects(original_image)

        temp_file = io.BytesIO()
        aged_image.save(temp_file, format='JPEG')
        temp_file.seek(0)
        os.remove(file_path)
        return send_file(temp_file, mimetype='image/jpeg', as_attachment=True, download_name='future_image.jpg')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Run ---
if __name__ == '__main__':
    app.run(debug=True, port=5002)
