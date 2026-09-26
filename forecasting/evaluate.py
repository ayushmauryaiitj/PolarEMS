from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

"""Evaluation metrics for PolarEMS forecasting models."""


from typing import Dict
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, target_name: str = "") -> Dict[str, float]:
    """Calculate MAE, RMSE, R2, and safe MAPE for time series forecasts."""
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    
    # Clip negative predictions to zero if target is physical generation or load
    y_pred_clipped = np.maximum(0.0, y_pred)
    
    mae = float(mean_absolute_error(y_true, y_pred_clipped))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred_clipped)))
    r2 = float(r2_score(y_true, y_pred_clipped))
    
    # Safe MAPE: handle near-zero targets (especially common in solar night & calm wind)
    # Threshold at 1.0 kW to avoid division by zero or inflated small percentages
    valid_mask = y_true >= 1.0
    if valid_mask.sum() > 0:
        mape = float(np.mean(np.abs((y_true[valid_mask] - y_pred_clipped[valid_mask]) / y_true[valid_mask])) * 100.0)
    else:
        mape = 0.0
        
    # Normalized RMSE (NRMSE): RMSE / range
    y_range = float(np.max(y_true) - np.min(y_true))
    nrmse = float(rmse / y_range) if y_range > 0 else 0.0
    
    return {
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2": round(r2, 4),
        "MAPE": round(mape, 2),
        "NRMSE": round(nrmse, 4)
    }