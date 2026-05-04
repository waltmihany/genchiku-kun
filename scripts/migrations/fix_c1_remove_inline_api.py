from pathlib import Path

p = Path('/home/user/genchiku-kun-v3/src/legacy/gameCore.js')
text = p.read_text()
start_marker = 'export function getTitleViewModel() {'
end_marker = 'export function runResultReviewReport() {'
start = text.find(start_marker)
if start == -1:
    raise SystemExit('start marker not found')
end = text.find(end_marker, start)
if end == -1:
    raise SystemExit('end marker not found')
brace = 0
end_pos = None
for i in range(end, len(text)):
    ch = text[i]
    if ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
        if brace == 0:
            end_pos = i + 1
            break
if end_pos is None:
    raise SystemExit('end pos not found')
new_text = text[:start] + text[end_pos:]
p.write_text(new_text)
print('removed inline api block')
