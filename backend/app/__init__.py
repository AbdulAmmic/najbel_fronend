# Package initialization
# When Leapcell runs: python app/__init__.py  — this block starts the server.
# When imported as a package, this block is skipped.
if __name__ == "__main__":
    import os
    import sys

    # __file__ is /app/app/__init__.py
    # We need /app/ (the parent of the 'app' package) on sys.path
    # so that uvicorn can resolve "app.main:app"
    _pkg_parent = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if _pkg_parent not in sys.path:
        sys.path.insert(0, _pkg_parent)

    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
