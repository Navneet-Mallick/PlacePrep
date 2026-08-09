"""
Lightweight API for resume analysis with Gemini recommendations.

Usage:
    pip install fastapi uvicorn python-multipart
    python ml/api/server.py
"""

import sys
import tempfile
import subprocess
from pathlib import Path
from pydantic import BaseModel

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from analyze_resume import analyze_file, analyze_text
from evaluate_technical_answer import score_answer

# Try to import proctoring (optional, requires YOLO/torch)
try:
    from proctoring import check_proctoring, reset_proctoring_state
    PROCTORING_AVAILABLE = True
except ImportError as e:
    print(f"Proctoring module not available: {e}")
    PROCTORING_AVAILABLE = False

    def check_proctoring(image):
        return {
            "status": "error",
            "message": "Proctoring system not available (missing dependencies)",
            "face_count": 0,
            "severity": "unknown",
        }

    def reset_proctoring_state():
        return {"status": "error", "message": "Proctoring not available"}

# Pydantic models
class TechnicalEvaluationRequest(BaseModel):
    user_answer: str
    reference_answer: str

class PythonCodeRequest(BaseModel):
    code: str
    input_data: str = ""

class ProctoringRequest(BaseModel):
    image: str  # Base64 encoded image

app = FastAPI(title="PlacementPrep ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "ML API is running"}


@app.post("/api/resume/analyze")
async def analyze_resume(
    resume: UploadFile = File(None),
    text: str = Form(None),
):
    """Analyze a resume from file or text"""
    try:
        if resume and resume.filename:
            suffix = Path(resume.filename).suffix.lower()
            if suffix not in {".pdf", ".docx"}:
                return {"error": "Only PDF and DOCX files are supported."}

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                content = await resume.read()
                if not content:
                    return {"error": "Resume file is empty"}
                tmp.write(content)
                tmp_path = Path(tmp.name)

            try:
                result = analyze_file(tmp_path)
                return result
            except Exception as e:
                print(f"Error analyzing file: {e}")
                return {
                    "error": f"Failed to analyze resume: {str(e)}",
                    "resume_score": 0,
                    "predicted_role": "Unknown",
                    "entities": {}
                }
            finally:
                tmp_path.unlink(missing_ok=True)

        elif text and text.strip():
            result = analyze_text(text.strip(), use_gemini=True)
            return result
        else:
            return {"error": "Please provide either a resume file or text"}
    
    except Exception as e:
        print(f"Resume analysis endpoint error: {e}")
        return {
            "error": f"Server error: {str(e)}",
            "resume_score": 0,
            "predicted_role": "Unknown",
            "entities": {}
        }


@app.post("/api/technical/evaluate")
async def evaluate_technical(request: TechnicalEvaluationRequest):
    """Evaluate a technical answer using TF-IDF + cosine similarity"""
    try:
        result = score_answer(request.user_answer, request.reference_answer)
        
        # Generate feedback based on score
        score = result["score"]
        if score >= 80:
            feedback = "Excellent! Your answer covers the key concepts."
        elif score >= 60:
            feedback = "Good answer. You captured the main ideas but could be more comprehensive."
        elif score >= 40:
            feedback = "Fair attempt. Review the reference answer to understand better."
        else:
            feedback = "Your answer needs improvement. Study the reference answer carefully."
        
        return {
            "score": score,
            "similarity": result["similarity"],
            "feedback": feedback
        }
    except Exception as e:
        return {"error": f"Error evaluating answer: {str(e)}", "score": 0}


@app.post("/api/python/execute")
async def execute_python(request: PythonCodeRequest):
    """Execute Python code safely with timeout"""
    try:
        # Create temporary Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(request.code)
            code_file = f.name
        
        try:
            # Execute with timeout of 5 seconds
            result = subprocess.run(
                [sys.executable, code_file],
                input=request.input_data,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            output = result.stdout
            error = result.stderr
            
            return {
                "success": result.returncode == 0,
                "output": output,
                "error": error,
                "return_code": result.returncode
            }
        finally:
            Path(code_file).unlink(missing_ok=True)
    
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": "",
            "error": "Execution timeout: Code took too long to run (max 5 seconds)",
            "return_code": -1
        }
    except Exception as e:
        return {
            "success": False,
            "output": "",
            "error": f"Error executing code: {str(e)}",
            "return_code": -1
        }


@app.post("/api/proctoring/check")
async def check_proctoring_frame(request: ProctoringRequest):
    """
    Analyse one webcam frame for proctoring violations.

    Detects no face, multiple faces, and off-centre gaze. Conditions must
    persist across several frames before escalating to a violation, so
    blinks and brief head turns do not create false positives.
    """
    try:
        return check_proctoring(request.image)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Proctoring check failed: {str(e)}",
            "face_count": 0,
            "severity": "unknown",
        }


@app.post("/api/proctoring/reset")
async def reset_proctoring():
    """Clear proctoring streak counters. Call when a new test begins."""
    try:
        return reset_proctoring_state()
    except Exception as e:
        return {"status": "error", "message": str(e)}


class AptitudeLevelRequest(BaseModel):
    total_score: int
    accuracy_percent: float
    time_taken: int
    quant_score: int
    logical_score: int
    technical_score: int


@app.post("/api/aptitude/predict-level")
async def predict_aptitude_level_endpoint(request: AptitudeLevelRequest):
    """Predict aptitude level using Random Forest"""
    try:
        import joblib
        model_path = SCRIPTS_DIR.parent / "models" / "aptitude_level_classifier.joblib"
        
        if model_path.exists():
            model = joblib.load(model_path)
            import numpy as np
            features = np.array([[
                request.total_score,
                request.accuracy_percent,
                request.time_taken,
                request.quant_score,
                request.logical_score,
                request.technical_score
            ]])
            
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            
            labels = ['beginner', 'intermediate', 'advanced']
            level = labels[int(prediction)]
            confidence = float(probabilities.max())
            
            return {
                'level': level,
                'confidence': confidence,
                'method': 'random_forest'
            }
        else:
            raise FileNotFoundError("Model not found")
            
    except Exception as e:
        # Fallback to threshold
        if request.total_score >= 80:
            level = 'advanced'
        elif request.total_score >= 60:
            level = 'intermediate'
        else:
            level = 'beginner'
        
        return {
            'level': level,
            'confidence': 0.75,
            'method': 'fallback',
            'error': str(e)
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
