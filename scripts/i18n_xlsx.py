#!/usr/bin/env python3
"""Export/import translations for human review.
  python3 scripts/i18n_xlsx.py export hi out.xlsx
  python3 scripts/i18n_xlsx.py import hi reviewed.xlsx
Column D ("Your correction") wins over C ("Draft") on import; blank D keeps C."""
import json, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill

def export(lang, out):
    en = json.load(open('messages/en.json'))
    cur = json.load(open(f'messages/{lang}.json'))
    wb = Workbook(); ws = wb.active; ws.title = 'Review'
    ws.append(['#', 'English (do not edit)', 'Draft (Claude)', 'Your correction (leave blank if OK)', 'Notes'])
    for i, k in enumerate(en, 1):
        ws.append([i, k, cur.get(k, ''), '', 'not translated yet' if k not in cur else ''])
    for c, w in zip('ABCDE', [5, 60, 60, 60, 28]): ws.column_dimensions[c].width = w
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='333333')
    for row in ws.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        row[3].fill = PatternFill('solid', fgColor='FFF4CC')
    ws.freeze_panes = 'A2'
    g = wb.create_sheet('Style questions')
    g.append(['Question', 'Draft choice', 'Your answer'])
    for r in [
        ('Tone: आप (formal) vs तुम/तू', 'आप', ''),
        ('Technical words: keep English (PDF, पेज, इमेज, अपलोड) or Hindi (पृष्ठ, छवि)?', 'Common English words in Devanagari', ''),
        ('"Merge" / "Split" / "Compress" / "Rotate" / "Sign"', 'मर्ज / स्प्लिट / कंप्रेस / रोटेट / साइन', ''),
        ('"Free · no signup"', 'मुफ़्त · साइनअप की ज़रूरत नहीं', ''),
        ('Numerals: 0-9 or ०-९', '0-9', ''),
    ]: g.append(list(r))
    for c, w in zip('ABC', [70, 45, 45]): g.column_dimensions[c].width = w
    wb.save(out); print('wrote', out, len(en), 'strings')

def imp(lang, src):
    en = json.load(open('messages/en.json')); path = f'messages/{lang}.json'
    cur = json.load(open(path)); n = 0
    for row in load_workbook(src)['Review'].iter_rows(min_row=2, values_only=True):
        key, draft, fix = row[1], row[2], row[3]
        val = (fix or draft or '').strip()
        if key in en and val: cur[key] = val; n += 1
    json.dump(dict(sorted(cur.items())), open(path, 'w'), ensure_ascii=False, indent=2); print('imported', n)

if __name__ == '__main__':
    cmd, lang, f = sys.argv[1:4]
    (export if cmd == 'export' else imp)(lang, f)
