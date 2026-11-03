"""Twenty separate sessions exercising private saving; never accepts real user lists implicitly."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import http.cookiejar
import json
from pathlib import Path
import re
import ssl
import statistics
import time
import urllib.parse
import urllib.request
import uuid

parser=argparse.ArgumentParser()
parser.add_argument('base_url')
parser.add_argument('--users',type=Path,required=True)
parser.add_argument('--report',type=Path,required=True)
parser.add_argument('--insecure-localhost',action='store_true')
args=parser.parse_args()
base=args.base_url.rstrip('/')
if args.insecure_localhost and base not in {'https://localhost','http://127.0.0.1:8001'}:
    parser.error('Test certificate bypass is restricted to localhost test targets.')
if not base.startswith('https://') and base!='http://127.0.0.1:8001':
    parser.error('Use HTTPS for deployed tests.')
users=json.loads(args.users.read_text())
if len(users)!=20 or any(not u['username'].startswith('capacity-test-') for u in users):
    parser.error('Provide exactly 20 synthetic capacity-test accounts.')
ctx=ssl._create_unverified_context() if args.insecure_localhost else ssl.create_default_context()


def session(user):
    jar=http.cookiejar.CookieJar()
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar),urllib.request.HTTPSHandler(context=ctx))
    def request(path,data=None,method=None,headers=None):
        token=next((c.value for c in jar if c.name=='csrftoken'),'')
        req=urllib.request.Request(base+path,data=data,method=method,headers={'X-CSRFToken':token,'Origin':base,**(headers or {})})
        with opener.open(req,timeout=30) as response:
            return response.read(),response.url
    html,_=request('/accounts/login/')
    token=re.search(rb'name="csrfmiddlewaretoken" value="([^"]+)"',html).group(1).decode()
    _,url=request('/accounts/login/',urllib.parse.urlencode({**user,'csrfmiddlewaretoken':token}).encode())
    if '/accounts/login/' in url:
        raise RuntimeError('Synthetic sign-in failed')
    key='grade7-capacity-check-'+uuid.uuid4().hex
    timings=[]
    for revision in range(3):
        started=time.monotonic()
        payload={'revision':revision,'title':'Capacity-test work','payload':{'format':1,'raw':json.dumps([{'observation':'Synthetic test', 'stage':revision}])}}
        body,_=request('/learning/api/work/'+key+'/',json.dumps(payload).encode(),'PUT',{'Content-Type':'application/json'})
        if json.loads(body)['revision']!=revision+1:
            raise RuntimeError('Revision check failed')
        request('/learning/api/work/'+key+'/')
        request('/learning/')
        timings.append(time.monotonic()-started)
    request('/learning/api/work/'+key+'/',json.dumps({'revision':3}).encode(),'DELETE',{'Content-Type':'application/json'})
    return timings


errors=0;timings=[]
with ThreadPoolExecutor(max_workers=20) as pool:
    futures=[pool.submit(session,user) for user in users]
    for future in futures:
        try:timings.extend(future.result())
        except Exception:errors+=1
ordered=sorted(timings)
p95=ordered[min(len(ordered)-1,int(len(ordered)*.95))] if ordered else None
report={'sessions':20,'completed_sessions':20-errors,'errors':errors,'p95_work_cycle_seconds':p95,
        'target':'zero errors and p95 complete save/read/dashboard cycle below five seconds',
        'passed':errors==0 and p95 is not None and p95<5}
args.report.write_text(json.dumps(report,indent=2))
print(json.dumps(report))
raise SystemExit(0 if report['passed'] else 1)
