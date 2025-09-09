import argparse
import json
import os
from math import ceil
from typing import List, Literal, Optional

from agno.agent import Agent
from agno.media import Image
from agno.models.google import Gemini
from pydantic import BaseModel, Field, field_validator
import cv2

"""
WARNING: The API key is hardcoded below per user request. This is insecure for production.
"""

# Default media paths (used when no CLI arg is provided)
DEFAULT_IMAGE_PATH = './'
DEFAULT_VIDEO_PATH = './video.mp4'

# Set Google Gemini API key openly (user-requested; not recommended for production)
os.environ["GOOGLE_API_KEY"] = "AIzaSyAMaCTCpemNwOLu2nfUp9NQKiScTb0oVpw"


class CrowdAssessment(BaseModel):
    # Core assessments
    crowd_level: Literal["low", "medium", "high", "very_high"] = Field(
        ..., description="Qualitative crowd density level."
    )
    estimated_people: int = Field(
        ..., ge=0, description="Estimated number of visible people."
    )

    # Safety staffing
    police_required: bool = Field(..., description="Is police presence advisable?")
    police_count: int = Field(
        ..., ge=0, description="Recommended number of police personnel if required."
    )
    medical_required: bool = Field(..., description="Is on-site medical team advisable?")
    medical_staff_count: int = Field(
        ..., ge=0, description="Recommended number of medical staff if required."
    )

    # Activities and risk
    activities: List[str] = Field(
        default_factory=list,
        description="What people appear to be doing (e.g., queuing, pushing, bathing, walking, ritual, security check).",
    )
    harm_likelihood: Literal["very_low", "low", "medium", "high", "very_high"] = Field(
        ..., description="Likelihood of harm or escalation."
    )
    risk_assessment: str = Field(
        ..., description="Short justification of risks based on visual cues."
    )

    # Contextual notes
    chokepoints_detected: bool = Field(
        ..., description="Are there visible chokepoints/bottlenecks?"
    )
    emergency_access_clear: bool = Field(
        ..., description="Are emergency lanes or access paths visibly clear?"
    )
    notes: Optional[str] = Field(
        None,
        description="Any additional operational notes (lighting, signage, barriers, terrain, water proximity).",
    )

    @field_validator("police_count", "medical_staff_count")
    @classmethod
    def nonnegative_if_required(cls, v, info):
        # Already enforced by ge=0; this validator can be used for sanity checks if needed.
        return v


# Mahakumbh-specific adjustments
def bump_crowd_level(level: str) -> str:
    order = ["low", "medium", "high", "very_high"]
    if level not in order:
        return level
    idx = order.index(level)
    return order[min(idx + 1, len(order) - 1)]



def build_agent() -> Agent:
    # Uses GOOGLE_API_KEY from environment (do not hardcode keys)
    return Agent(
        model=Gemini(id="gemini-2.0-flash-exp"),
        description=(
            "You are a Mahakumbh crowd safety assessor. You analyze images to estimate crowd density, "
            "identify activities, detect chokepoints, and recommend police/medical staffing. "
            "Be conservative and safety-first. Base answers only on the visible image; if uncertain, say so."
        ),
        response_model=CrowdAssessment,
        markdown=False,
    )


def load_image_bytes(path: str) -> bytes:
    with open(path, "rb") as f:
        return f.read()


def load_video_frames(
    path: str,
    min_seconds: int = 5,
    max_frames: int = 12,
) -> List[bytes]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Cannot open video: {path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if fps <= 0 or frame_count <= 0:
        cap.release()
        raise ValueError("Invalid video metadata (fps/frame_count)")

    duration_sec = frame_count / fps
    # If the video is shorter than min_seconds, proceed with whatever duration is available

    # Target span is the first min_seconds seconds
    span_frames = int(min_seconds * fps)
    # Use available frames when video is shorter than min_seconds
    span_frames = min(span_frames, frame_count)
    if span_frames <= 0:
        span_frames = frame_count

    # Evenly sample up to max_frames indices from [0, span_frames)
    if max_frames <= 0:
        max_frames = 1
    step = max(1, span_frames // max_frames)
    indices = list(range(0, span_frames, step))[:max_frames]

    frames_bytes: List[bytes] = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
        ok, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not ok:
            continue
        frames_bytes.append(buf.tobytes())

    cap.release()
    if not frames_bytes:
        raise ValueError("Failed to extract frames from video")
    return frames_bytes

def main():
    parser = argparse.ArgumentParser(description="Mahakumbh Crowd Safety Agent (Agno + Gemini)")
    parser.add_argument(
        "image",
        nargs="?",
        default=DEFAULT_IMAGE_PATH,
        help="Path to the crowd image OR a directory (we'll pick the first image). Defaults to ./",
    )
    parser.add_argument(
        "--video",
        default=DEFAULT_VIDEO_PATH,
        help="Path to a recorded video file (defaults to ./video.mp4). If missing, falls back to image mode.",
    )
    parser.add_argument(
        "--min-seconds",
        type=int,
        default=5,
        help="Target seconds of video to cover (default: 5). If video is shorter, we'll use whatever is available.",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=12,
        help="Maximum frames to sample from the first min-seconds (default: 12)",
    )
    parser.add_argument(
        "--location",
        default="Mahakumbh, Prayagraj",
        help="Optional location/context",
    )
    parser.add_argument(
        "--context",
        default="Festival gathering near ghats. Consider queues, barriers, water proximity, access lanes.",
        help="Additional scene context for better assessment",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Stream model output to console while generating",
    )
    args = parser.parse_args()

    agent = build_agent()

    prompt = (
        "Analyze this image for Mahakumbh crowd safety (Indian spiritual gathering with surge risk):\n"
        f"- Location: {args.location}\n"
        f"- Context: {args.context}\n\n"
        "Instructions (STRICT):\n"
        "1) Estimate crowd density and visible headcount (approximate is OK; state uncertainty).\n"
        "2) Police deployment rule: If estimated visible people <= 100, set police_required = false and police_count = 0.\n"
        "   If > 100, set police_required = true and recommend police_count at approximately 20% of estimated_people.\n"
        "3) Medical: recommend only if scene indicates risk (e.g., pushing, heat, elderly, chokepoints, water proximity); justify briefly.\n"
        "4) List observed activities (e.g., queuing, pushing, bathing, ritual, walking, security check).\n"
        "5) Flag chokepoints/bottlenecks and whether emergency access seems clear.\n"
        "6) Assess harm likelihood from visual cues only (no assumptions beyond the image).\n"
        "7) Ground all outputs strictly on the visible image; keep it concise."
    )

    # Resolve image path: allow passing a directory (e.g., './') and pick the first image file found
    def resolve_image_path(p: str) -> str:
        if os.path.isdir(p):
            exts = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
            for name in sorted(os.listdir(p)):
                if name.lower().endswith(exts):
                    return os.path.join(p, name)
            raise FileNotFoundError(
                f"No image files found in directory: {p}. Supported extensions: {', '.join(exts)}"
            )
        return p

    images_payload: List[Image]
    # If default/provided video path exists, use video; else fallback to image
    if args.video and os.path.isfile(args.video):
        frames = load_video_frames(args.video, min_seconds=args.min_seconds, max_frames=args.max_frames)
        images_payload = [Image(content=b) for b in frames]
    else:
        resolved_path = resolve_image_path(args.image)
        img_bytes = load_image_bytes(resolved_path)
        images_payload = [Image(content=img_bytes)]

    # Send media via Agno media wrapper
    run = agent.run(
        prompt,
        images=images_payload,
        stream=args.stream,
    )

    # run.content is a Pydantic model instance (CrowdAssessment)
    result: CrowdAssessment = run.content  # type: ignore

    # Mahakumbh-specific fine-tuning rules
    # 1) Crowd level bias: surge potential -> bump one level
    result.crowd_level = bump_crowd_level(result.crowd_level)

    # 2) Staffing policy: police only if > 100 people; then ensure >= 20%
    try:
        people = max(0, int(result.estimated_people))
    except Exception:
        people = 0
    if people <= 100:
        result.police_required = False
        result.police_count = 0
    else:
        min_police = ceil(0.20 * people)
        if result.police_count < min_police:
            result.police_required = True
            result.police_count = min_police

    print(json.dumps(result.model_dump(), indent=2))


if __name__ == "__main__":
    main()