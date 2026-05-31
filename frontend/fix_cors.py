with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'allow_origins=["*"], # In production, lock down to frontend port',
    'allow_origins=["http://localhost:8081", "http://localhost:8080", "http://127.0.0.1:8081", "http://localhost:5173"],'
)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("CORS fixed!")
