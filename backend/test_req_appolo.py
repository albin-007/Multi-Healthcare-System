import urllib.request, json
import urllib.error

# login as clinic admin to get token
req1 = urllib.request.Request('http://localhost:8000/api/users/auth/login/', data=json.dumps({"username":"appolo_clinic", "password":"Password123!"}).encode(), headers={'Content-Type': 'application/json'})
token = json.loads(urllib.request.urlopen(req1).read().decode())['access']

# perform POST to add doctor
data = {
    "name": "Dr test4",
    "specialty": "cardiologist",
    "username": "appolo_doc",
    "password": "Password123!",
    "email": "appdoc@test.com",
    "clinic_id": 4,
    "qualification": "MBBS",
    "license_no": "123"
}
req2 = urllib.request.Request(
    'http://localhost:8000/api/users/doctors/', 
    data=json.dumps(data).encode(), 
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
try:
    print(urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
