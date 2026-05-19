#!/bin/bash
# Create a virtual environment to bypass PEP 668 (externally-managed-environment)
python3 -m venv venv
source venv/bin/activate

# Install requirements inside the virtual environment
pip install -r requirements.txt

# Run Django commands
python manage.py collectstatic --noinput
python manage.py migrate
