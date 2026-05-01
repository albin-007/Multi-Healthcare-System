import requests

login_url = 'http://127.0.0.1:8000/api/users/auth/login/'
me_url = 'http://127.0.0.1:8000/api/users/profiles/me/'

payload = {
    'username': 'labcenter',
    'password': 'password123'  # Assuming this is the password
}

try:
    auth_res = requests.post(login_url, json=payload)
    print(f"LOGIN STATUS: {auth_res.status_code}")
    if auth_res.status_code == 200:
        access = auth_res.json()['access']
        print("LOGIN SUCCESS")
        
        headers = {'Authorization': f'Bearer {access}'}
        me_res = requests.get(me_url, headers=headers)
        print(f"ME STATUS: {me_res.status_code}")
        print(f"ME DATA: {me_res.json()}")
    else:
        print(f"LOGIN FAILED: {auth_res.text}")
except Exception as e:
    print(f"ERROR: {str(e)}")
