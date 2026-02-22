def calculate_engagement_score(face_detected: bool, eye_focus: bool, emotion: str) -> float:
    """
    Compute an engagement score out of 100 based on refined heuristics.
    """
    if not face_detected:
        return 0.0  # Cannot be engaged if not at the keyboard

    score = 30.0  # Base score for being present

    if eye_focus:
        score += 40.0 # High value for looking at screen

    # Emotion modifiers
    if emotion in ["happy", "surprise"]:
        score += 30.0  # Actively reacting
    elif emotion == "neutral":
        score += 15.0  # Paying attention but not reacting
    elif emotion in ["sad", "fear", "disgust"]:
        score += 5.0   # Present, but likely struggling or confused
    elif emotion == "angry":
        score -= 10.0  # Actively disengaged / frustrated
        
    # Cap between 0 and 100
    return max(0.0, min(100.0, score))
