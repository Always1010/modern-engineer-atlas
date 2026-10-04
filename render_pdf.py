"""Render the complete edition using its reviewed layout and lossless vector optimization."""
import argparse
from pathlib import Path
import subprocess
import sys
from book_pipeline.vectorize_pdf import vectorize


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True, help='Prepared build directory')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--version', required=True)
    parser.add_argument('--date', required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    raster = args.input / 'raster-layout.pdf'
    subprocess.run([sys.executable, str(Path(__file__).parent / 'book_pipeline/reviewed_pdf.py'), '--input', str(args.input), '--output', str(raster), '--version', args.version, '--date', args.date], check=True)
    vectorize(raster, args.output, args.input)
    print(args.output)


if __name__ == '__main__':
    main()
