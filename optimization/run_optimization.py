"""PolarEMS Predictive Optimization Master Runner.

Workflow:
1. Loads dataset and extracts 24h prediction window.
2. Invokes ML models to produce 24h forecast interface.
3. Generates GAMS include input file (optimization/input/forecast_data.inc).
4. Detects GAMS solver availability in PATH and standard install directories.
5. If GAMS is not found: reports clear message and exits cleanly.
6. If GAMS is available: executes polarems.gms, parses dispatch output, and audits physics.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from optimization.prepare_gams_input import generate_24h_gams_input
from optimization.read_gams_output import process_gams_outputs

OPT_DIR = BASE_DIR / "optimization"
GMS_FILE = OPT_DIR / "polarems.gms"


def detect_gams_executable() -> str | None:
    """Check if GAMS executable is installed and reachable."""
    # 1. Check system PATH
    gams_path = shutil.which("gams")
    if gams_path:
        return gams_path
        
    # 2. Check standard Windows installation locations (C:\GAMS\...)
    for drive in ["C:\\", "D:\\"]:
        gams_root = Path(drive) / "GAMS"
        if gams_root.exists():
            for sub in gams_root.glob("**/gams.exe"):
                if sub.is_file():
                    return str(sub)
    return None


def run_pipeline() -> None:
    print("=" * 70)
    print("PolarEMS Phase 4: Predictive EMS Optimization")
    print("=" * 70)
    
    # Step 1 & 2: Generate GAMS inputs from ML models
    print("[Step 1/3] Preparing 24-Hour ML Forecasting Inputs for GAMS...")
    forecast_data = generate_24h_gams_input()
    print(f"Horizon: {forecast_data['start_time']} to {forecast_data['end_time']} (24 hours)")
    
    # Step 3: Check GAMS availability
    print("[Step 2/3] Checking GAMS Solver Environment...")
    gams_exec = detect_gams_executable()
    
    if not gams_exec:
        print()
        print("*" * 70)
        print("GAMS executable not found. Phase 4 files are prepared, but optimization cannot be executed until GAMS is installed.")
        print("*" * 70)
        print()
        print("Integration Status:")
        print("  - GAMS Model File:        optimization/polarems.gms [READY]")
        print("  - Input Data Generator:   optimization/prepare_gams_input.py [READY]")
        print("  - Output Data Parser:     optimization/read_gams_output.py [READY]")
        print("  - 24-Hour ML Forecast:    optimization/input/forecast_data.inc [GENERATED]")
        print()
        print("Once GAMS is installed, simply re-run: python optimization/run_optimization.py")
        print("=" * 70)
        print()
        return
        
    # Step 4: Execute GAMS Optimization
    print(f"[Step 3/3] Executing GAMS optimization model using: {gams_exec}...")
    cmd = [gams_exec, "polarems.gms", "lo=2"]
    result = subprocess.run(cmd, cwd=str(OPT_DIR), capture_output=True, text=True)
    
    if result.returncode != 0:
        print("GAMS Execution Error:")
        print(result.stderr if result.stderr else result.stdout)
        return
        
    print("GAMS optimization executed successfully.")
    
    # Step 5: Process and Validate Output
    df_dispatch, summary, passed = process_gams_outputs()
    print()
    print("=" * 70)
    print("OPTIMIZATION DISPATCH SUMMARY (24-Hour Horizon)")
    print("=" * 70)
    print(f"Total Load Energy:              {summary['total_load_energy_kwh']:.2f} kWh")
    print(f"Renewable Energy Available:     {summary['renewable_energy_available_kwh']:.2f} kWh")
    print(f"Renewable Energy Used:          {summary['renewable_energy_used_kwh']:.2f} kWh")
    print(f"Renewable Curtailment:          {summary['renewable_curtailment_kwh']:.2f} kWh")
    print(f"Diesel Generation:              {summary['diesel_generation_kwh']:.2f} kWh")
    print(f"Diesel Fuel Consumed:           {summary['diesel_fuel_consumed_litres']:.2f} litres")
    print(f"Minimum Battery SOC:            {summary['minimum_soc']*100:.1f}%")
    print(f"Final Battery SOC:              {summary['final_soc']*100:.1f}%")
    print(f"Total Energy Not Served (ENS):  {summary['total_ens_kwh']:.2f} kWh")
    print(f"Physical Validation Audit:      {'PASS' if passed else 'FAIL'}")
    print("=" * 70)
    print()


if __name__ == "__main__":
    run_pipeline()
