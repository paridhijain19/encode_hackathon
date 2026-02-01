"""
Quick Test Runner
Run all tests with a simple command.
"""
import subprocess
import sys
import os

def main():
    """Run pytest with appropriate settings."""
    # Change to project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)
    
    # Run pytest with verbose output
    args = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "-x",  # Stop on first failure
        "--timeout=120",  # 2 minute timeout per test
    ]
    
    # Add any command line args
    args.extend(sys.argv[1:])
    
    print("=" * 60)
    print("AMBLE TEST SUITE")
    print("=" * 60)
    print(f"Running: {' '.join(args)}")
    print()
    
    result = subprocess.run(args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
