import cv2
import numpy as np
from transformers import pipeline
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class EmotionPipeline:
    def __init__(self):
        # Initialize OpenCV Haar Cascade for Face Detection (more stable on Windows/Python 3.13)
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize HuggingFace Emotion Model
        # using 'trpakov/vit-face-expression' as recommended for image-based emotion
        try:
            self.emotion_classifier = pipeline(
                "image-classification", 
                model="trpakov/vit-face-expression", 
                device=-1 # CPU for local fallback
            )
            logger.info("Loaded ViT Emotion model")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            self.emotion_classifier = None

    async def process_frame(self, image_bytes: bytes):
        """
        Process incoming byte frame:
        1. Decode image bytes back into OpenCV array
        2. OpenCV detect face 
        3. Crop face
        4. Pass face to ViT
        5. Return structured emotion/presence dict
        """
        result = {
            "face_detected": False,
            "eye_focus": False, # Future phase calculation
            "emotion": "neutral",
            "confidence": 0.0
        }

        try:
            # Decode bytes to numpy image
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return result

            # OpenCV Haar cascades need grayscale
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray_frame, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )

            if len(faces) > 0:
                result["face_detected"] = True
                result["eye_focus"] = True # Simplified placeholder for eye focus based on frontal face
                
                # Get the largest face
                # faces is a list of (x, y, w, h)
                x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
                
                ih, iw, _ = frame.shape
                
                # Pad bounding box slightly to capture full face
                margin_y = int(h * 0.2)
                margin_x = int(w * 0.2)
                
                x_min = max(0, x - margin_x)
                y_min = max(0, y - margin_y)
                x_max = min(iw, x + w + margin_x)
                y_max = min(ih, y + h + margin_y)

                # Use original color frame for emotion model
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                cropped_face = rgb_frame[y_min:y_max, x_min:x_max]
                
                if cropped_face.size > 0 and self.emotion_classifier:
                    # Convert to PIL Image for Transformers
                    pil_img = Image.fromarray(cropped_face)
                    
                    # Run inference
                    emotions = self.emotion_classifier(pil_img)
                    
                    # Highest score emotion
                    best_emotion = emotions[0]
                    result["emotion"] = best_emotion["label"].lower()
                    result["confidence"] = float(best_emotion["score"])
                    
        except Exception as e:
            logger.error(f"Error in EmotionPipeline process_frame: {e}")

        return result

emotion_pipeline = EmotionPipeline()
