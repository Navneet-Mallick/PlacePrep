"""Quick sanity check for the proctoring state machine."""

import base64
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))

from proctoring import check_proctoring, reset_proctoring_state  # noqa: E402


def encode(frame):
    _, buf = cv2.imencode(".jpg", frame)
    return base64.b64encode(buf).decode()


def run():
    blank = encode(np.zeros((480, 640, 3), dtype=np.uint8))

    print("=" * 56)
    print("PROCTORING STATE MACHINE TEST")
    print("=" * 56)

    reset_proctoring_state()
    print("\nEmpty frames (no face) — should warn 3x, then violate:")
    for i in range(1, 6):
        r = check_proctoring(blank)
        print(f"  frame {i}: {r['status']:<9} severity={r['severity']:<7} {r['message']}")

    print("\nAfter reset — counters should start over:")
    reset_proctoring_state()
    r = check_proctoring(blank)
    print(f"  frame 1: {r['status']:<9} severity={r['severity']}")

    print("\nMalformed input handling:")
    r = check_proctoring("not-a-real-image")
    print(f"  status={r['status']} message={r['message']}")

    print("\n" + "=" * 56)
    print("Done")


if __name__ == "__main__":
    run()
