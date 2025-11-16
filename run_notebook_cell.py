import json
from pathlib import Path
path = Path('python/kaggel-dataset-first-dataset.ipynb')
data = json.loads(path.read_text())
code = ''.join(data['cells'][0]['source'])
exec(compile(code, str(path), 'exec'))
