import jwt, time, json, sys, urllib.request
KEY=open('/Users/woo/.appstoreconnect/private/AuthKey_XC65QPNJJK.p8').read()
KID='XC65QPNJJK'; ISS='aa143c58-e40f-4d4f-b5a4-b7e7d87c2071'
def token():
    now=int(time.time())
    return jwt.encode({'iss':ISS,'iat':now,'exp':now+1200,'aud':'appstoreconnect-v1'},KEY,algorithm='ES256',headers={'kid':KID,'typ':'JWT'})
def call(method,path,body=None):
    req=urllib.request.Request('https://api.appstoreconnect.apple.com'+path,method=method,
        data=json.dumps(body).encode() if body else None,
        headers={'Authorization':'Bearer '+token(),'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=30) as r: return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
if __name__=='__main__':
    m,p=sys.argv[1],sys.argv[2]
    b=json.load(open(sys.argv[3])) if len(sys.argv)>3 else None
    s,d=call(m,p,b); print(s); print(json.dumps(d,ensure_ascii=False,indent=1)[:3000])
