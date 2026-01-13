from app.main import app
import json
import os

routes = []
for route in app.routes:
    methods = list(getattr(route, "methods", []))
    path = getattr(route, "path", "unknown")
    routes.append({"methods": methods, "path": path})

# Save to json for easy parsing and avoiding terminal encoding issues
with open("routes_final.json", "w") as f:
    json.dump(routes, f, indent=2)

print(f"Total routes found: {len(routes)}")
