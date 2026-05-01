import urllib.request, json
import urllib.error

# login as clinic admin to get token
req1 = urllib.request.Request('http://localhost:8000/api/users/auth/login/', data=json.dumps({"username":"clinicadmin", "password":"admin123"}).encode(), headers={'Content-Type': 'application/json'})
token = json.loads(urllib.request.urlopen(req1).read().decode())['access']

# perform POST to add doctor
data = {
    "name": "Dr test3",
    "specialty": "cardiologist",
    "username": "doc3",
    "password": "Password1!",
    "email": "doc3@test.com",
    "clinic_id": 1,
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
