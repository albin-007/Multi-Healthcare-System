import urllib.request, json, urllib.error

url = 'http://localhost:8000/api/users/auth/login/'
data = {'username': 'appolo_clinic', 'password': 'admin123'}

req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(f'Status: {response.status}')
        print(f'Response: {response.read().decode()}')
except urllib.error.HTTPError as e:
    print(f'Error status: {e.code}')
    print(f'Error response: {e.read().decode()}')
except Exception as e:
    print(f'Error: {str(e)}')
