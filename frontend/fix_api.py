with open('src/lib/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const API_BASE = 'http://localhost:8000';",
    "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8002';"
)

with open('src/lib/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("api.ts fixed!")
