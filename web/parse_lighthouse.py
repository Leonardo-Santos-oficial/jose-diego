import json
import re
import sys

try:
    with open(r'D:\leo\Projetos\Projeto_José_Diego_dos_Santos\web\test-results\lighthouse-report.html', 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'window\.__LIGHTHOUSE_JSON__\s*=\s*({.*?});', content, re.DOTALL)
    if not match:
        print("Could not find Lighthouse JSON in the file.")
        sys.exit(1)

    data = json.loads(match.group(1))

    if 'runtimeError' in data:
        print(f"Runtime Error: {data['runtimeError']['message']}")
        # Continue to see if partial results exist

    categories = data.get('categories', {})
    audits = data.get('audits', {})

    print("\n--- Scores ---")
    for cat_id, cat_data in categories.items():
        score = cat_data.get('score')
        print(f"{cat_data.get('title')}: {int(score * 100) if score is not None else 'N/A'}")

    print("\n--- Failed Audits (Score < 1) ---")
    for cat_id, cat_data in categories.items():
        print(f"\nCategory: {cat_data.get('title')}")
        for audit_ref in cat_data.get('auditRefs', []):
            audit_id = audit_ref['id']
            audit = audits.get(audit_id)
            if audit and audit.get('score') is not None and audit.get('score') < 1:
                # Filter out manual audits or informative ones if needed, but score < 1 usually means improvement needed
                # Some audits have scoreDisplayMode 'informative' or 'manual'
                if audit.get('scoreDisplayMode') in ['informative', 'manual', 'notApplicable']:
                    continue
                
                print(f"- {audit.get('title')} (Score: {audit.get('score')})")
                if audit.get('displayValue'):
                    print(f"  Value: {audit.get('displayValue')}")

except Exception as e:
    print(f"Error parsing report: {e}")
