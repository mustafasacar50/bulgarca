import json
import os

bundle_path = r'c:\Users\Mustafa\Downloads\bulgarca\docs\BULGARCA_IMPORT_BUNDLE_014_FULL_SOURCE_TEXT_WORD_SENTENCE_PROCESSING.json'
base_dir = r'c:\Users\Mustafa\Downloads\bulgarca'

with open(bundle_path, 'r', encoding='utf-8') as f:
    bundle = json.load(f)

for file_info in bundle.get('files', []):
    path = file_info['path']
    content = file_info['content']
    full_path = os.path.join(base_dir, path)
    
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        if isinstance(content, str):
            f.write(content)
        else:
            json.dump(content, f, ensure_ascii=False, indent=2)
    print(f"Created/Updated: {path}")

# Handle patches
manifest_path = os.path.join(base_dir, 'public/data/manifest.json')
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for patch in bundle.get('patches', []):
    if patch['operation'] == 'merge_manifest_lessons':
        new_lessons = patch['data'].get('lessons', [])
        for nl in new_lessons:
            # Map lesson_id to id for manifest compatibility
            lid = nl.get('lesson_id') or nl.get('id')
            if not any(l.get('id') == lid for l in manifest['lessons']):
                manifest['lessons'].append({
                    "id": lid,
                    "title_tr": nl['title_tr'],
                    "level": nl['level'],
                    "order": nl['order'],
                    "path": nl['path'],
                    "exercise_path": nl['exercise_path'],
                    "summary_tr": nl.get('summary_tr', nl.get('subtitle_tr', ''))
                })
        
        # Handle rule_files (manifest rules is a list of objects)
        new_rule_files = patch['data'].get('rule_files', [])
        for rf in new_rule_files:
            if not any(r.get('filePath') == rf for r in manifest.get('rules', [])):
                manifest['rules'].append({
                    "id": rf.split('/')[-1].replace('.json', ''),
                    "title": "Ek Dilbilgisi Kuralları",
                    "filePath": rf
                })
        
        # Handle glossary_files (manifest glossaries is a list of strings)
        new_glossaries = patch['data'].get('glossary_files', [])
        for gf in new_glossaries:
            if gf not in manifest.get('glossaries', []):
                manifest['glossaries'].append(gf)
        
    elif patch['operation'] == 'merge_sources':
        source_index_path = os.path.join(base_dir, 'public/data/sources/source-index.json')
        with open(source_index_path, 'r', encoding='utf-8') as f:
            sources = json.load(f)
        
        new_sources = patch['data']
        for ns in new_sources:
            ns_id = ns.get('source_id') or ns.get('id')
            found = False
            for s in sources:
                s_id = s.get('id') or s.get('source_id')
                if s_id == ns_id:
                    s.update(ns)
                    found = True
                    break
            if not found:
                sources.append(ns)
        
        with open(source_index_path, 'w', encoding='utf-8') as f:
            json.dump(sources, f, ensure_ascii=False, indent=2)
        print("Updated sources index.")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print("Updated manifest.")
