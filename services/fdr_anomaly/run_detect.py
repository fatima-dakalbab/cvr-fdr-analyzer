import argparse
import sys

from services.fdr_anomaly.detect import detect_to_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Run unsupervised FDR anomaly detection.")
    parser.add_argument("path", help="Path to CSV or Excel file with Session Time column.")
    args = parser.parse_args()

    try:
        output = detect_to_json(args.path)
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
