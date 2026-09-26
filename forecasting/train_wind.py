from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

"""Train baseline models for Wind generation forecasting."""

import sys
from pathlib import Path


from typing import Any, Dict, Tuple
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor

from forecasting.features import WIND_FEATURES
from forecasting.evaluate import calculate_metrics


def train_and_evaluate_wind_models(
    df_train: pd.DataFrame,
    df_val: pd.DataFrame,
    df_test: pd.DataFrame
) -> Tuple[Dict[str, Any], pd.DataFrame, Any, str]:
    """Train Linear Regression, Random Forest, and HistGradientBoosting for Wind forecasting."""
    X_train = df_train[WIND_FEATURES]
    y_train = df_train["wind_kw"].to_numpy()
    
    X_val = df_val[WIND_FEATURES]
    y_val = df_val["wind_kw"].to_numpy()
    
    X_test = df_test[WIND_FEATURES]
    y_test = df_test["wind_kw"].to_numpy()
    
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=100, max_depth=8, random_state=42)
    }
    
    results = []
    trained_models = {}
    best_model_name = ""
    best_val_rmse = float("inf")
    best_model = None
    
    for name, model in models.items():
        # Train
        model.fit(X_train, y_train)
        trained_models[name] = model
        
        # Predict
        val_pred = model.predict(X_val)
        test_pred = model.predict(X_test)
        
        # Evaluate
        val_metrics = calculate_metrics(y_val, val_pred, "wind_kw")
        test_metrics = calculate_metrics(y_test, test_pred, "wind_kw")
        
        results.append({
            "target": "wind_kw",
            "model": name,
            "val_MAE": val_metrics["MAE"],
            "val_RMSE": val_metrics["RMSE"],
            "val_R2": val_metrics["R2"],
            "val_MAPE": val_metrics["MAPE"],
            "test_MAE": test_metrics["MAE"],
            "test_RMSE": test_metrics["RMSE"],
            "test_R2": test_metrics["R2"],
            "test_MAPE": test_metrics["MAPE"],
        })
        
        if val_metrics["RMSE"] < best_val_rmse:
            best_val_rmse = val_metrics["RMSE"]
            best_model_name = name
            best_model = model
            
    df_results = pd.DataFrame(results)
    return trained_models, df_results, best_model, best_model_name