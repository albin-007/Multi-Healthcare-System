import urllib.request, json, urllib.error

# 1. Login to get token
base_url = 'http://localhost:8000/api/'
auth_url = base_url + 'users/auth/login/'
data = {'username': 'appolo_clinic', 'password': 'admin123'}

req = urllib.request.Request(auth_url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        auth_data = json.loads(response.read().decode())
        access = auth_data['access']
        print(f'Login Success. Token: {access[:20]}...')
        
        # 2. Call /me/
        me_url = base_url + 'users/profiles/me/'
        me_req = urllib.request.Request(me_url, headers={'Authorization': f'Bearer {access}'})
        
        with urllib.request.urlopen(me_req) as me_response:
            print(f'Me Success Status: {me_response.status}')
            print(f'Me Data: {me_response.read().decode()}')
            
except urllib.error.HTTPError as e:
    print(f'Error status: {e.code}')
    print(f'Error response: {e.read().decode()}')
except Exception as e:
    print(f'Error: {str(e)}')
