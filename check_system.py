"""
System status checker for PlacementPrep
"""
import subprocess
import sys
from pathlib import Path

def check_python_packages():
    """Check if required Python packages are installed"""
    print("\n📦 Checking Python Packages...")
    required = [
        'django', 'djangorestframework', 'psycopg2', 
        'scikit-learn', 'spacy', 'joblib', 'fastapi', 'uvicorn'
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package.replace('-', '_'))
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} - MISSING")
            missing.append(package)
    
    return len(missing) == 0

def check_models():
    """Check if ML models are trained"""
    print("\n🤖 Checking ML Models...")
    project_root = Path(__file__).parent
    models_dir = project_root / 'ml' / 'models'
    
    models = {
        'Resume Classifier': models_dir / 'resume_role_classifier.joblib',
        'Aptitude Classifier': models_dir / 'aptitude_level_classifier.joblib'
    }
    
    all_exist = True
    for name, path in models.items():
        if path.exists():
            size = path.stat().st_size / 1024  # KB
            print(f"  ✅ {name} ({size:.1f} KB)")
        else:
            print(f"  ❌ {name} - NOT FOUND")
            all_exist = False
    
    return all_exist

def check_database():
    """Check database connection"""
    print("\n💾 Checking Database...")
    try:
        import django
        import os
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        print("  ✅ PostgreSQL connection successful")
        
        # Check tables
        from api.models import AptitudeQuestion, TechnicalQuestion
        aptitude_count = AptitudeQuestion.objects.count()
        technical_count = TechnicalQuestion.objects.count()
        
        print(f"  ✅ Aptitude Questions: {aptitude_count}")
        print(f"  ✅ Technical Questions: {technical_count}")
        
        return True
    except Exception as e:
        print(f"  ❌ Database error: {e}")
        return False

def check_ports():
    """Check if required ports are available"""
    print("\n🔌 Checking Ports...")
    import socket
    
    ports = {
        8001: 'Django Backend',
        8000: 'ML API',
        5173: 'Frontend',
        5432: 'PostgreSQL'
    }
    
    for port, service in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            print(f"  ⚠️  Port {port} ({service}) - IN USE")
        else:
            print(f"  ✅ Port {port} ({service}) - AVAILABLE")

def main():
    print("="*60)
    print("  PlacementPrep - System Status Check")
    print("="*60)
    
    checks = [
        ("Python Packages", check_python_packages),
        ("ML Models", check_models),
        ("Database", check_database),
        ("Ports", check_ports),
    ]
    
    results = []
    for name, check_fn in checks:
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Error checking {name}: {e}")
            results.append((name, False))
    
    print("\n" + "="*60)
    print("  Summary")
    print("="*60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name}: {status}")
    
    all_pass = all(r[1] for r in results)
    
    if all_pass:
        print("\n🎉 All checks passed! System is ready.")
        print("\nRun: start.bat  (to start all services)")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\nRefer to: TESTING_GUIDE.md for troubleshooting")
    
    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())
