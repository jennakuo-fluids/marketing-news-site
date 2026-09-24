import pandas as pd, json, math, re

df = pd.read_excel('Marketing_news_search_results__5_.xlsx')

def s(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return ''
    return str(v).strip()

def multi(v):
    v = s(v).replace('，', '、').replace(',', '、')
    return [p.strip() for p in v.split('、') if p.strip()]

recs = []
for _, r in df.iterrows():
    summ = s(r['Full Summary'])
    bullets = [b.strip(' •\t') for b in re.split(r'\n\s*|(?<!^)•', summ) if b.strip(' •\t')]
    rel = s(r['Relevancy'])
    warn = ''
    if rel.startswith('⚠'):
        parts = rel.split('\n', 1)
        warn = re.sub(r'^[⚠️\s]+', '', parts[0]).strip()
        rel = parts[1].strip() if len(parts) > 1 else ''
    recs.append({
        'id':   s(r['News ID']),
        'zh':   s(r['Chinese Title']),
        'en':   s(r['Article Title']),
        'date': s(r['Article Date'])[:10],
        'site': s(r['Website Name']),
        'url':  s(r['Article URL']),
        'st':   s(r['Review Status']),
        'co':   multi(r['公司']),
        'ind':  multi(r['產業']),
        'ev':   multi(r['事件類型']),
        'cat':  multi(r['Matched Category']),
        'kw':   multi(r['Matched Keywords']),
        'sum':  bullets[:6],
        'rel':  rel,
        'warn': warn,
    })

json.dump(recs, open('news.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('records', len(recs))
