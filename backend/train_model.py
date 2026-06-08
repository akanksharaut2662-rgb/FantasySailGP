"""
train_model.py
One-time script: train the Ridge Regression optimizer and save to models/optimizer.pkl.

Run from the backend/ directory:
    python train_model.py
"""

import sys
from pathlib import Path

# Allow imports from app/ when run as a script
sys.path.insert(0, str(Path(__file__).parent))

from app.optimizer import train_optimizer

if __name__ == "__main__":
    print("=" * 50)
    print("SailGP Fantasy Predictor — Training Optimizer")
    print("=" * 50)
    pipeline = train_optimizer()
    print("Done. Model saved to models/optimizer.pkl")
