"""Inspect the downloaded PolarEMS raw datasets without modifying them."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import h5py
import pandas as pd


ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "raw"
HDF5_PATH = RAW_DIR / "met_data.h5"
SOE_DIR = RAW_DIR / "SOE_SFU"


def print_rule(title: str) -> None:
    print("\n" + "=" * 30)
    print(title)
    print("=" * 30)


def describe_time_columns(frame: pd.DataFrame) -> None:
    candidates = [
        column
        for column in frame.columns
        if any(token in str(column).lower() for token in ("date", "time", "timestamp"))
    ]
    for column in candidates:
        parsed = pd.to_datetime(frame[column], errors="coerce", utc=True)
        if parsed.notna().any():
            print(f"Date range ({column}): {parsed.min()} to {parsed.max()}")


def describe_frame(frame: pd.DataFrame) -> None:
    print(f"Shape: {frame.shape}")
    print(f"Columns: {list(frame.columns)}")
    print("Data types:")
    print(frame.dtypes.to_string())
    describe_time_columns(frame)
    print("Missing values:")
    print(frame.isna().sum().to_string())
    print("Basic numerical statistics:")
    numeric = frame.select_dtypes(include="number")
    if numeric.empty:
        print("No numeric columns.")
    else:
        print(numeric.describe().to_string())
    print("Sample:")
    print(frame.head(5).to_string(index=False))


def hdf5_tree(path: Path) -> list[str]:
    entries: list[str] = []
    with h5py.File(path, "r") as handle:
        def visit(name: str, item: Any) -> None:
            kind = "GROUP" if isinstance(item, h5py.Group) else "DATASET"
            details = ""
            if isinstance(item, h5py.Dataset):
                details = f" shape={item.shape} dtype={item.dtype}"
            entries.append(f"{name} [{kind}]{details}")

        handle.visititems(visit)
    return entries


def inspect_hdf5(path: Path) -> None:
    print_rule("MET_DATA.H5")
    if not path.exists():
        print(f"File not found: {path}")
        return

    try:
        with pd.HDFStore(path, mode="r") as store:
            pandas_keys = store.keys()
        print("PANDAS HDF5 FILE: yes")
        print(f"PANDAS KEYS: {pandas_keys or '(none)'}")
    except (ImportError, OSError, ValueError, TypeError) as error:
        pandas_keys = []
        print("PANDAS HDF5 FILE: no (or no pandas-readable store)")
        print(f"Pandas probe: {error}")

    print("HDF5 KEYS/GROUPS/DATASETS:")
    tree = hdf5_tree(path)
    print("\n".join(tree) if tree else "(none)")

    if not pandas_keys:
        print("No pandas-readable datasets/keys to tabulate.")
        return

    for key in pandas_keys:
        print(f"\nKEY: {key}")
        try:
            frame = pd.read_hdf(path, key=key)
            if isinstance(frame, pd.Series):
                frame = frame.to_frame()
            describe_frame(frame)
        except Exception as error:  # Keep inspecting other keys if one is unreadable.
            print(f"Unable to read key: {error}")


def read_soe_csv(path: Path) -> tuple[str, pd.DataFrame]:
    with path.open("r", encoding="utf-8-sig") as handle:
        title = handle.readline().strip().rstrip(",")
    frame = pd.read_csv(path, header=1)
    frame = frame.dropna(axis=1, how="all")
    return title, frame


def inspect_soe(directory: Path) -> None:
    print_rule("SOE_SFU")
    files = sorted(path for path in directory.iterdir() if path.is_file())
    print("FILES:")
    for path in files:
        print(f"- {path.name}")

    for path in files:
        if path.name.startswith("indicator_") and path.suffix.lower() == ".csv":
            print(f"\nFILE: {path.name}")
            print("Format: CSV")
            try:
                title, frame = read_soe_csv(path)
                print(f"Meaning/title from file metadata: {title}")
                describe_frame(frame)
                unit_columns = [column for column in frame.columns if "unit" in str(column).lower()]
                if unit_columns:
                    print("Units:")
                    for column in unit_columns:
                        print(frame[column].dropna().astype(str).value_counts().to_string())
            except Exception as error:
                print(f"Unable to read file: {error}")

    readme = directory / "README"
    print("\nREADME CONTENTS:")
    print(readme.read_text(encoding="utf-8-sig"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hdf5", type=Path, default=HDF5_PATH)
    parser.add_argument("--soe-dir", type=Path, default=SOE_DIR)
    args = parser.parse_args()
    inspect_hdf5(args.hdf5)
    inspect_soe(args.soe_dir)


if __name__ == "__main__":
    main()